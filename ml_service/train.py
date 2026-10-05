"""
SCAMCHECK ML training pipeline.

Datasets
--------
1. UCI SMS Spam Collection (always used; downloaded automatically if missing).
2. EMSCAD / "Real or Fake Job Posting" (optional, recommended). Download
   `fake_job_postings.csv` from Kaggle and place it in `ml_service/data/`.
   When present it is merged in so the model learns recruitment-fraud language,
   not just generic SMS spam.

Output (ml_service/models/)
---------------------------
- model.pkl        calibrated classifier (predict_proba gives real probabilities)
- vectorizer.pkl   fitted TF-IDF vectorizer
- evaluation.json  datasets, sizes, test metrics and the tuned decision threshold
"""
import os
import json
import logging
import pickle
import zipfile
from io import BytesIO

import numpy as np
import pandas as pd
import requests
import sklearn
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVC

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")
SMS_PATH = os.path.join(DATA_DIR, "SMSSpamCollection")
JOBS_PATH = os.path.join(DATA_DIR, "fake_job_postings.csv")
MODEL_VERSION = "2.0.0"
RANDOM_STATE = 42


def download_sms_dataset():
    if os.path.exists(SMS_PATH):
        logger.info("SMS dataset already present.")
        return SMS_PATH
    logger.info("Downloading SMS Spam Collection...")
    try:
        response = requests.get(DATA_URL, timeout=30)
        response.raise_for_status()
        with zipfile.ZipFile(BytesIO(response.content)) as z:
            z.extractall(DATA_DIR)
        return SMS_PATH
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        return None


def load_sms(path):
    df = pd.read_csv(path, sep="\t", header=None, names=["label", "text"], quoting=3)
    df["label"] = df["label"].map({"ham": 0, "spam": 1})
    df["source"] = "sms"
    return df.dropna(subset=["label", "text"])


def load_job_postings(path):
    """EMSCAD: one row per job posting, `fraudulent` is the label."""
    raw = pd.read_csv(path)
    text_cols = [c for c in ["title", "company_profile", "description", "requirements", "benefits"] if c in raw.columns]
    text = raw[text_cols].fillna("").astype(str).agg(" ".join, axis=1).str.replace(r"\s+", " ", regex=True).str.strip()
    df = pd.DataFrame({"text": text, "label": raw["fraudulent"].astype(int), "source": "jobs"})
    return df[df["text"].str.len() > 20]


def probabilities(model, X):
    return model.predict_proba(X)[:, 1]


def evaluate(y_true, prob, threshold):
    pred = (prob >= threshold).astype(int)
    return {
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, prob)),
        "confusion_matrix": confusion_matrix(y_true, pred).tolist(),
    }


def tune_threshold(y_true, prob):
    """Pick the threshold with the best F1 on validation data, preferring higher recall on ties."""
    best_t, best_f1 = 0.5, -1.0
    for t in np.arange(0.15, 0.81, 0.01):
        f1 = f1_score(y_true, (prob >= t).astype(int), zero_division=0)
        if f1 > best_f1 + 1e-9:
            best_t, best_f1 = float(round(t, 2)), f1
    return best_t


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    sms_path = download_sms_dataset()
    if not sms_path:
        logger.error("SMS dataset unavailable; aborting training.")
        return

    frames = [load_sms(sms_path)]
    datasets = ["UCI SMS Spam Collection"]
    if os.path.exists(JOBS_PATH):
        frames.append(load_job_postings(JOBS_PATH))
        datasets.append("EMSCAD Real or Fake Job Postings")
    else:
        logger.warning(
            "fake_job_postings.csv not found in data/. Training on SMS spam only; "
            "add the EMSCAD dataset for recruitment-specific accuracy."
        )

    df = pd.concat(frames, ignore_index=True)
    logger.info(f"Dataset size: {len(df)} | class balance:\n{df['label'].value_counts()}")

    # Stratify on source+label so every split sees both datasets in proportion
    strata = df["source"] + "_" + df["label"].astype(str)
    X_temp, X_test, y_temp, y_test, s_temp, _ = train_test_split(
        df["text"], df["label"], strata, test_size=0.15, random_state=RANDOM_STATE, stratify=strata
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.1765, random_state=RANDOM_STATE, stratify=s_temp
    )
    logger.info(f"Train {len(X_train)} | Val {len(X_val)} | Test {len(X_test)}")

    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=2,
        max_features=30000,
        sublinear_tf=True,
        # Character-level cues (₹, digits, URLs) matter for scams, so keep tokens with digits/symbols
        token_pattern=r"(?u)\b\w[\w@.₹$]+\b",
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_val_vec = vectorizer.transform(X_val)
    X_test_vec = vectorizer.transform(X_test)

    # Every candidate is wrapped in calibration so predict_proba returns real probabilities
    candidates = {
        "Logistic Regression": LogisticRegression(class_weight="balanced", max_iter=2000, C=4.0, random_state=RANDOM_STATE),
        "Linear SVM": LinearSVC(class_weight="balanced", random_state=RANDOM_STATE),
        "Random Forest": RandomForestClassifier(
            class_weight="balanced", n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1
        ),
    }

    results = []
    for name, base in candidates.items():
        logger.info(f"Training {name}...")
        model = CalibratedClassifierCV(base, method="sigmoid", cv=3)
        model.fit(X_train_vec, y_train)
        val_prob = probabilities(model, X_val_vec)
        threshold = tune_threshold(y_val, val_prob)
        metrics = evaluate(y_val, val_prob, threshold)
        logger.info(f"{name}: val F1={metrics['f1']:.4f} recall={metrics['recall']:.4f} @ threshold {threshold}")
        results.append((name, model, threshold, metrics))

    name, model, threshold, val_metrics = max(results, key=lambda r: r[3]["f1"])
    logger.info(f"Selected model: {name} (threshold {threshold})")

    test_metrics = evaluate(y_test, probabilities(model, X_test_vec), threshold)
    logger.info(f"Test metrics: {json.dumps(test_metrics, indent=2)}")

    evaluation = {
        "model_version": MODEL_VERSION,
        "model_name": name,
        "sklearn_version": sklearn.__version__,
        "datasets": datasets,
        "train_size": int(len(X_train)),
        "val_size": int(len(X_val)),
        "test_size": int(len(X_test)),
        "threshold": threshold,
        "calibration": "sigmoid (Platt) via CalibratedClassifierCV, 3-fold",
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
        "candidates": {r[0]: {"val_f1": r[3]["f1"], "threshold": r[2]} for r in results},
    }

    with open(os.path.join(MODEL_DIR, "model.pkl"), "wb") as f:
        pickle.dump(model, f)
    with open(os.path.join(MODEL_DIR, "vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)
    with open(os.path.join(MODEL_DIR, "evaluation.json"), "w") as f:
        json.dump(evaluation, f, indent=2)
    logger.info("Training complete; artifacts written to models/.")


if __name__ == "__main__":
    main()

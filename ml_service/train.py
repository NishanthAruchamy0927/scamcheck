import os
import requests
import zipfile
import pandas as pd
import numpy as np
import pickle
import json
import logging
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from io import BytesIO

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
DATA_DIR = "data"
MODEL_DIR = "models"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

def download_dataset():
    data_path = os.path.join(DATA_DIR, "SMSSpamCollection")
    if os.path.exists(data_path):
        logger.info("Dataset already exists.")
        return data_path

    logger.info("Downloading dataset...")
    try:
        response = requests.get(DATA_URL, timeout=10)
        response.raise_for_status()
        with zipfile.ZipFile(BytesIO(response.content)) as z:
            z.extractall(DATA_DIR)
        logger.info("Dataset downloaded and extracted.")
        return data_path
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        return None

def load_data(data_path):
    # SMSSpamCollection format: label\ttext
    df = pd.read_csv(data_path, sep='\t', header=None, names=['label', 'text'])
    # Map labels: ham -> 0, spam -> 1
    df['label'] = df['label'].map({'ham': 0, 'spam': 1})
    return df

def feature_engineering(df):
    logger.info("Extracting cybersecurity features...")
    # Add basic heuristic text features that a model could use alongside TF-IDF
    df['msg_length'] = df['text'].apply(len)
    df['word_count'] = df['text'].apply(lambda x: len(x.split()))
    df['has_url'] = df['text'].str.contains(r'http[s]?://|www\.', case=False).astype(int)
    df['has_phone'] = df['text'].str.contains(r'\d{10}|\d{3}-\d{3}-\d{4}', case=False).astype(int)
    df['has_currency'] = df['text'].str.contains(r'\$|£|€|USD|EUR|GBP', case=False).astype(int)
    df['urgency_words'] = df['text'].str.contains(r'urgent|immediate|action required|now', case=False).astype(int)
    return df

def train_and_evaluate(X_train_vec, X_test_vec, y_train, y_test, model, model_name):
    logger.info(f"Training {model_name}...")
    model.fit(X_train_vec, y_train)
    
    # Predict
    y_pred = model.predict(X_test_vec)
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test_vec)[:, 1]
    else:
        y_prob = model.decision_function(X_test_vec)
        # Normalize decision function output for pseudo-probabilities if not calibrated
        y_prob = (y_prob - y_prob.min()) / (y_prob.max() - y_prob.min())

    # Evaluation
    metrics = {
        "model": model_name,
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
    }
    logger.info(f"{model_name} Evaluation: {json.dumps(metrics, indent=2)}")
    return model, metrics

def main():
    data_path = download_dataset()
    if not data_path:
        logger.error("Dataset unavailable. Creating a fallback empty model structure to mark training as pending.")
        with open(os.path.join(MODEL_DIR, "model_status.json"), "w") as f:
            json.dump({"status": "pending", "reason": "Dataset download failed"}, f)
        return

    df = load_data(data_path)
    df = feature_engineering(df)
    
    logger.info(f"Dataset Shape: {df.shape}")
    logger.info(f"Class Distribution:\n{df['label'].value_counts(normalize=True)}")

    # Data Split: 70% Train, 15% Validation, 15% Test
    # For simplicity of scikit-learn standard tools, we'll do 70/30 train/test here, 
    # but let's do 70/15/15 to strictly follow requirements
    X = df['text']
    y = df['label']
    
    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.1765, random_state=42, stratify=y_temp)
    # 0.1765 of 0.85 is ~0.15

    logger.info(f"Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test)}")

    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_val_vec = vectorizer.transform(X_val)

    # Models for comparison
    models = {
        "Logistic Regression": LogisticRegression(class_weight="balanced", random_state=42),
        "Linear SVM": LinearSVC(class_weight="balanced", random_state=42),
        "Random Forest": RandomForestClassifier(class_weight="balanced", random_state=42, n_estimators=100)
    }

    evaluations = []
    trained_models = {}

    for name, model in models.items():
        trained, metrics = train_and_evaluate(X_train_vec, X_val_vec, y_train, y_val, model, name)
        evaluations.append(metrics)
        trained_models[name] = trained

    # Select the best model based on F1 Score (since imbalanced)
    best_model_name = max(evaluations, key=lambda x: x["f1"])["model"]
    logger.info(f"Selected Best Model: {best_model_name}")

    best_model = trained_models[best_model_name]

    # Evaluate on TEST set
    X_test_vec = vectorizer.transform(X_test)
    y_test_pred = best_model.predict(X_test_vec)
    
    if hasattr(best_model, "predict_proba"):
        y_test_prob = best_model.predict_proba(X_test_vec)[:, 1]
    else:
        y_test_prob = best_model.decision_function(X_test_vec)
        y_test_prob = (y_test_prob - y_test_prob.min()) / (y_test_prob.max() - y_test_prob.min())

    final_metrics = {
        "model_version": "1.0.0",
        "model_name": best_model_name,
        "dataset": "UCI SMS Spam Collection",
        "train_size": len(X_train),
        "val_size": len(X_val),
        "test_size": len(X_test),
        "test_metrics": {
            "accuracy": accuracy_score(y_test, y_test_pred),
            "precision": precision_score(y_test, y_test_pred),
            "recall": recall_score(y_test, y_test_pred),
            "f1": f1_score(y_test, y_test_pred),
            "roc_auc": roc_auc_score(y_test, y_test_prob)
        },
        "threshold": 0.5,
        "calibration": "none (using uncalibrated probabilities for baseline)"
    }

    # Save artifacts safely
    logger.info("Saving model artifacts...")
    with open(os.path.join(MODEL_DIR, "model.pkl"), "wb") as f:
        pickle.dump(best_model, f)
    with open(os.path.join(MODEL_DIR, "vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)
    with open(os.path.join(MODEL_DIR, "evaluation.json"), "w") as f:
        json.dump(final_metrics, f, indent=2)

    logger.info("Training complete.")

if __name__ == "__main__":
    main()

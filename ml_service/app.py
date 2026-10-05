"""
SCAMCHECK ML inference service.

Serves the classifier produced by train.py (models/model.pkl + vectorizer.pkl).
The trained model's probability is combined with a small set of
recruitment-fraud cues, because the bundled training data (SMS spam) does not
cover every recruitment-scam phrasing. If the model files are missing, the
service still answers using the cues alone and says so in `model.name`.
"""
import json
import logging
import os
import pickle
import re
from typing import Any, Dict, List, Optional

import sklearn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

app = FastAPI(title="SCAMCHECK ML Service", version="2.0.0")


def load_artifacts():
    """Loads the trained model. Pickles are only read from our own models/ directory."""
    try:
        with open(os.path.join(MODEL_DIR, "model.pkl"), "rb") as f:
            model = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "vectorizer.pkl"), "rb") as f:
            vectorizer = pickle.load(f)
        meta: Dict[str, Any] = {}
        meta_path = os.path.join(MODEL_DIR, "evaluation.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                meta = json.load(f)
        trained_with = meta.get("sklearn_version")
        if trained_with and trained_with != sklearn.__version__:
            logger.warning(
                f"Model was trained with scikit-learn {trained_with} but {sklearn.__version__} is installed; "
                "install the pinned version from requirements.txt or retrain with train.py"
            )
        if not hasattr(model, "predict_proba"):
            raise ValueError("model does not provide probabilities; retrain with train.py")
        logger.info(f"Loaded model '{meta.get('model_name', 'unknown')}' v{meta.get('model_version', '?')}")
        return model, vectorizer, meta
    except Exception as e:
        logger.error(f"Trained model unavailable, using cue-only fallback: {e}")
        return None, None, {}


MODEL, VECTORIZER, MODEL_META = load_artifacts()
THRESHOLD = float(MODEL_META.get("threshold", 0.5))

# Known scam templates for similarity search (reference patterns, not training data)
SCAM_TEMPLATES = [
    {"id": "TPL-ACCOUNT-THREAT", "type": "ACCOUNT_THREAT", "text": "Your bank account will be blocked. Verify your KYC immediately using the link."},
    {"id": "TPL-JOB-FEE", "type": "FAKE_JOB_PAYMENT", "text": "Congratulations you are selected. Pay the registration fee to receive your offer letter."},
    {"id": "TPL-LAPTOP-DEPOSIT", "type": "FAKE_JOB_PAYMENT", "text": "Pay a refundable security deposit for your work from home laptop kit before joining."},
    {"id": "TPL-TASK-SCAM", "type": "TASK_COMMISSION", "text": "Earn daily by rating products and liking videos. Recharge your account to unlock higher commission tasks."},
    {"id": "TPL-OTP-HARVEST", "type": "CREDENTIAL_THEFT", "text": "Share the OTP sent to your phone to verify your stipend bank transfer."},
    {"id": "TPL-CERT-MILL", "type": "PAID_CERTIFICATE", "text": "Virtual internship with no interview. Complete tasks and pay the certificate fee to get your internship certificate."},
]


class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    deterministic_risk: int = 0


class SimilarityRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)


class MLSignal(BaseModel):
    type: str
    name: str


class LanguageInfo(BaseModel):
    language: str
    confidence: float
    mixedLanguage: bool


class AnalysisResponse(BaseModel):
    classification: Dict[str, Any]
    language: LanguageInfo
    signals: List[MLSignal]
    model: Dict[str, str]


def detect_language(text: str) -> LanguageInfo:
    letters = re.findall(r"[a-zA-Z஀-௿ऀ-ॿ]", text)
    total = max(len(letters), 1)
    tamil = len(re.findall(r"[஀-௿]", text)) / total
    hindi = len(re.findall(r"[ऀ-ॿ]", text)) / total
    english = len(re.findall(r"[a-zA-Z]", text)) / total

    shares = {"EN": english, "TA": tamil, "HI": hindi}
    present = [k for k, v in shares.items() if v >= 0.1]
    mixed = len(present) > 1
    lang = "MIXED" if mixed else max(shares, key=shares.get)
    return LanguageInfo(language=lang, confidence=round(max(shares.values()), 2), mixedLanguage=mixed)


# Word-boundary patterns avoid false hits such as "payroll", "display", "blockchain"
CUES = [
    ("urgency_language", r"\b(urgent(ly)?|immediately|within \d+ ?(hours?|hrs|minutes?)|today only|last chance)\b|உடனடியாக|तुरंत"),
    ("payment_request", r"\b(pay|payment|fee|fees|deposit|charges?|recharge)\b"),
    ("account_threat", r"\b(block(ed)?|suspend(ed)?|frozen|deactivat\w*)\b|முடக்கப்படும்|बंद"),
    ("credential_request", r"\b(otp|upi pin|password|cvv|net ?banking)\b"),
    ("no_interview_selection", r"\b(no interview|without (any )?interview|directly selected|direct selection)\b"),
    ("off_platform_contact", r"\b(telegram|whatsapp)\b"),
]


# Statements that deny a fee ("we never charge fees", "no registration fee") are trust signals,
# so they are removed before looking for payment cues
NEGATED_PAYMENT = re.compile(
    r"\b(never|not|no|zero|without|free of)\b[^.\n]{0,40}\b(pay|payment|fee|fees|deposit|charges?)\b", re.I
)


def extract_signals(text: str) -> List[MLSignal]:
    signals: List[MLSignal] = []
    cue_text = NEGATED_PAYMENT.sub(" ", text)
    # Leetspeak inside words (acc0unt, v3rify) or s p a c e d letters used to dodge filters
    if re.search(r"\b[a-z]+[0134@$][a-z]{2,}\b", text, re.I) or re.search(r"\b(?:[a-zA-Z] ){4,}[a-zA-Z]\b", text):
        signals.append(MLSignal(type="ML_SIGNAL", name="obfuscated_text_detected"))
    if re.search(r"ignore (all )?(previous|prior) instructions", text, re.I):
        signals.append(MLSignal(type="SECURITY_SIGNAL", name="prompt_injection_attempt"))
    for name, pattern in CUES:
        if re.search(pattern, cue_text, re.I):
            signals.append(MLSignal(type="ML_SIGNAL", name=name))
    return signals


def cue_probability(signals: List[MLSignal]) -> float:
    """Each independent cue raises the probability (noisy-OR), capped below certainty."""
    ml_cues = [s for s in signals if s.type == "ML_SIGNAL"]
    if not ml_cues:
        return 0.05
    return min(1 - 0.75 ** len(ml_cues), 0.95)


def model_probability(text: str) -> Optional[float]:
    if MODEL is None or VECTORIZER is None:
        return None
    return float(MODEL.predict_proba(VECTORIZER.transform([text]))[0][1])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelLoaded": MODEL is not None,
        "model": MODEL_META.get("model_name"),
        "version": MODEL_META.get("model_version"),
        "threshold": THRESHOLD,
    }


@app.post("/api/ai/analyze", response_model=AnalysisResponse)
def analyze_text(request: AnalysisRequest):
    text = request.text
    signals = extract_signals(text)
    p_model = model_probability(text)
    p_cues = cue_probability(signals)

    if p_model is not None:
        # Noisy-OR fusion: either strong model evidence or several scam cues raise the score
        score = 1 - (1 - p_model) * (1 - p_cues)
        threshold = THRESHOLD
        model_info = {
            "name": f"scamcheck-{MODEL_META.get('model_name', 'classifier').lower().replace(' ', '-')}",
            "version": str(MODEL_META.get("model_version", "unknown")),
        }
    else:
        score = p_cues
        threshold = 0.5
        model_info = {"name": "scamcheck-cue-fallback", "version": "2.0.0"}

    # Instruction-injection text is treated as hostile content, never as a reason to lower risk
    if any(s.name == "prompt_injection_attempt" for s in signals):
        score = max(score, 0.95)

    score = round(min(max(score, 0.0), 0.99), 4)
    return AnalysisResponse(
        classification={
            "label": "SUSPICIOUS" if score >= threshold else "SAFE",
            "score": score,
            "modelProbability": None if p_model is None else round(p_model, 4),
            "cueProbability": round(p_cues, 4),
            "threshold": threshold,
        },
        language=detect_language(text),
        signals=signals,
        model=model_info,
    )


@app.post("/api/ai/similarity")
def similarity_search(request: SimilarityRequest):
    vectorizer = VECTORIZER
    if vectorizer is None:
        # Fallback: fit a small vectorizer on the templates themselves
        vectorizer = TfidfVectorizer().fit([t["text"] for t in SCAM_TEMPLATES])
    try:
        req_vec = vectorizer.transform([request.text])
        tpl_vecs = vectorizer.transform([t["text"] for t in SCAM_TEMPLATES])
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Similarity engine unavailable: {e}")

    sims = cosine_similarity(req_vec, tpl_vecs)[0]
    matches = [
        {"investigationId": t["id"], "similarityScore": round(float(s), 4), "templateType": t["type"]}
        for t, s in zip(SCAM_TEMPLATES, sims)
        if s > 0.3
    ]
    matches.sort(key=lambda m: m["similarityScore"], reverse=True)
    return {"matchedInvestigations": matches, "maxSimilarity": matches[0]["similarityScore"] if matches else 0.0}

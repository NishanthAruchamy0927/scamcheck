from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import pickle
import os
import logging
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SCAMCHECK ML Service", version="1.1.0")

# Dummy vectors for similarity testing
try:
    vectorizer = TfidfVectorizer(max_features=5000)
    # Fit on some dummy scam text
    vectorizer.fit([
        "Your bank account will be blocked. Verify immediately.",
        "Important notice: your banking account is going to be suspended. Confirm now.",
        "Congratulations sir, your offer is ready.",
        "Pay the processing fee to receive the offer."
    ])
    model_status = "ready"
except Exception as e:
    model_status = "unavailable"
    logger.error("Failed to init TFIDF")

# Simulated Investigation Database for similarity search
HISTORICAL_SCAMS = [
    {"id": "INV-100", "text": "Your bank account will be blocked. Verify immediately.", "type": "ACCOUNT_THREAT"},
    {"id": "INV-101", "text": "Pay the processing fee to receive the job offer.", "type": "FAKE_JOB_PAYMENT"}
]

class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    deterministic_risk: int = 0

class SimilarityRequest(BaseModel):
    text: str

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
    # Heuristics for Tamil / Hindi scripts
    has_tamil = bool(re.search(r'[\u0B80-\u0BFF]', text))
    has_hindi = bool(re.search(r'[\u0900-\u097F]', text))
    has_english = bool(re.search(r'[a-zA-Z]', text))
    
    mixed = (has_tamil and has_english) or (has_hindi and has_english)
    
    lang = "EN"
    if mixed:
        lang = "MIXED"
    elif has_tamil:
        lang = "TA"
    elif has_hindi:
        lang = "HI"
        
    return LanguageInfo(language=lang, confidence=0.85, mixedLanguage=mixed)

def detect_obfuscation(text: str) -> List[MLSignal]:
    signals = []
    # e.g. V3R1FY, acc0unt
    if re.search(r'[a-zA-Z]+[0-9]+[a-zA-Z]+', text) or re.search(r'([a-zA-Z]\s){3,}', text):
        signals.append(MLSignal(type="ML_SIGNAL", name="obfuscated_text_detected"))
    
    # Prompt injection check
    if "ignore previous instructions" in text.lower():
        signals.append(MLSignal(type="SECURITY_SIGNAL", name="prompt_injection_attempt"))
        
    return signals

def extract_signals(text: str) -> List[MLSignal]:
    signals = detect_obfuscation(text)
    lower = text.lower()
    
    if "urgent" in lower or "immediately" in lower or "உடனடியாக" in lower or "तुरंत" in lower:
        signals.append(MLSignal(type="ML_SIGNAL", name="urgency_language"))
        
    if "fee" in lower or "pay" in lower or "deposit" in lower:
        signals.append(MLSignal(type="ML_SIGNAL", name="payment_request"))
        
    if "block" in lower or "suspend" in lower or "முடக்கப்படும்" in lower or "बंद" in lower:
        signals.append(MLSignal(type="ML_SIGNAL", name="account_threat"))
        
    return signals

@app.post("/api/ai/analyze", response_model=AnalysisResponse)
def analyze_text(request: AnalysisRequest):
    # Simulated adversarial resistance:
    text = request.text
    
    lang_info = detect_language(text)
    signals = extract_signals(text)
    
    # Simple risk calculation based on signals
    is_suspicious = len(signals) > 0
    score = min(0.3 + (len(signals) * 0.2), 0.99) if is_suspicious else 0.1
    
    # Prompt injection overrides everything to safe in a bad system, but we log it as an attack
    if any(s.name == "prompt_injection_attempt" for s in signals):
        score = 0.99
        is_suspicious = True
        
    return AnalysisResponse(
        classification={
            "label": "SUSPICIOUS" if is_suspicious else "SAFE",
            "score": score
        },
        language=lang_info,
        signals=signals,
        model={
            "name": "scam-classifier-heuristic",
            "version": "1.3.0"
        }
    )

@app.post("/api/ai/similarity")
def similarity_search(request: SimilarityRequest):
    if model_status != "ready":
        raise HTTPException(status_code=503, detail="Similarity Engine unavailable")
        
    req_vec = vectorizer.transform([request.text])
    
    matches = []
    for hist in HISTORICAL_SCAMS:
        hist_vec = vectorizer.transform([hist["text"]])
        sim = cosine_similarity(req_vec, hist_vec)[0][0]
        if sim > 0.3:
            matches.append({
                "investigationId": hist["id"],
                "similarityScore": float(sim),
                "templateType": hist["type"]
            })
            
    matches.sort(key=lambda x: x["similarityScore"], reverse=True)
    
    return {
        "matchedInvestigations": matches,
        "maxSimilarity": matches[0]["similarityScore"] if matches else 0.0
    }

# SCAMCHECK AI/ML Hybrid Intelligence Architecture (Phase 4)

## Overview
SCAMCHECK Phase 4 transforms the platform from a purely deterministic rule-based engine into a **Hybrid Cybersecurity Intelligence Engine**. It merges deterministic security rules (which make the main decision for critical attributes like advance-fee fraud) with a calibrated Machine Learning model trained on text spam data. See ML_TRAINING.md for the current model and metrics.

## The Architecture
The architecture is decoupled into two services:
1. **Node.js (Express) Core Engine**: Handles orchestration, parser pipelines, entity extraction, and deterministic rules execution.
2. **FastAPI (Python) ML Service**: Hosts the Scikit-Learn models using TF-IDF vectorization. 

### Cross-Process Communication
The Node.js backend communicates with the Python ML Service via a REST API (`http://localhost:8000/api/v1/analyze`). 
The service provides:
- Scam Probability Score (0-100)
- Model Confidence (0-100)
- Deterministic Fallback: If the FastAPI service is down or times out (3 second limit), the backend falls back to rules-only scoring, so analysis keeps working.

### Evidence Fusion Algorithm (The Core Value)
The `riskAggregator.ts` implements the fusion logic.
- **Risk Score Fusion**: $FinalRisk = (DeterministicScore * 0.7) + (MLScore * 0.3)$. 
- **Security Floor**: If deterministic rules identify a `CRITICAL` threat (e.g. payment request), the final score is floored at 65, ensuring the AI cannot accidentally override a severe security violation.
- **Confidence Calibration**: System confidence is adjusted based on model agreement. If the ML model and deterministic rules strongly agree (difference < 20), confidence increases. If they strongly disagree (difference > 40), confidence is penalized, reflecting uncertainty.

## Why This Architecture?
Pure AI engines suffer from hallucinations and unexplainability. Pure deterministic engines lack contextual adaptability. This hybrid approach guarantees **testable, auditable security** while leveraging AI for nuanced text analysis.

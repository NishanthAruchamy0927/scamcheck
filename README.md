# SCAMCHECK

**AI/ML-Powered Cybersecurity, Scam Intelligence & Digital Fraud Protection Platform**

## Problem
Digital scams increasingly rely on impersonation, fake recruitment, cross-channel payment requests, and multilingual text. Standard spam classifiers fail against sophisticated, well-formatted PDF offers or synthesized organizational structures.

## Solution
SCAMCHECK implements a 9-layer defense pipeline:
1. Deterministic Cybersecurity engine (22+ hardcoded logic constraints)
2. Multimodal OCR and Text Extraction
3. Verification Intelligence (Organization Domain analysis)
4. AI/ML Semantic Fallback classification
5. Payment Signal parsing (QR payloads, UPI endpoints)
6. Trust / Risk index derivation
7. Threat Intelligence correlation
8. Campaign Graph clustering
9. Security Operations Center (SOC) presentation

## Architecture
(See `docs/FINAL_ARCHITECTURE.md`)

## Security
- **Authentication**: JWT-based (HS256 enforced).
- **Tenant Isolation**: RBAC strictly controls query scopes.
- **SSRF**: Local/AWS subnets intercepted via `SafeNetworkClient`.
- **Upload Constraints**: Size (5MB) and Directory traversal blocking (`../`).

## Limitations
* **Database Pipeline (Local/Demo)**: Deep PostgreSQL Prisma mapping is constrained by host V8 heap sizes in certain pipelines, necessitating logic isolation.
* **Large Models**: Transformer-based text extraction leverages TF-IDF proximity to adapt to restricted RAM environments natively rather than loading complete `bert-base-multilingual` graphs.

## Running Development
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run start

# AI Module
cd ml_service && pip install -r requirements.txt && uvicorn app:app --reload
```

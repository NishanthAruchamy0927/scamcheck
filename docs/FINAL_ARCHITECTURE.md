# SCAMCHECK Final Architecture

SCAMCHECK is built on a distributed, microservice-inspired architecture separating frontend presentation, backend deterministic orchestration, and an isolated machine learning inference service.

## Data Flow
1. **Frontend Request (React/Vite)**
   - Secures payload and requests analysis from backend over HTTPS.
2. **Orchestrator Backend (Express/Node)**
   - Validates user JWT.
   - Extracts payload via multimodal handlers (PDF, text, image OCR).
3. **Deterministic Engine**
   - Applies 22+ security indicators (e.g. `urgency`, `financial terms`, `unsafe URLs`).
4. **Machine Learning Service (Python/Scikit-learn)**
   - Performs TF-IDF based classification.
   - Identifies prompt injection and overrides outputs.
5. **Entity Graph (PostgreSQL/Prisma)**
   - Correlates actors, companies, and networks.
6. **SOC Interface**
   - Renders compiled Trust, Risk, and Confidence indexes for human-analyst review.

# SCAMCHECK API Overview

SCAMCHECK's backend is a modular API constructed to separate intelligence layers cleanly.

## Core Endpoints

### 1. `POST /api/investigations/analyze`
**Purpose**: Primary intake for raw scam data.
**Payload**: `MultimodalContent` (text, image, pdf).
**Action**: Routes through Deterministic -> Multimodal -> AI/ML engine. Returns initial indicators.

### 2. `GET /api/investigations/:id`
**Purpose**: Retrieve final analysis report.
**Returns**:
```json
{
  "id": "123",
  "trustScore": 45,
  "riskTier": "HIGH RISK",
  "entities": [],
  "signals": []
}
```

### 3. `POST /api/auth/login`
**Purpose**: Issues strict HS256-signed JWTs mapping RBAC definitions.

### 4. `POST /api/intelligence/verify`
**Purpose**: Consults Threat Intel and Verification databases to match domain reputation.

## Sub-services (Internal Network)
- **ML Inference (`http://localhost:8000/api/v1/analyze`)**: Dedicated internal endpoint handling feature extraction, TF-IDF inference, and prompt manipulation overrides.

_Note: All external calls are gated via `SafeNetworkClient` to prevent SSRF vulnerabilities._

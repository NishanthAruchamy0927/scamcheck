# Payment Security Intelligence (Phase 9)

## Overview
Phase 9 extends ScamCheck to support Payment Security Analysis, particularly handling QR Codes, UPI URIs, and other payment destinations extracted from multimodal input.

## Core Concepts
- **Validation != Legitimacy**: A payment identifier being syntactically valid (e.g. `merchant@okicici`) does not mean it is safe.
- **Unknown != Malicious**: An identifier not found in the threat graph is assessed as `UNVERIFIED` and its risk level may be elevated, but it is not inherently categorized as fraudulent without correlating evidence.
- **Provenance**: We track where a payment ID came from. A UPI ID extracted from a QR code preserves its `source: 'QR_DECODER'`.

## Architecture
1. **Multimodal Extraction**: When an image is uploaded, it passes through OCR (`extractTextFromImage`) and QR Extraction (`decodeQrFromImage`).
2. **UPI Parsing (`upiParser.ts`)**: Handles complex `upi://pay?pa=...` URIs, extracting the canonical payment identifier, payee name, and merchant code without trusting it as verified truth.
3. **Graph Consolidation**: Identifiers are deduplicated and saved as `Entity` objects in the Trust Graph (Phase 7), mapped to current and future investigations.
4. **Security Assessment (`paymentSecurityService.ts`)**: 
   - **Format Status**: (VALID, INVALID, UNKNOWN)
   - **Verification Status**: (VERIFIED, UNVERIFIED, MISMATCH)
   - **Risk Signals**: e.g., "Linked to 2 scam campaigns".
   - **Trust Signals**: Positive evidence (e.g., organization verification).
   - **Confidence**: Based on completeness of evidence.

## API Integration
- `GET /api/payments/:id/assessment`: Fetches or dynamically evaluates a payment entity.
- `GET /api/payments/:id/related-investigations`: Views graph intersections (RBAC enforced).
- `POST /api/payments/:id/report`: Submits a user report against a payment identifier.

## Privacy & Security
- **Cross-Tenant Privacy**: `related-investigations` strictly filters out private data belonging to other users unless the requester is a `SECURITY_ANALYST`.
- **SSRF Prevention**: QR decoded URLs are not automatically executed. They are treated as text extraction signals only.

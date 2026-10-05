# QR Security Architecture

## Overview
QR Codes are often used as attack vectors in modern scams, including:
1. Fake "Receive Money" requests.
2. Malicious links driving users to phishing sites.
3. Server-Side Request Forgery (SSRF) if backends blindly execute extracted URLs.

## Security Controls in Phase 9

### 1. Passive Extraction
- **Rule**: Never fetch or execute URLs found inside a QR code during extraction.
- **Enforcement**: `qrDecoder.ts` only extracts the string payload. Any subsequent network request must explicitly pass through the Phase 6 `SafeNetworkClient`, which contains strict rules against resolving local network addresses, metadata endpoints, and excessive redirects.

### 2. File Size & Format Restrictions
- **Rule**: Limit the computational impact of decoding highly complex or "zip bomb" style images.
- **Enforcement**: Rely on the existing Multer middleware limits (e.g., 5MB max). Fall back gracefully if extraction times out.

### 3. Graceful Degradation (ENOSPC Simulation)
- **Rule**: Do not crash the investigation pipeline if QR dependencies fail to install or execute.
- **Enforcement**: The QR decoder is wrapped in a safety block. If it cannot read the image due to resource constraints, it fails silently, allowing the primary OCR text and other multimodal elements to still be processed.

### 4. Categorization
- QR payloads are extracted and typed explicitly as `QR_PAYLOAD` in the entity graph.
- If the payload matches `upi://`, it is also typed as `UPI_URL` to facilitate deep parsing, keeping the source provenance explicitly as `QR_PAYLOAD`.

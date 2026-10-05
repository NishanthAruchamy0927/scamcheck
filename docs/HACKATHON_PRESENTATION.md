# SCAMCHECK Presentation Outline

## Slide 1: Title
**SCAMCHECK**
AI/ML-Powered Cybersecurity & Digital Fraud Protection Platform

## Slide 2: The Evolving Threat
- Phishing is dead; sophisticated Multimodal Fraud is the new reality.
- Scammers use perfect grammar, deepfaked organizations, and malicious QR/UPI routing.
- Static blocklists and spam filters fail against zero-day campaigns.

## Slide 3: The 9-Layer Defense
- Deterministic Intelligence (Regex + Hard logic rules)
- Semantic AI (Intent classification)
- Multimodal OCR (Image analysis)
- Trust Graph Mapping (Entity clustering)
- Payment Gateway scanning
- Domain Verification Checks

## Slide 4: Our Architecture
- **React Frontend**: A powerful Security Operations Center (SOC) dashboard.
- **Node.js Orchestrator**: The central brain driving investigation workflows.
- **Python ML Inference**: Isolated, fast, CPU-efficient NLP modeling.
- **Security**: JWT-locked, SSRF-protected, tenant-isolated.

## Slide 5: Honesty & Integrity
- We didn't build a wrapper around OpenAI.
- We built deterministic pipelines wrapped in localized Machine Learning logic.
- We disabled components that couldn't be cryptographically validated (e.g. mocked QR).
- We prioritized actual security engineering over demo tricks.

## Slide 6: The SCAMCHECK Difference
- **Actionable Output**: Not just "Spam/Not Spam", but "High Risk because the sender domain does not match the payment UPI domain, and this cluster was seen 3 weeks ago."

# SCAMCHECK Judge Q&A

**Q: Is your AI model calling out to OpenAI or an external LLM during the demo?**
A: No. We designed the architecture to include a localized Python fallback model using TF-IDF and traditional classification to avoid dependency on paid APIs and ensure deterministic, offline capabilities. We use external intel only via designated providers when enabled.

**Q: Are your test cases actual user data?**
A: No, all test cases, demonstrations, and datasets in the `demo/` folder are 100% synthetic, specifically generated to test boundary conditions without exposing PII.

**Q: What happened to the QR Decoding capability?**
A: We architected a robust QR scanning utility; however, memory limitations in our isolated test environment prevented the installation of native C-bindings required for decoding. The mock system has been disabled by default to maintain the honesty of our final submission.

**Q: How do you handle adversarial prompts or manipulated inputs?**
A: We implemented an SSRF blocking layer that guards against metadata IP probing. Additionally, our pipeline has built-in override markers to flag explicitly deceptive context or mismatched organizational indicators as `SUSPICIOUS`, cutting off model hallucination vectors.

**Q: Is this production ready?**
A: It is fundamentally architected for production (container-ready, strict JWT auth, separated frontend/backend/ML layers). However, due to deployment hardware limits, full E2E database verification remains incomplete in this current branch.

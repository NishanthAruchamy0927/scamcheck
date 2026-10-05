# Trust & Verification Confidence Model (Phase 6)

## Trust != 100 - Risk
A foundational principle of ScamCheck Phase 6 is that **Trust is not simply the inverse of Risk**. 
An opportunity that lacks explicit risk indicators (0% Risk) does not automatically become trustworthy (100% Trust). Trust must be actively proven through cryptographic, organizational, and verifiable evidence.

## Computing the Trust Score
The Trust Score (0-100) begins at a low baseline (e.g., 10) and is exclusively incremented by verifiable positive indicators:
- **+20**: Recognized enterprise organization identity.
- **+30**: Cryptographically verified official web domain matching the organization.
- **+20**: Verified corporate email channel (MX routing to enterprise infrastructure).
- **+10**: Verified TLS/SSL Certificate.
- **+5**: Email spoofing protections enabled (SPF).
- **+5**: Established domain registration age.

If an opportunity is entirely text-based with no URLs or Domains to verify, its Trust Score remains low, correctly reflecting the lack of verifiable evidence.

## Computing Verification Confidence
**Verification Confidence** measures the platform's ability to actually perform the verification, distinct from both the Trust Score and the ML System Confidence.

- **Baseline**: Starts at 20% for text-only inputs with no verifiable entities.
- **Network Verification**: Increases by +20% for each successful adapter execution (DNS, TLS, Email Auth).
- **Meaning**: A Verification Confidence of 100% means the system successfully reached and queried all external network infrastructure related to the opportunity. A Verification Confidence of 20% means the system was structurally unable to perform external network queries (usually due to lack of submitted URLs or domains).

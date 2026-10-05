# SCAMCHECK Final Test Matrix

| Category  | Test                  | Result            | Notes |
| --------- | --------------------- | ----------------- | --- |
| Auth      | Login                 | PASS              | Handled via Node controllers |
| Auth      | JWT expiry            | PASS              | Strict HS256 algorithm enforcement added |
| RBAC      | Vertical escalation   | PASS              | Verified natively via `test_phase14_security.ts` |
| RBAC      | Horizontal escalation | PASS              | Verified natively via `test_phase14_security.ts` |
| Tenant    | Cross-org access      | PASS              | Checked structurally |
| SSRF      | Metadata IP           | PASS              | 169.254.169.254 loopback dropped |
| SSRF      | Redirect              | PASS              | Blocked loop targets |
| Files     | Traversal             | PASS              | Reject explicit path manipulations (`../`) |
| Files     | Oversized file        | PASS              | Hard 5MB memory constraint |
| AI        | Prompt injection      | PASS              | Simulated overriding NLP layers into `SUSPICIOUS` |
| AI        | Fallback              | PASS              | Handled explicitly with TF-IDF vs large unloadable models |
| Payment   | UPI                   | PASS              | Regex isolation functional |
| Payment   | QR                    | BLOCKED           | Module constraints via ENOSPC |
| Graph     | Entity correlation    | BLOCKED           | PostgreSQL integration tests halted due to Prisma map crashes |
| Campaign  | Lifecycle             | BLOCKED           | Database dependency missing on test boundaries |
| Forensics | Evidence hash         | PASS              | Evidence generation uses SHA-256 integrity mapping |
| SOC       | Analyst access        | PASS              | Verification Center logic successfully mapped |
| Database  | PostgreSQL E2E        | BLOCKED           | Host-layer V8 Heap failures on CI |
| Frontend  | Production build      | PASS              | Generated Vite chunk optimizations |
| Backend   | Production build      | PARTIAL           | TypeScript checks halted compilation on generic interface alignments |
| ML        | Service startup       | PASS              | Verified Python endpoints |

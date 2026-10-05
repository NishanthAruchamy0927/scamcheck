# SCAMCHECK

**Scam detection and career-value checks for internship, job and scholarship offers.**

## Problem
Students are targeted by fake recruiters, advance-fee "internships", OTP theft, and paid-certificate programs that look like real jobs. A spam filter does not tell a student whether an offer is safe, or whether it will actually help them get hired.

## What it does
- **Investigate** — paste text, upload screenshots, PDFs or DOCX files, or enter a URL. You get a 0–100 risk score with the red flags found, contradictions, pressure tactics, domain checks (DNS, TLS, RDAP, SPF/MX), UPI/QR payment checks, and next steps.
- **Company Check** — rates a company's credibility from its LinkedIn footprint (followers vs. employees, age, website match, where past interns went), and whether its internship or certificate is worth it for the student's career.
- **Compare** — two offers side by side.
- **Dashboard & History** — past checks saved in the browser.

## How it decides
1. **Extraction:** OCR (Tesseract), PDF/DOCX parsing, QR decoding (jsQR), entity extraction.
2. **Rule engine:** 23 scam and trust rules (fees, credential requests, account-blocking threats, deadlines, webmail impersonation, no-interview selection, and more), with Tamil and Hindi keywords for urgency and account threats.
3. **Organisation consistency:** the claimed company is compared with its official domains (25 known employers built in).
4. **ML model (optional service):** a calibrated TF-IDF + Linear SVM classifier, combined with recruitment-fraud cues. It contributes 30% of the score; the rules make the main decision.
5. **External verification:** DNS, TLS, RDAP and email-authentication lookups, all through an SSRF-safe network client.
6. **Company credibility and career value:** LinkedIn footprint plus the structure of the offer.
7. **Persistence and correlation (optional PostgreSQL):** campaign detection across investigations that reuse the same email, phone or UPI ID.

## ML model
Trained by `ml_service/train.py` on the UCI SMS Spam Collection (5,574 messages). On the held-out test set: accuracy 98.4%, precision 97.1%, recall 91.1%, F1 94.0%, ROC-AUC 0.99. See `ml_service/models/evaluation.json`.
For recruitment-specific accuracy, add the EMSCAD dataset (`fake_job_postings.csv`, "Real or Fake Job Posting" on Kaggle) to `ml_service/data/` and run `python train.py`.

## Security
- JWT authentication (HS256) with rotating, revocable refresh tokens in httpOnly cookies; role-based access control.
- Rate limiting on login and analysis endpoints (`TRUST_PROXY=1` behind a reverse proxy).
- SSRF protection for every outbound request (private, link-local and IP-literal targets blocked).
- Uploads: PNG, JPEG, PDF, DOCX, TXT only, max 15MB and 5 files; checked by file signature; decompression-bomb limits for QR decoding; OCR timeout and concurrency cap.
- Helmet security headers and a restricted CORS origin.

## Running locally
```bash
# Backend (http://localhost:5001)
cd backend && npm install
cp ../.env.example .env        # then set JWT_SECRET (and DATABASE_URL if you want persistence)
npm run dev

# Frontend (http://localhost:5173, proxies /api to the backend)
cd frontend && npm install && npm run dev

# ML service (optional, http://localhost:8000)
cd ml_service && pip install -r requirements.txt && uvicorn app:app --reload

# PostgreSQL + ML service via Docker (optional)
docker compose up -d
```
Production build: `npm run build` at the repository root, then `npm start` (the backend serves the built frontend).

## Tests
```bash
cd backend && npm test             # offline suites (also run in CI)
npm run test:network               # DNS/TLS/RDAP lookups (needs internet)
npm run test:db                    # needs PostgreSQL
npm run test:live                  # needs a running backend on :5001
cd ml_service && python -m pytest tests
```

## Limitations
- Results are risk indicators from rules and public data, not proof of fraud.
- The bundled ML training data is general SMS spam; add EMSCAD for job-scam-specific training.
- LinkedIn blocks most automated reads, so the Company Check relies on figures the student copies from the page.
- No MCA/GST registration or Glassdoor/AmbitionBox lookups (no free public APIs).
- Rule keywords are mostly English; Tamil and Hindi are detected but only partly covered by the rules.
- The web app does not have a login screen yet; history is stored in the browser. The authenticated APIs are available for integrations.

# SCAMCHECK API Reference

Base URL: `http://localhost:5001/api` (development).
Analysis endpoints are rate limited per IP (`ANALYSIS_RATE_LIMIT_PER_MIN`, default 20/min) and return `429` when exceeded. Client errors return `400` with `{ "error": "..." }`.

## Analysis (no login required)

### `POST /investigate`
Analyses an opportunity and returns the full investigation report.

- **JSON body:** `{ "text"?: string, "url"?: string, "linkedinUrl"?: string, "linkedinFacts"?: object, "title"?: string }`
- **Multipart:** the same fields, plus `files` (up to 5) or `file` (1). Allowed: PNG, JPEG, PDF, DOCX, TXT, max 15MB each. Files are checked by their actual bytes, not just extension. Images are read with OCR, and QR codes inside them are decoded.
- **Response highlights:** `riskScore` (0-100), `riskTier` (`LOW RISK | NEEDS VERIFICATION | HIGH RISK`), `confidenceScore`, `signals`, `evidenceChain`, `contradictions`, `recommendedAction`, `verificationCenter` (DNS/TLS/RDAP/email checks), `machineLearning`, `multimodal`, `companyCredibility`.

### `POST /compare`
`{ "textA": string, "textB": string }` → both reports plus `deltaSummary` (safer option and key differences).

### `POST /company-check`
Rates a company's credibility from its LinkedIn footprint and judges whether its internship or certificate program is useful for a student's career.
Provide at least one of `companyName`, `linkedinUrl` or `offerText`:
```json
{
  "companyName": "CodeSkill Infotech",
  "linkedinUrl": "https://www.linkedin.com/company/codeskill-infotech/",
  "offerText": "Virtual internship... certificate fee Rs 499...",
  "linkedinFacts": {
    "followers": 45000,
    "employeesOnLinkedIn": 8,
    "foundedYear": 2023,
    "website": "codeskill.in",
    "internsPlacedAtGoodCompanies": "yes | no | unknown",
    "postsMostlyCertificates": true
  }
}
```
Response: `credibilityScore`, `verdict` (`REPUTABLE | CREDIBLE | UNPROVEN | RED_FLAGS`), `evidenceLevel`, `factors`, `linkedin` (lookup status and facts with their source), `careerValue` (`programModel`, `score`, `verdict`, advice), `linkedinChecklist`.
LinkedIn usually blocks automated reads, so `linkedinFacts` entered by the student take precedence over anything fetched.

### `GET /demos`, `GET /demos/:id`
Built-in example opportunities.

### `GET /health`
Liveness check.

## Authentication (`/api/auth`)
Login routes are rate limited (20 requests / 15 min / IP). Requires `JWT_SECRET`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Returns an access token (HS256 JWT) and sets an httpOnly refresh cookie |
| POST | `/auth/refresh` | Rotates the refresh token, returns a new access token |
| POST | `/auth/logout` | Revokes the refresh token |
| GET | `/auth/me` | Current user (Bearer token) |

## Intelligence APIs (login + PostgreSQL required)
Send `Authorization: Bearer <accessToken>`. These need `DATABASE_URL`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/investigations`, `/investigations/:id` | Saved investigations (scoped to the user's role) |
| GET | `/graph/entity/:entityId`, `/graph/investigation/:investigationId` | Trust-graph relationships |
| GET | `/threat-intelligence`, `/threat-intelligence/:id` | Indicators seen across investigations |
| GET | `/campaigns`, `/campaigns/:campaignId` | Detected scam campaigns (shared emails, phones, UPI IDs) |
| POST | `/campaigns/:campaignId/review` | Analyst review of a campaign |
| GET | `/payments/:id/assessment`, `/payments/:id/related-investigations` | Payment destination risk |
| POST | `/payments/:id/report` | Report a payment destination |

## ML service (internal, port 8000)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/analyze` | `{ "text": string }` → calibrated scam probability from the trained model, combined with recruitment-fraud cues |
| POST | `/api/ai/similarity` | Similarity to known scam templates |
| GET | `/health` | Whether the trained model is loaded |

All outbound fetches (URL analysis, LinkedIn, verification) go through `SafeNetworkClient`, which blocks private and internal addresses (SSRF protection).

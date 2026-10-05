# SCAMCHECK 2-Minute Demo Flow

### 0:00 - 0:15 [The Hook]
"Digital fraud has evolved. Traditional spam filters catch 'Nigerian Prince' emails, but fail against perfectly formatted fake job offers instructing victims to pay a 'verification fee' via a specific UPI endpoint. SCAMCHECK stops this using a 9-layer AI/ML security pipeline."

### 0:15 - 0:45 [The Action]
- **Action**: Analyst opens the SCAMCHECK SOC Dashboard.
- **Action**: Navigates to 'New Investigation' and uploads `demo/multilingual_scam.txt`.
- "We input an encrypted, cross-language payment demand. SCAMCHECK's orchestrator kicks off."

### 0:45 - 1:15 [The Intelligence]
- **Action**: Expand the Multimodal Evidence panel.
- "Our engine extracts text, identifies payment vectors (like UPI QR payloads), and queries Threat Intelligence."
- "Notice our ML fallback classifier categorizing the urgency tone without relying on cloud LLM inference."

### 1:15 - 1:45 [The Graph & The Verdict]
- **Action**: Open the Verification Center.
- "SCAMCHECK automatically maps the extracted domain against official network registrations and calculates a Trust Score."
- "Our entity graph correlates this attempt to previous known campaigns, assigning it 'HIGH RISK'."

### 1:45 - 2:00 [The Conclusion]
- **Action**: Show the Final Output/Print Report.
- "We deliver a comprehensive, actionable intelligence report. Fully containerizable, strictly authenticated via HS256 JWT, and protected against internal traversal. This is SCAMCHECK."

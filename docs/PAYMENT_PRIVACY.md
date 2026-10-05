# Payment Privacy Architecture

## Overview
Payment Identifiers (UPIs, Bank Accounts, Phone Numbers) are highly sensitive Personal Identifiable Information (PII). ScamCheck must handle these strictly in accordance with privacy principles to prevent data leakage or doxxing.

## 1. Tenant Isolation
- **Rule**: Users must not be able to browse payment identifiers belonging to other users.
- **Enforcement**: In `getRelatedInvestigationsHandler`, if a user requests related investigations for a given payment entity, the result set is filtered down to *only* investigations owned by that user. `SECURITY_ANALYST` and `SYSTEM_ADMIN` roles bypass this restriction for threat hunting purposes.

## 2. Shared Intelligence vs Raw Data
- The Trust Graph calculates risk on an entity (e.g., this UPI has been flagged 5 times).
- A user querying their own investigation will see the aggregated risk score (`HIGH RISK: Reused in 5 investigations`), but they will *never* see the raw input texts, chat logs, or user identities of the other 4 investigations.
- Risk metrics are shared; raw context is isolated.

## 3. Data Masking (Frontend Guidance)
- When displaying payment identifiers in public or non-privileged views, the frontend should mask the identifier (e.g. `mer*******@okicici`). 
- Full identifiers should only be revealed to the original uploader or an authorized security analyst.

## 4. Evidence Hashing
- ScamCheck utilizes SHA-256 hashing (introduced in Phase 7) for canonical entities. If we need to verify whether two banks match without exposing the account numbers, we can compare fingerprints. 

# Campaign Security & Isolation (Phase 8 Hardening)

## Overview
Phase 8 connects isolated investigations into broad Scam Campaigns. This exposes significant cross-tenant data leakage risks if left unprotected. The system enforces strict isolation and access controls.

## Campaign Lifecycle & Analyst Authorization
- Campaigns are always generated as `CANDIDATE`.
- Only users with `SECURITY_ANALYST` or `SYSTEM_ADMIN` roles can transition a candidate to `CONFIRMED` or `REJECTED`. 
- Ordinary users (`USER`, `ORGANIZATION_ADMIN`) attempting to hit the Review API will receive a `403 Forbidden`.
- Every transition is tracked in the `AuditLog` with a mandatory string `reason`.

## Cross-Tenant Private Data Isolation
When an ordinary user queries a Campaign (`GET /api/campaigns/:campaignId`):
1. The backend retrieves all investigations linked to that Campaign.
2. An RBAC filter is forcibly applied: `!ci.investigation.userId || ci.investigation.userId === userId`.
3. Consequently, the user only sees their own evidence for the campaign. They cannot view the titles, uploaded documents, or extracted PII from investigations submitted by other victims.
4. Security Analysts bypass this filter, allowing them to view the entire scope of the campaign.

## Campaign Duplicate Prevention
To prevent duplicating campaigns when multiple investigations share overlapping infrastructure, the `CorrelationEngine` employs a deterministic update strategy:
1. It queries existing `CANDIDATE`, `UNDER_REVIEW`, or `CONFIRMED` campaigns linked to the overlapping investigations.
2. If multiple candidates exist, it deterministically selects the one with the highest correlation score (tie-breaking with the UUID).
3. The new investigation and entities are securely appended to that existing campaign, rather than blindly creating duplicate candidates.

## Threat Intelligence Isolation
The `MockExternalIntelProvider` is strictly isolated for testing and development.
- It requires `ENABLE_MOCK_THREAT_INTEL=true`.
- Any intelligence it produces is explicitly flagged with provenance `MOCK_EXTERNAL` and `SYNTHETIC_TEST_ONLY` to prevent test data from being mistaken for real threat intelligence in a production environment.

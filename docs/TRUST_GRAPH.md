# Trust Graph & Entity Resolution (Phase 7)

## Overview
Phase 7 introduces the ScamCheck Trust Graph, transforming the platform from an isolated case-by-case analysis tool into a connected intelligence system. By extracting, normalizing, and linking entities (Emails, Domains, Phone Numbers, Organizations), the platform can identify overlapping infrastructure across multiple investigations.

## Entity Resolution & Fingerprinting
Entities are not simply strings; they are canonicalized and fingerprinted to guarantee stable deduplication without relying on fuzzy or probabilistic merges.

1. **Normalization**:
   - `EMAIL`: Lowercased, trimmed.
   - `URL` / `DOMAIN`: Stripped of protocols and trailing slashes.
   - `PHONE`: Stripped of all non-numeric characters (retaining `+` for international codes).
   - `ORGANIZATION`: Stripped of punctuation and normalized spacing.
2. **Fingerprinting**: `SHA-256(type + ":" + normalizedValue)`
3. **Deduplication**: When an entity is encountered, its fingerprint is used to UPSERT against the global `Entity` table. If it already exists, the investigation is simply linked via the `InvestigationEntity` join table, preventing redundant nodes.

## Relationship Generation
The platform automatically generates deterministic structural relationships based on the extracted entities:
- **EMAIL_ON_DOMAIN**: Connects an `EMAIL` entity to its parent `DOMAIN` entity.
- **URL_ON_DOMAIN**: Connects a `URL` entity to its parent `DOMAIN` entity.

Example Graph Edge:
`hr@example.com` (EMAIL) -> `EMAIL_ON_DOMAIN` -> `example.com` (DOMAIN)

## Cross-Tenant Security & Isolation
The Trust Graph strictly adheres to Phase 3 RBAC (Role-Based Access Control) ownership models to prevent data leakage:
- Graph queries do **not** blindly return all investigations linked to an entity.
- The `graphService.ts` filters connected investigations based on the requesting user's `userId`. 
- An analyst querying `example.com` will only see that it appears in "4 authorized investigations" (if they only have access to 4), preventing them from accessing private victim submissions from other tenants.
- Global intelligence counts ("Total Occurrences") are permitted, but no PII or investigation titles are leaked for unauthorized edges.

## Graph Query Limits
To prevent expensive recursive CTEs and graph exhaustion attacks, graph queries are strictly limited to **1-hop neighbors**. The system resolves an entity's immediate relationships (e.g., its domain) and the authorized investigations it appears in. Deep multi-hop traversal is disabled in the API layer.

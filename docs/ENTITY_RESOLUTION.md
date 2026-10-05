# Entity Resolution (Phase 7)

## Centralized Normalization Pipeline
The Entity Resolution layer is responsible for creating a deterministic, stable mapping of real-world identifiers to unified graph nodes. Instead of performing fuzzy, destructive merges (which can accidentally collapse unrelated entities into one), the system uses explicit normalization rules and cryptographic fingerprinting.

## Rules per Type
- **EMAIL**: Lowercased and whitespace trimmed. 
  - `HR@Example.com` -> `hr@example.com`
- **DOMAIN / URL**: Stripped of leading protocols (`http://`, `https://`) and trailing paths/slashes if applicable.
  - `https://careers.company.com/` -> `careers.company.com`
- **PHONE**: All non-numeric characters removed except a leading `+` for international codes.
  - `+1 (555) 123-4567` -> `+15551234567`
- **ORGANIZATION / PERSON**: Punctuation removed, multiple spaces reduced to a single space, lowercased.
  - `Acme Tech, Inc.` -> `acme tech inc`

## Fingerprinting
A stable canonical fingerprint is generated via SHA-256 for each normalized entity.
`fingerprint = SHA-256(entityType + ":" + normalizedValue)`

## Merge Candidates (Future)
Fuzzy matching (e.g. edit distance or token similarity) is NOT used for automatic merging. If two organizations are similar (e.g., `Acme Technologies` vs `Acme Tech`), they remain separate entities. They can be flagged as "Merge Candidates" for analysts in a future phase, but destructive graph merging is prohibited to protect investigation integrity.

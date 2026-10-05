# Graph Security & Privacy (Phase 7)

## The Risk of Cross-Tenant Leakage
A naive Trust Graph implementation will link entities (like an email address) across multiple user investigations. If a user queries the graph for that email, they might accidentally see the title, content, or PII from another user's private investigation, simply because they both analyzed the same scammer's email.

## Cross-Tenant Isolation
ScamCheck mitigates this via explicit graph authorization in `graphService.ts`.
- **Entity Identity**: The entity node itself (e.g., `hr@scammer.com`) is globally queryable.
- **Investigation Edges**: The edges connecting that entity to specific investigations are heavily filtered.
  - A standard user will *only* see investigations they own.
  - They will be told "This entity exists in X global investigations", but the list of investigations will be censored.
  - Security Analysts and System Admins (via RBAC) can view the full context of the edges.

## Graph Abuse & Performance Exhaustion
- **Depth Limits**: The graph API only returns 1-hop relationships. It does not perform deep recursive Common Table Expressions (CTEs) to find all possible connections, protecting the database from denial-of-service (DoS) via complex graph queries.
- **Pagination & Node Limits**: In future phases with larger graphs, pagination is required. The current implementation fetches limited adjacent arrays to prevent memory exhaustion.

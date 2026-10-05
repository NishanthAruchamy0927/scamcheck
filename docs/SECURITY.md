# SCAMCHECK Security Strategy

## Authentication
JWT-based authentication is strictly enforced. The `HS256` signature algorithm is natively enforced by explicitly refusing `none` and explicitly defining the array parameter in `jsonwebtoken`. Secret parameters fallback to strict evaluation, crashing execution if missing in production.

## Role Based Access Control (RBAC)
Explicit middleware arrays permit only scoped roles (USER, ORGANIZATION_ADMIN, SECURITY_ANALYST, SYSTEM_ADMIN) into designated interfaces.

## Tenant Isolation
All ORG_ADMIN database calls append `orgId` filtering implicitly. Horizontal privilege escalation prevents standard users from observing adjacent investigations.

## Prompt Injection Defense
Text content indicating command manipulation ("Ignore previous instructions") is actively filtered as `SECURITY_SIGNAL`, securely overriding classification into `SUSPICIOUS` to prevent downstream poisoning.

## SSRF Prevention
`SafeNetworkClient` inherently blocks connection targets mapping to localhost, 127.0.0.1, 169.254.169.254, or other private subnets before executing fetch loops.

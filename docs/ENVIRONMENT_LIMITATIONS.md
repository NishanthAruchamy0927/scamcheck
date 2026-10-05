# SCAMCHECK Environment Limitations

The deployment and testing of SCAMCHECK is actively constrained by local environment parameters. 

## Identified Limitations
- **PostgreSQL Database E2E Validation**: The local execution environment faces severe heap space restrictions (V8 `Fatal process out of memory: Zone`) which causes `npx prisma generate` to crash during compilation of heavily nested relations. As a result, the live PostgreSQL daemon cannot effectively hook into the CI validations.
- **Docker**: The host currently lacks the `docker` binary, blocking containerized builds of Postgres/Redis/AI components.
- **Node Modules & ENOSPC**: Occasional `ENOSPC` constraints block arbitrary addition of large library structures (like QR code decoders), necessitating explicit mock controls in `package.json` testing.

## Handling Strategy
- Security implementations, logic boundaries, and schema integrity are verified functionally via isolated TypeScript units (`npx tsx`) to validate the application logic mathematically without demanding live binary SQL instances.

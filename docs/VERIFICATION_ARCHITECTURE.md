# Verification Architecture (Phase 6)

## Overview
The ScamCheck Verification Engine provides the core infrastructure for independently auditing claims made within an opportunity against external, authoritative sources. Rather than relying exclusively on probabilistic risk detection, the verification layer seeks deterministic cryptographic proofs of organizational affiliation.

## Core Verification Flow
1. **Extraction**: Entities (Organization Name, Domains, Contact Emails) are extracted from the source material.
2. **Normalization**: Entities are mapped to Canonical Enterprise Registries.
3. **Execution of Verification Adapters**: The engine queries external sources using specialized network clients.
4. **Synthesis**: Results are combined to compute a Trust Score and Verification Confidence.

## Adapters
* **DNS Verification (`verifyDns`)**: Validates the existence of A, AAAA, and MX records to ensure the infrastructure is real and capable of receiving mail.
* **TLS/SSL Verification (`verifyTls`)**: Connects to the host on port 443, verifies the certificate chain, and extracts the issuer identity.
* **Email Infrastructure (`verifyEmailInfrastructure`)**: Checks TXT records for SPF (`v=spf1`) and DMARC (`v=DMARC1`) policies, verifying that the domain is configured to prevent email spoofing.
* **Registration Data (`verifyRdap`)**: Uses the Registration Data Access Protocol (RDAP) via a safe abstraction to determine domain age and registrar identity.

## Extensibility
Additional verifiers (e.g. WHOIS, LinkedIn corporate API, Govt Corporate Registries) can be added by implementing the generic `VerificationAdapter` interface and appending them to `externalContext` within `types.ts`.

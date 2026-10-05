# SCAMCHECK Database Design

## Overview
The Phase 2 database design focuses on a PostgreSQL persistence foundation. The schema is managed using Prisma ORM.

## Entities
* **User**: Represents a standard user, admin, or analyst.
* **Organization**: Represents companies and verified entities.
* **Investigation**: Core entity storing a user's scan request.
* **InvestigationInput**: The raw metadata or content hash submitted.
* **AnalysisResult**: JSONB payload of all rule triggers and findings.
* **RiskAssessment**: The calculated 0-100 risk score and severity.
* **ConfidenceAssessment**: The calculated 0-100 confidence score based on evidence completeness.
* **Evidence**: Hashed file metadata acting as a chain-of-custody foundation.
* **Entity**: Extracted indicators (Emails, Domains, Recruiters) that will power the future Trust Graph.
* **AuditLog**: Records user actions for security compliance.
* **ModelVersion**: Tracks the active heuristics/ML ruleset used for an investigation.

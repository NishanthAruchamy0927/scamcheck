# SCAMCHECK Architecture

## Overview
SCAMCHECK is an AI/ML-powered cybersecurity and scam intelligence platform. It consists of:
1. **Frontend**: React, TypeScript, Vite, TailwindCSS
2. **Backend API**: Node.js, Express
3. **Database**: PostgreSQL (managed via Prisma)

## Data Flow
Client -> Node.js Express -> Heuristic Engine (22+ rules) -> Persistence Layer -> PostgreSQL -> Client

The system maintains a stateless feel for the heuristic analysis but persists all generated findings (Risk Assessments, Confidence Assessments, Extracted Entities, Evidence) in the database for future cross-referencing and Threat Graph intelligence.

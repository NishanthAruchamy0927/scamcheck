# SCAMCHECK Development Guide

## Prerequisites
* Node.js v18+
* Docker Desktop (for local PostgreSQL)

## Setup
1. Clone the repository.
2. Ensure you have copied `backend/.env.example` to `backend/.env` and configured it appropriately.
3. Start the local database:
   ```bash
   docker compose up -d
   ```
4. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. Apply database migrations:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```
   *(Note: For production, use `npx prisma migrate deploy`)*

## Running the App
* **Backend**: `cd backend && npm run dev`
* **Frontend**: `cd frontend && npm run dev`

## Testing
* **Backend Engine Tests**: `cd backend && npm test`
* **Database Connection Test**: `npx tsx tests/test_database.ts`
* **Integration API Audit**: `npx tsx tests/comprehensive_audit_runner.ts`

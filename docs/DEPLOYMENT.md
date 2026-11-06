# Deployment Guide

## Vercel single-project deployment
The repository is configured for a single Vercel project under the root `vercel.json` file. The routing model exposes:

- `/` → frontend app
- `/api/*` → FastAPI backend
- other module routes remain on the same public domain

This keeps the frontend and backend on one public domain without requiring a separate public backend deployment.

## Local development

### Backend
```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```powershell
cd frontend
npm ci
npm run dev
```

## Production database configuration
- Local development continues to use SQLite by default.
- Production should set `DATABASE_URL` to a PostgreSQL connection string.
- Example:

```bash
DATABASE_URL=postgresql+psycopg://user:password@host:5432/ciphermesh
ENVIRONMENT=production
CORS_ORIGINS=https://<your-vercel-domain>.vercel.app
```

## Applying the initial database migration
```bash
cd backend
.venv\Scripts\python.exe -m alembic upgrade head
```

This preserves the repository’s local SQLite workflow and adds the PostgreSQL-ready path for hosted deployments.

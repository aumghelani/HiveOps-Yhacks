# HiveOps

Enterprise AI incident resolution — built for YHacks 2026.
"Every incident. Every trace. One hive."

## Quick Start

```bash
# One-time setup
npm run install:all

# Run both servers with one command
npm run dev
```

This starts:
- **Backend** on http://localhost:8000 (FastAPI + uvicorn, hot reload)
- **Frontend** on http://localhost:5173 (Vite + React, hot reload)

The frontend proxies `/api` calls to the backend automatically.

## Manual Start (if needed)

```bash
# Backend
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

## Architecture
See CLAUDE.md for full context.

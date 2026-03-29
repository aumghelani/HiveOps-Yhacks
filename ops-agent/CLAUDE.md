# HiveOps — Project Brain

## What this project is
Enterprise AI incident resolution system named HiveOps.
Incidents come in via webhook, an orchestrator agent decomposes them
into sub-tasks, specialized agents investigate, a structured memory
bank (Pattern Family + Procedural Playbook Store) finds similar past
incidents, a sandbox mocks fixes, and a human approves before any
production action. Every resolved incident enriches the memory graph.

## Product name
HiveOps — the "O" in the logo is always a hexagon SVG icon (amber).
Tagline: "Every incident. Every trace. One hive."

## Tech stack
- Backend: Python 3.11 + FastAPI + uvicorn
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- Database: Supabase (Postgres) — client lib: supabase-py
- LLM calls: Lava API (OpenAI-compatible endpoint) → claude-sonnet-4-20250514
- Memory layer: Hex API (structured SQL) + Supabase mirror
- State management: Zustand + React Query
- Animations: Framer Motion (ALL animations) + Canvas API (HiveField)
- Editor integration: Zed (diff viewer deep-link)
- Auth: deferred — not in MVP

## Monorepo layout
hiveops/
├── CLAUDE.md
├── docs/
│   ├── PROGRESS.md
│   ├── ERRORS.md
│   ├── DECISIONS.md
│   ├── SCHEMA.md
│   ├── ENV.md
│   └── ROLLBACK.md
├── backend/
└── frontend/
    └── src/
        ├── components/
        │   ├── hive/          ← HiveField, HiveLoader, HivePulse, HivePattern, HiveProgress
        │   ├── incident/      ← SubTasksPanel, EvidenceDossier, DiffPanel, etc.
        │   ├── layout/        ← Sidebar, TopBar, AppLayout
        │   └── shared/        ← AgentCard, StatusPill, SeverityBadge, etc.
        ├── mock/              ← ALL mock data lives here only
        ├── pages/
        └── types/

## Ports
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Vite proxies /api → http://localhost:8000

## Key rules (never break these)
1. Backend is ASYNC throughout
2. Every route: 202 for background tasks, 404 for not found
3. Lava client is singleton — never instantiate inside agent functions
4. Memory stage 1 returns ONLY headline fields
5. Sandbox is fully mocked
6. Human approval REQUIRED before any production action
7. One-line comments on important parts — not every line
8. HiveLoader replaces ALL spinners everywhere — no exceptions
9. ALL animations use Framer Motion — no raw CSS transitions except color vars
10. The "O" in HiveOps logo is always a hexagon SVG

## Current chapter
→ See docs/PROGRESS.md

## Known issues
→ See docs/ERRORS.md

# ⬡ HiveOps

**Enterprise AI Incident Resolution**
*Every incident. Every trace. One hive.*

Built for YHacks 2026 — [hiveops.us](https://hiveops.us)

---

## What is HiveOps?

HiveOps is an AI-powered incident resolution platform that automatically investigates, diagnoses, and proposes fixes for production incidents — with a human always in the loop before any action is taken.

When an incident arrives, HiveOps deploys a swarm of specialized AI agents that work in sequence — triage, root cause analysis, remediation planning, sandbox verification — then assembles an evidence dossier for human review. Every resolved incident enriches the memory bank, making the system smarter over time.

## How It Works

```
Incident arrives → Triage Agent classifies severity + causal signature
                 → Root Cause Agent scans logs, deployments, config diffs
                 → Remediation Agent matches playbook, proposes fix
                 → Verification Agent tests fix in sandbox
                 → Evidence Dossier presented to human reviewer
                 → Human approves → Fix deployed → Memory bank updated
```

## Key Features

### AI Agent Pipeline
- **5 specialized agents** run sequentially per incident: Triage → Root Cause → Remediation → Verification → Reviewer Summary
- Each agent produces structured output with confidence scores
- Low-confidence results automatically escalate to stronger models
- Full audit trail of every agent decision

### Structured Memory Bank
- **No RAG** — uses structured pattern matching by causal signature and service name
- 4-stage progressive disclosure: count → headlines → timeline → full resolution path
- Every resolved incident becomes a pattern for future matching
- Playbook store with reusable fix recipes and success rates

### Evidence Dossier
- 3-level progressive disclosure for human reviewers
- Sandbox diff panel showing before/after state
- Risk assessment with factor breakdown
- Memory references to similar past incidents
- One-click approve / reject / request revision

### QueenBee AI Assistant
- Context-aware chatbot powered by Lava API
- Automatically knows which incident you're viewing
- Quick action chips and `/slash` commands
- Smart fallback when API is unavailable

### Gmail-Style Split View
- Click an incident tile → detail panel slides in on the right
- Color-coded tiles: green (resolved), amber (awaiting approval), blue (investigating), red (rejected)
- Full incident detail without leaving the list

### 7 Demo Scenarios
Pre-built incident scenarios covering real-world failure modes:
- Payment API 500 errors (DB pool exhaustion)
- Auth service JWT failures (config regression)
- Order service OOM kill loop
- Search returning empty results (stale index)
- VPN gateway failure
- Billing engine overcharging
- Notification queue backlog

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion |
| State | Zustand (UI) · React Query (data fetching + polling) |
| Backend | Python 3.11 · FastAPI · uvicorn (async) |
| LLM Gateway | Lava API → Claude (Sonnet / Haiku) |
| Memory | Hex API (structured SQL) · Supabase (Postgres) |
| Realtime | WebSocket · Server-Sent Events |
| Deployment | Vercel (frontend) · Render (backend) · GoDaddy (domain) |

## Quick Start

```bash
# Prerequisites: Node.js 18+, Python 3.11+

# Clone and install
git clone https://github.com/aumghelani/HiveOps-Yhacks.git
cd HiveOps-Yhacks/ops-agent
npm run install:all

# Run both servers
npm run dev
```

This starts:
- **Backend** → http://localhost:8000 (FastAPI, hot reload)
- **Frontend** → http://localhost:5173 (Vite, hot reload)

Open http://localhost:5173 → click **Trigger Demo** → watch agents resolve an incident live.

## Project Structure

```
ops-agent/
├── backend/                 Python FastAPI backend
│   ├── app/
│   │   ├── api/routes/      18 REST + WS + SSE endpoints
│   │   ├── agents/          6 AI agents (triage, RCA, remediation, etc.)
│   │   ├── memory/          Hex client + progressive disclosure loader
│   │   ├── sandbox/         Mocked infrastructure simulation
│   │   └── schemas/         26 Pydantic models
│   └── requirements.txt
├── frontend/                React + TypeScript frontend
│   ├── src/
│   │   ├── components/      Hive dot system, EvidenceDossier, QueenBee, etc.
│   │   ├── pages/           5 pages with split view
│   │   ├── hooks/           React Query + WebSocket hooks
│   │   └── api/             Axios client with env-based URL
│   └── vercel.json
└── docs/                    Architecture, schema, decisions, error log
```

## Architecture

```
┌───────────┐     ┌───────────┐     ┌────────────┐
│  Vercel   │────▶│  Render   │────▶│  Lava API  │
│ (React)   │     │ (FastAPI) │     │  (Claude)  │
│hiveops.us │     │           │────▶│  Hex API   │
└───────────┘     │           │────▶│  Supabase  │
                  └───────────┘     └────────────┘
```

See [docs/ARCHITECTURE.md](ops-agent/docs/ARCHITECTURE.md) for detailed system diagrams and data flows.

## Design Principles

1. **Human-in-the-loop** — agents propose, humans approve, never auto-execute
2. **Structured matching** — causal signatures over embeddings, interpretable over magical
3. **Progressive disclosure** — show the right detail at the right time
4. **Graceful degradation** — works with mock data when any external service is down
5. **Full audit trail** — every agent step logged for compliance
6. **Memory compounds** — every resolution makes the system smarter

## Environment Variables

The backend runs in **demo mode** (in-memory, mock data) with no configuration needed. For full functionality:

| Variable | Purpose |
|----------|---------|
| `LAVA_API_KEY` | LLM gateway for agent reasoning + QueenBee |
| `SUPABASE_URL` / `SUPABASE_KEY` | Persistent database |
| `HEX_API_TOKEN` | Structured memory queries |
| `VITE_API_URL` | Frontend → backend URL (production) |

See [docs/ENV.md](ops-agent/docs/ENV.md) for the full list.

## License

MIT

---

*Built with care at YHacks 2026.*

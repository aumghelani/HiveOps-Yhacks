# HiveOps — Architecture & Workflow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  Vercel · hiveops.us · React 18 + TypeScript + Vite + Tailwind  │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Incidents │ │ Memory   │ │Playbooks │ │Audit Log │            │
│  │  Page    │ │  Bank    │ │  Page    │ │  Page    │            │
│  └────┬─────┘ └──────────┘ └──────────┘ └──────────┘            │
│       │                                                           │
│  ┌────▼─────────────────────────────────────┐  ┌──────────────┐  │
│  │  Split View (Gmail-style)                │  │  QueenBee    │  │
│  │  ┌─────────┐  ┌──────────────────┐       │  │  Chatbot     │  │
│  │  │ Tile    │──▶ Detail Panel     │       │  │  (Lava AI)   │  │
│  │  │ List    │  │ Sub-tasks        │       │  └──────┬───────┘  │
│  │  │         │  │ Timeline         │       │         │          │
│  │  │         │  │ Evidence Dossier │       │         │          │
│  │  └─────────┘  └──────────────────┘       │         │          │
│  └──────────────────────────────────────────┘         │          │
│       │              │            │                    │          │
│  ┌────▼──────────────▼────────────▼────────────────────▼───────┐ │
│  │                    API Client (axios)                        │ │
│  │  React Query (polling 2-5s) · WebSocket · SSE streams       │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP / WS / SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                          │
│       Render · hiveops-api.onrender.com · Python 3.11           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                     API Routes                            │    │
│  │  POST /api/incidents/webhook     → creates incident       │    │
│  │  GET  /api/incidents/            → list all                │    │
│  │  GET  /api/incidents/{id}        → detail                  │    │
│  │  GET  /api/incidents/{id}/sub-tickets                      │    │
│  │  GET  /api/incidents/{id}/evidence                         │    │
│  │  GET  /api/incidents/{id}/logs                             │    │
│  │  GET  /api/incidents/{id}/memory/{stage}  (0-3)            │    │
│  │  GET  /api/incidents/{id}/stream/{agent}  (SSE)            │    │
│  │  POST /api/approvals/{id}/decide                           │    │
│  │  POST /api/chat/                 → QueenBee                │    │
│  │  WS   /ws/incidents/{id}         → live updates            │    │
│  └───────────────┬──────────────────────────────────────────┘    │
│                  │                                                │
│  ┌───────────────▼──────────────────────────────────────────┐    │
│  │                  Pipeline Engine                          │    │
│  │  Orchestrates 5 agents sequentially per incident          │    │
│  │                                                           │    │
│  │  webhook → Triage → Root Cause → Remediation              │    │
│  │              → Verification → Reviewer Summary            │    │
│  │              → status: awaiting_approval                  │    │
│  └───────┬───────────┬──────────────┬───────────────────────┘    │
│          │           │              │                             │
│  ┌───────▼───┐ ┌─────▼────┐ ┌──────▼──────┐                     │
│  │  Lava     │ │ Memory   │ │  Sandbox    │                     │
│  │  Client   │ │ Loader   │ │  Runner     │                     │
│  │ (LLM API) │ │ (Hex+DB) │ │ (mocked)   │                     │
│  └───────┬───┘ └─────┬────┘ └─────────────┘                     │
│          │           │                                            │
└──────────┼───────────┼────────────────────────────────────────────┘
           │           │
           ▼           ▼
    ┌──────────┐ ┌──────────┐
    │  Lava    │ │   Hex    │
    │  API     │ │   API    │
    │(Claude)  │ │ (SQL)    │
    └──────────┘ └──────────┘
```

---

## Incident Lifecycle

```
 Trigger (webhook)
       │
       ▼
  ┌──────────┐
  │ INCOMING │  Incident created in store
  └────┬─────┘
       │  Pipeline starts in background
       ▼
  ┌──────────┐
  │  TRIAGE  │  Agent classifies: severity, category, causal_sig
  └────┬─────┘  Model: haiku (fast)
       │        Output: "P1, api_error.5xx, db_pool_exhausted"
       ▼
  ┌──────────────┐
  │INVESTIGATING │  Root Cause agent runs 3 sub-tasks:
  └────┬─────────┘  1. Scan logs (ConnectionPoolExhausted × 1847)
       │            2. Map blast radius (14 downstream services)
       │            3. Synthesize hypothesis
       │            Model: sonnet (default), escalates to strong if conf < 0.6
       ▼
  ┌──────────────┐
  │ REMEDIATION  │  Matches playbook PB-001, proposes pool resize
  └────┬─────────┘  Model: sonnet
       │
       ▼
  ┌──────────────┐
  │ VERIFICATION │  Runs fix in mock sandbox
  └────┬─────────┘  Health check: pass, 0 errors in 60s
       │            Model: haiku (fast)
       ▼
  ┌──────────────────┐
  │AWAITING_APPROVAL │  Evidence dossier assembled
  └────┬─────────────┘  Human reviews: root cause, diff, risk, similar incidents
       │
       ├──── Approve ──▶ RESOLVED (memory bank updated)
       ├──── Reject  ──▶ REJECTED
       └──── Revise  ──▶ INVESTIGATING (re-run agents)
```

---

## Tech Stack Interconnections

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│                                                      │
│  React 18 ──── React Router (5 pages + split view)  │
│     │                                                │
│     ├── Zustand ──── UI state (selected incident,   │
│     │                 celebration, theme)             │
│     │                                                │
│     ├── React Query ── data fetching + polling       │
│     │     │              refetchInterval: 2-5s       │
│     │     │              retry: false (instant mock   │
│     │     │              fallback when backend down)  │
│     │     │                                          │
│     │     └── axios ── HTTP client                   │
│     │          baseURL: VITE_API_URL/api or /api     │
│     │                                                │
│     ├── WebSocket ── live incident updates           │
│     │     ws://backend/ws/incidents/{id}             │
│     │     pushes to React Query cache directly       │
│     │                                                │
│     ├── Framer Motion ── ALL animations              │
│     │     page transitions, card hover, loaders      │
│     │                                                │
│     └── Tailwind CSS v4 ── utility classes           │
│           + CSS variables ── theming (dark/light)    │
│           @custom-variant dark (&:where(.dark, *))   │
│                                                      │
│  Fonts: Plus Jakarta Sans · Inter · JetBrains Mono   │
└─────────────────────────┬────────────────────────────┘
                          │
              Vite proxy (/api → :8000)
              or VITE_API_URL in production
                          │
┌─────────────────────────▼────────────────────────────┐
│                    BACKEND                            │
│                                                      │
│  FastAPI ──── uvicorn (async, hot reload)             │
│     │                                                │
│     ├── Pydantic v2 ── 26 schema models              │
│     │     IncidentRead, SubTicketRead, AgentLogRead  │
│     │     OrchestratorPlan, TriageResult, etc.       │
│     │                                                │
│     ├── Pipeline Engine ── orchestrates agents        │
│     │     │  In-memory stores (demo mode)            │
│     │     │  incidents_store, sub_tickets_store       │
│     │     │  agent_logs_store, sandbox_runs_store     │
│     │     │                                          │
│     │     ├── Triage Agent ── fast model (haiku)     │
│     │     ├── Root Cause Agent ── default + escalate │
│     │     ├── Remediation Agent ── playbook matching │
│     │     ├── Verification Agent ── sandbox runner   │
│     │     └── Reviewer Summary Agent ── dossier      │
│     │                                                │
│     ├── Lava Client ── LLM gateway (singleton)       │
│     │     │  chat() · chat_json() · chat_with_tools()│
│     │     │  Model tiers: fast/default/strong         │
│     │     │  Retry: tenacity (2 attempts)            │
│     │     │  JSON fallback: escalate to strong model │
│     │     │                                          │
│     │     └──▶ Lava API (api.lava.dev/v1)            │
│     │              └──▶ Claude (sonnet/haiku)        │
│     │                                                │
│     ├── Memory Loader ── progressive disclosure      │
│     │     │  Stage 0: match count                    │
│     │     │  Stage 1: headlines (never full paths)   │
│     │     │  Stage 2: timeline + resolution summary  │
│     │     │  Stage 3: full step-by-step path         │
│     │     │                                          │
│     │     └── Hex Client ── structured SQL queries   │
│     │              │  Falls back to mock when no key │
│     │              └──▶ Hex API (app.hex.tech)       │
│     │                                                │
│     ├── Sandbox Runner ── mocked infra simulation    │
│     │     4 scenarios: pool_resize, config_rollback  │
│     │                  pod_restart, manual            │
│     │                                                │
│     ├── Tool Executor ── mocked tool results         │
│     │     search_logs, get_deployments, get_metrics  │
│     │     get_config_diff, run_sandbox, get_hex      │
│     │                                                │
│     └── Database ── Supabase (Postgres)              │
│           │  Lazy init — runs without creds           │
│           │  9 tables defined in migrations.sql       │
│           └──▶ Supabase API                          │
│                                                      │
│  pydantic-settings ── .env config loading            │
│  httpx ── async HTTP for Lava + Hex                  │
│  tenacity ── retry logic                             │
│  websockets ── WS support                            │
└──────────────────────────────────────────────────────┘
```

---

## Data Flow: Trigger Demo → Resolution

```
User clicks "Trigger Demo" → selects "Payment API 500"
    │
    ▼
Frontend: POST /api/incidents/webhook
    { title, service, severity, description, source }
    │
    ▼
Backend: creates incident in incidents_store → returns 202
    │
    ├──▶ Frontend: navigates to /incident/{id} or opens split view
    │    React Query starts polling every 2-3s
    │    WebSocket connects for live updates
    │
    └──▶ Background: run_pipeline_mock(incident_id)
         │
         ├─ Phase 1: TRIAGE
         │   Create sub-ticket ST-xxxx (status: running)
         │   Mock triage result: P1, db_pool_exhausted, conf 0.97
         │   Update sub-ticket (status: completed)
         │   Log agent step
         │   Frontend: sub-task turns green ✓
         │
         ├─ Phase 2: ROOT CAUSE (3 sub-tasks)
         │   ST-xxxx: Scan logs → "1847 ConnectionPoolExhausted"
         │   ST-xxxx: Blast radius → "14 downstream services"
         │   ST-xxxx: Synthesis → "Deploy v2.3.1 reduced pool.max 20→5"
         │   Frontend: tasks tick running → completed one by one
         │   Confidence trajectory chart updates
         │
         ├─ Phase 3: REMEDIATION
         │   Query memory for matching playbook (PB-001)
         │   ST-xxxx: "pool_resize via PB-001, conf 0.96"
         │   Frontend: remediation task completes
         │
         ├─ Phase 4: VERIFICATION
         │   Run sandbox_runner.run_action(pool_resize)
         │   Returns: before/after state, diff, health_check: pass
         │   ST-xxxx: "Sandbox pass. 0 errors in 60s"
         │   Frontend: verification completes
         │
         └─ Phase 5: AWAITING APPROVAL
              Assemble evidence package:
              { root_cause, proposed_fix, confidence, risk,
                similar_incidents, sandbox_run, playbook }
              Frontend: Evidence Dossier appears
              │
              User clicks "Approve"
              │
              ▼
         POST /api/approvals/{id}/decide { decision: "approved" }
              │
              ├── Incident status → resolved
              ├── write_resolved_incident() → memory bank
              ├── Frontend: celebration (amber flash + banner)
              └── Tile turns green
```

---

## QueenBee Chatbot Flow

```
User opens QueenBee (clicks amber ⬡ button)
    │
    ├── On incidents page with split view open:
    │   incidentId = Zustand store → selectedIncidentId
    │
    ├── On /incident/{id} page:
    │   incidentId = URL param
    │
    └── On any other page:
        incidentId = null (general mode)

User sends message
    │
    ▼
Frontend: POST /api/chat/
    { message, incident_id, conversation_history[] }
    │
    ▼
Backend: chat endpoint
    │
    ├── Build system prompt (QueenBee personality)
    │
    ├── If incident_id provided:
    │   Inject full context into system prompt:
    │   - Incident metadata (title, service, severity, status)
    │   - All sub-ticket results + confidence scores
    │   - Recent agent logs (last 5)
    │   - Evidence package (root cause, fix, risk, similar)
    │
    ├── Try: lava_client.chat(fast model)
    │   └── Success → return LLM response
    │
    └── Catch: Lava unavailable
        └── Smart fallback from in-memory data:
            - Has incident? → full summary with agent findings
            - "approve?" → confidence + risk + recommendation
            - "root cause?" → evidence root cause
            - No incident → general help text
```

---

## File Structure

```
ops-agent/
├── package.json              ← npm run dev (starts both)
├── CLAUDE.md                 ← project brain (read every session)
│
├── docs/
│   ├── ARCHITECTURE.md       ← this file
│   ├── PROGRESS.md           ← chapter completion status
│   ├── ERRORS.md             ← bugs hit + fixes
│   ├── DECISIONS.md          ← why choices were made
│   ├── SCHEMA.md             ← database schema
│   ├── ENV.md                ← environment variables
│   ├── ROLLBACK.md           ← git checkpoints
│   └── DEMO_CHECKLIST.md     ← hackathon day guide
│
├── backend/
│   ├── .python-version       ← pins 3.11 for Render
│   ├── requirements.txt
│   ├── .env / .env.example
│   └── app/
│       ├── main.py           ← FastAPI app + CORS + WebSocket
│       ├── config.py          ← pydantic-settings
│       ├── database.py        ← Supabase client (lazy init)
│       ├── migrations.sql     ← full DB schema
│       ├── api/
│       │   ├── pipeline.py    ← agent orchestration engine
│       │   └── routes/
│       │       ├── incidents.py  ← 10 endpoints + SSE
│       │       ├── agents.py     ← 3 endpoints
│       │       ├── approvals.py  ← 3 endpoints
│       │       └── chat.py       ← QueenBee endpoint
│       ├── agents/
│       │   ├── orchestrator.py
│       │   ├── triage_agent.py
│       │   ├── root_cause_agent.py
│       │   ├── remediation_agent.py
│       │   ├── verification_agent.py
│       │   └── reviewer_summary_agent.py
│       ├── memory/
│       │   ├── hex_client.py     ← Hex API + mock fallback
│       │   ├── memory_loader.py  ← 4-stage progressive disclosure
│       │   ├── write_back.py     ← persist resolved incidents
│       │   └── seed_data.py      ← demo seed data
│       ├── sandbox/
│       │   └── sandbox_runner.py ← mocked infra simulation
│       ├── schemas/
│       │   ├── incident.py  ← 10 models
│       │   ├── agent_task.py ← 2 models
│       │   ├── approval.py  ← 3 models
│       │   ├── memory.py    ← 5 models
│       │   └── lava.py      ← 6 models
│       └── utils/
│           ├── lava_client.py    ← LLM gateway singleton
│           ├── tool_executor.py  ← mocked tool results
│           └── logger.py         ← JSON structured logging
│
└── frontend/
    ├── vercel.json           ← Vercel deployment config
    ├── index.html            ← HiveOps title + amber favicon
    ├── package.json
    ├── vite.config.ts        ← proxy + path aliases
    ├── tsconfig.app.json     ← @/ path alias
    └── src/
        ├── App.tsx            ← QueryClientProvider + routing
        ├── main.tsx
        ├── index.css          ← CSS vars + custom scrollbar
        ├── api/
        │   └── client.ts      ← axios client (env-based URL)
        ├── hooks/
        │   ├── useIncidents.ts      ← polling hooks
        │   ├── useApprovals.ts      ← approval hooks
        │   ├── useIncidentWebSocket.ts  ← WS live updates
        │   └── usePageTitle.ts      ← dynamic tab titles
        ├── store/
        │   └── incidentStore.ts ← Zustand (UI state)
        ├── mock/
        │   ├── incidents.ts    ← 3 incidents + sub-tickets
        │   ├── memory.ts       ← pattern families + playbooks
        │   └── audit.ts        ← audit entries
        ├── types/
        │   └── index.ts        ← all TypeScript types
        ├── components/
        │   ├── AppLayout.tsx    ← sidebar + main + overlays
        │   ├── ThemeProvider.tsx ← dark/light mode
        │   ├── DemoContext.tsx   ← demo phase state
        │   ├── hive/
        │   │   ├── HivePulse.tsx     ← status dot
        │   │   ├── HiveLoader.tsx    ← hexagonal loader
        │   │   ├── HiveProgress.tsx  ← dot progress bar
        │   │   ├── HivePattern.tsx   ← dot texture
        │   │   ├── HiveDivider.tsx   ← section divider
        │   │   ├── HiveHoverDots.tsx ← hover dot clusters
        │   │   └── HiveButton.tsx    ← standard button
        │   ├── incident/
        │   │   ├── SubTasksPanel.tsx
        │   │   ├── EvidenceDossier.tsx
        │   │   ├── ConfidenceTrajectory.tsx  ← SVG sparkline
        │   │   ├── IncidentTimeline.tsx      ← Slack-style log
        │   │   ├── AgentReasoningStream.tsx  ← SSE typing
        │   │   └── IncidentDetailEmbed.tsx   ← split view panel
        │   ├── chat/
        │   │   └── HiveBot.tsx       ← QueenBee chatbot
        │   ├── layout/
        │   │   ├── MobileTabBar.tsx
        │   │   └── DemoTriggerPanel.tsx  ← 7 scenarios
        │   └── shared/
        │       └── HiveOpsLogo.tsx   ← hexagon "O" wordmark
        └── pages/
            ├── IncidentsPage.tsx      ← split view
            ├── IncidentDetailPage.tsx ← full detail
            ├── MemoryBankPage.tsx
            ├── PlaybooksPage.tsx
            └── AuditLogPage.tsx
```

---

## Deployment Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ GoDaddy  │────▶│   Vercel     │────▶│   Render     │
│hiveops.us│     │  (frontend)  │     │  (backend)   │
│ CNAME    │     │  React build │     │  Python 3.11 │
│          │     │  dist/       │     │  uvicorn     │
└──────────┘     └──────┬───────┘     └──────┬───────┘
                        │                    │
                        │  VITE_API_URL      │
                        └────────────────────┘
                                             │
                        ┌────────────────────┼──────────┐
                        │                    │          │
                        ▼                    ▼          ▼
                  ┌──────────┐       ┌──────────┐ ┌─────────┐
                  │  Lava    │       │ Supabase │ │   Hex   │
                  │  API     │       │(Postgres)│ │   API   │
                  │ (Claude) │       │          │ │  (SQL)  │
                  └──────────┘       └──────────┘ └─────────┘
```

## Key Design Principles

1. **No RAG** — structured pattern matching by causal_sig + service, not semantic search
2. **Human-in-the-loop** — agents propose, humans approve, never auto-execute
3. **Progressive disclosure** — memory shows 4 stages of detail, not everything at once
4. **Graceful degradation** — frontend works with mock data when backend is down
5. **Every step logged** — full audit trail of every agent decision for compliance
6. **Memory gets smarter** — every resolved incident enriches the pattern bank

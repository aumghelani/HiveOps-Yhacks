# Progress tracker

## Legend
- [ ] not started
- [~] in progress
- [x] done and verified

## Chapters
- [x] Prompt 0 — Scaffold + dependencies
- [x] Ch 1  — Database schema + Supabase client
  - [x] migrations.sql with all tables
  - [x] get_stage1_matches() SQL function
  - [x] database.py singleton Supabase client
  - [x] All Pydantic schemas (incident, agent_task, approval, memory, lava)
- [x] Ch 2  — Lava client + agent prompts
  - [x] LavaClient singleton with chat(), chat_json(), chat_with_tools()
  - [x] Model tier routing, retry, JSON parse fallback
  - [x] Tool executor with 6 mocked tools
  - [x] All 6 agents: Orchestrator, Triage, RootCause, Remediation, Verification, ReviewerSummary
- [x] Ch 3  — Memory layer (Hex + progressive disclosure)
  - [x] HexClient with Hex API + mock fallback
  - [x] MemoryLoader 4 stages, playbook matching, write_back, seed data
- [x] Ch 4  — Sandbox + API routes
  - [x] SandboxRunner with 4 mock scenarios
  - [x] pipeline.py — full mock agent orchestration
  - [x] 17 API endpoints + WebSocket
  - [x] Full flow verified: webhook → pipeline → approval → resolved
- [x] Ch 5  — Frontend types + store + hooks
  - [x] All types defined including ApprovalDecision
  - [x] Frontend mock data layer (src/mock/)
  - [x] DemoContext with phase management
- [x] Ch 6  — Frontend UI components
  - [x] Hive dot components, ThemeProvider, HiveOps logo
  - [x] SubTasksPanel, EvidenceDossier, MobileTabBar, AppLayout
- [x] Ch 7  — Frontend pages + routing
  - [x] All 5 pages with Framer Motion, dark/light mode, mobile responsive
  - [x] Renamed to HiveOps everywhere
- [x] Ch 8  — Integration + demo seed
  - [x] Real API client (src/api/client.ts) with axios
  - [x] React Query hooks with live polling (2-5s intervals)
  - [x] WebSocket hook for live incident + sub-ticket updates
  - [x] Zustand store for UI-only state (celebration, selection)
  - [x] QueryClientProvider wired into App.tsx
  - [x] IncidentsPage: real data from useIncidents() + "Trigger Demo" button
  - [x] IncidentDetailPage: real incident, sub-tickets, evidence, agent logs from hooks
  - [x] Approval controls wired to real POST /api/approvals/{id}/decide
  - [x] Celebration animation triggers on real approval success
  - [x] AppLayout sidebar: live agent count + pending count from real hooks
  - [x] All pages gracefully fall back to mock data when backend is down
  - [x] MemoryBank/Playbooks/AuditLog keep mock data (backend routes not needed for demo)
  - [x] Demo checklist doc (docs/DEMO_CHECKLIST.md)
  - [x] npm run build passes with 0 TypeScript errors
  - [x] Full end-to-end verified: trigger → pipeline → sub-tickets → evidence → approve → resolved

## Verification gates — ALL PASSED
- Prompt 0: uvicorn starts, npm run dev starts, /health returns 200 ✓
- Ch 1: all tables in migrations.sql, pydantic models import without error ✓
- Ch 2: lava_client importable, all 6 agents importable ✓
- Ch 3: memory_loader.load_stage_1() returns 4 mock incidents ✓
- Ch 4: POST /api/incidents/webhook returns 202, pipeline runs in background ✓
- Ch 4: Full flow: webhook → 6 sub-tickets → evidence → approve → resolved ✓
- Ch 5: All types compile, mock data layer working ✓
- Ch 6: All components render without prop errors ✓
- Ch 7: All pages load, routing works, dark/light toggle works ✓
- Ch 8: Full demo flow end-to-end with real API calls ✓

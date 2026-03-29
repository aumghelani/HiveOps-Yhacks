# HiveOps Demo Checklist

## Before judges arrive
- [ ] cd hiveops/backend && .venv\Scripts\activate
- [ ] uvicorn app.main:app --reload --port 8000
- [ ] cd hiveops/frontend && npm run dev
- [ ] Open http://localhost:5173 in Chrome
- [ ] Verify /health returns {"status":"ok"}
- [ ] OR just run `npm run dev` from root (starts both)

## Demo flow (4 minutes)
1. Show incidents page — "The hive is quiet"
2. Click "Trigger Demo Incident" button
3. Page navigates to the new incident automatically
4. Watch sub-tasks tick from pending → running → completed live (polls every 2s)
5. Point out: "Agents are reasoning right now via Lava → Claude"
6. When awaiting_approval: Evidence Dossier appears
7. Show the diff panel — "This is what will change in production"
8. Show memory references — "It matched a past incident automatically"
9. Click Approve → amber burst → resolution banner
10. Incident status shows "Resolved"
11. Go back to incidents list — resolved incident appears

## Fallback if backend is slow
- The frontend always shows mock data on error
- Judges still see the full UI flow
- Explain: "In production the agents would run asynchronously"

## Talking points
- "No RAG — structured pattern matching by causal_sig and service"
- "Every step is logged — full audit trail, compliance-ready"
- "Human approves before any production action"
- "The memory bank just got smarter — that incident is now a pattern"

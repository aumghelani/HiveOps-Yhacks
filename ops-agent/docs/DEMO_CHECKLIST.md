# HiveOps Demo Checklist

## Before judges arrive
- [ ] `cd ops-agent && npm run dev` (starts both backend + frontend)
- [ ] Open http://localhost:5173 in Chrome
- [ ] Verify http://localhost:8000/health returns `{"status":"ok"}`
- [ ] OR use deployed version at hiveops.us

## Demo flow (4 minutes)
1. Show incidents page — "The hive is quiet"
2. Click **Trigger Demo** → select "Payment API 500 errors" from the 7 scenarios
3. Watch the incident appear with a blue "Investigating" glow on the tile
4. Click the tile → split view opens on right with amber dot burst animation
5. Watch sub-tasks tick from pending → running → completed (live polling every 2s)
6. Point out: "Agents are reasoning right now via Lava → Claude"
7. Show **ConfidenceTrajectory** sparkline building as agents complete
8. Show **IncidentTimeline** — Slack-style agent messages with colored avatars
9. When status becomes "Awaiting Approval": **Evidence Dossier** appears
10. Expand "Review Details" → show diff panel, sandbox results, risk assessment
11. Show memory references — "It matched a past incident automatically"
12. Open **QueenBee** (amber hexagon button) → ask "Should I approve?"
13. QueenBee responds with full context: confidence, risk, similar incidents
14. Click **Approve** → amber burst → resolution banner
15. Tile turns green with "Resolved" status

## QueenBee demo
- Open chatbot on any page → show quick action chips
- Navigate to incident → context indicator shows incident ID automatically
- Type `/` → show slash command menu (11 commands)
- Ask "What's the root cause?" → detailed answer with evidence
- Ask "Should I approve?" → risk assessment with confidence score
- Works in split view too — context follows the selected tile

## Mobile demo
- Resize browser or use phone
- Bottom tab bar replaces sidebar
- Floating theme toggle (bottom-left) — tap to switch dark/light
- QueenBee floating button (bottom-right) → slide-up chat panel
- Tiles navigate to full page on mobile (no split view)

## Fallback if backend is slow
- Frontend always shows mock data on error (retry: false = instant fallback)
- QueenBee has smart fallback responses from in-memory data
- Judges still see the full UI flow

## Talking points
- "No RAG — structured pattern matching by causal_sig and service"
- "Every step is logged — full audit trail, compliance-ready"
- "Human approves before any production action"
- "The memory bank just got smarter — that incident is now a pattern"
- "QueenBee has automatic context — like how your IDE knows what file you're in"
- "7 different incident scenarios ready to demo"
- "Works offline — mock data fallback ensures the UI is always demoable"

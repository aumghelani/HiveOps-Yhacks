# Decision log

## Why FastAPI over Django
- Need async throughout for agent polling and websockets
- Django ORM + admin adds weight we don't need at hackathon speed
- Supabase handles DB admin UI

## Why Lava as LLM gateway
- Single endpoint for all agent LLM calls + QueenBee chatbot
- Lava MCP tool call support = sponsor track integration
- One place to see all token usage and costs
- OpenAI-compatible API — easy to swap models

## Why Hex for memory
- Structured SQL matching over causal_sig + service fields
- Way more interpretable than cosine similarity over embeddings
- Hex notebook = live demo artifact (open it to judges)
- Falls back to mock data when token not set

## Why Zustand over Redux
- Far less boilerplate for a 24h hackathon
- Immer middleware handles immutable updates cleanly
- Used for UI-only state (selected incident, celebration); data fetching is React Query

## Why React Query for data fetching
- Built-in polling (refetchInterval), caching, error states
- Pairs with WebSocket — WS pushes update the query cache directly
- retry:false for instant mock fallback when backend is down

## Why mock sandbox
- Real shell execution is risky and slow to set up
- Judges care about the decision flow, not real infra
- Mocked before/after diffs look identical to real ones in the UI

## Why Gmail-style split view
- Shows incident list + detail simultaneously — no page navigation needed
- Faster browsing between incidents during demo
- Detail panel slides in with spring animation + hive dot burst
- Mobile falls back to full-page navigation (split view too cramped)

## Why QueenBee chatbot
- Context-aware assistant that reads the incident you're viewing
- Judges can ask natural language questions during demo
- Powered by Lava (same gateway as agents) with smart fallback when Lava unavailable
- Slash commands (/summary, /rootcause, /approve) for power users

## Why color-coded incident tiles
- Instant visual status without reading text
- Green=resolved, amber=awaiting, blue=investigating, red=rejected
- Left border + subtle background tint — visible without hover

## Why CSS variables over Tailwind classes for theming
- Single source of truth for light/dark mode colors
- Works with inline styles (most components use inline for colocation)
- Tailwind v4 class-based dark mode still works alongside via @custom-variant

## Why env-based API URL
- VITE_API_URL allows same frontend build to point at any backend
- Dev: empty (Vite proxy handles /api → localhost:8000)
- Prod: set to Render URL (https://hiveops-api.onrender.com)

## Why Render for backend hosting
- Free tier for hackathon
- Supports Python + uvicorn natively
- Auto-deploy from GitHub on push
- Needed .python-version pin (3.11) due to pydantic-core wheel issue on 3.14

## Why custom amber scrollbar
- Native scrollbars break the HiveOps amber aesthetic
- .hive-scrollbar class: thin 6px amber thumb, transparent track
- Applied to DemoTriggerPanel and any future scrollable panels

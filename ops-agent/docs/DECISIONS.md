# Decision log

## Why FastAPI over Django
- Need async throughout for agent polling and websockets
- Django ORM + admin adds weight we don't need at hackathon speed
- Supabase handles DB admin UI

## Why Lava as LLM gateway
- Single endpoint for all agent LLM calls
- Lava MCP tool call support = sponsor track integration
- One place to see all token usage and costs

## Why Hex for memory
- Structured SQL matching over causal_sig + service fields
- Way more interpretable than cosine similarity over embeddings
- Hex notebook = live demo artifact (open it to judges)
- Falls back to mock data when token not set

## Why Zustand over Redux
- Far less boilerplate for a 24h hackathon
- Immer middleware handles immutable updates cleanly

## Why mock sandbox
- Real shell execution is risky and slow to set up
- Judges care about the decision flow, not real infra
- Mocked before/after diffs look identical to real ones in the UI

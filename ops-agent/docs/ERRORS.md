# Error log

## Format
### [CHAPTER] Short description
- **Symptom:** what happened
- **Cause:** why it happened
- **Fix:** what solved it
- **Date:** when

## Entries

### [Ch 4] Render build failing — pydantic-core compilation error
- **Symptom:** Render deploy fails with "metadata-generation-failed" on pydantic-core
- **Cause:** Render defaulted to Python 3.14 which has no pre-built pydantic-core wheel, tries to compile from source and hits read-only filesystem
- **Fix:** Created backend/.python-version with `3.11.12` to pin Python version
- **Date:** 2026-03-29

### [Ch 8] Supabase client crash on empty credentials
- **Symptom:** Backend fails to start on Render when SUPABASE_URL/KEY not set
- **Cause:** database.py called create_client() at import time with empty strings
- **Fix:** Made database.py lazy-init — skips Supabase when creds empty, runs in demo mode
- **Date:** 2026-03-29

### [Ch 8] Frontend stuck on "Loading incidents..." on Vercel
- **Symptom:** Deployed frontend shows infinite HiveLoader spinner
- **Cause:** React Query retry:1 meant 2 attempts with delay before falling back to mock data; backend was unreachable
- **Fix:** Set retry: false on all hooks so they fail fast and show mock data immediately
- **Date:** 2026-03-29

### [Post-Ch8] QueenBee not detecting incident in split view
- **Symptom:** Chatbot shows generic response when incident is open in split view panel
- **Cause:** QueenBee only checked URL (/incident/:id) but split view doesn't change URL
- **Fix:** QueenBee now checks Zustand store's selectedIncidentId as fallback after URL
- **Date:** 2026-03-29

### [Post-Ch8] QueenBee fallback not matching user queries
- **Symptom:** "Tell me more about this incident" returned generic "navigate to one" message
- **Cause:** Fallback keyword matching didn't cover "tell", "more", "about" etc.
- **Fix:** When incident_id is present, fallback always returns full incident summary as default
- **Date:** 2026-03-29

### [Post-Ch8] QueenBee mobile input hidden behind nav bar
- **Symptom:** Chat input field overlapped by bottom navigation on mobile
- **Cause:** Panel used bottom:0 which sits behind the 60px mobile nav bar
- **Fix:** Used visualViewport API for dynamic height + safe-area-inset-bottom padding
- **Date:** 2026-03-29

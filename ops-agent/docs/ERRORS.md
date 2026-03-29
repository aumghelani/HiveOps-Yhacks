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
- **Fix:** CSS sets .queenbee-panel bottom:60px on mobile; removed visualViewport approach in favor of fixed CSS
- **Date:** 2026-03-29

### [Post-Ch8] Sidebar stretching with page content on Audit Log
- **Symptom:** Sidebar grows longer than viewport when scrolling long audit log page
- **Cause:** Sidebar had no fixed height constraint, grew with flex container
- **Fix:** Set sidebar to height:100vh + overflow:hidden; only <main> scrolls
- **Date:** 2026-03-29

### [Post-Ch8] Mobile theme toggle overlapping nav bar
- **Symptom:** Dark/light toggle button hidden behind bottom navigation on mobile
- **Cause:** Toggle was inside the sidebar which is hidden on mobile
- **Fix:** Added separate floating theme toggle button (bottom-left, above nav) visible only on mobile
- **Date:** 2026-03-29

### [Post-Ch8] DemoTriggerPanel showing double scrollbars
- **Symptom:** Two scrollbar tracks visible inside the demo scenario dropdown
- **Cause:** Outer container had overflow:hidden and inner div had overflowY:auto, both creating scroll contexts
- **Fix:** Removed overflow:hidden from outer, single .hive-scrollbar class on inner with custom amber styling
- **Date:** 2026-03-29

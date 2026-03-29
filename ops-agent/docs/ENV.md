# Environment variables

## Backend (.env)
| Variable           | Required | Description                        | Example value                    |
|--------------------|----------|------------------------------------|----------------------------------|
| SUPABASE_URL       | no*      | Supabase project URL               | https://xxx.supabase.co          |
| SUPABASE_KEY       | no*      | Supabase anon/service key          | eyJhbGci...                      |
| LAVA_API_KEY       | no*      | Lava gateway API key               | lava-...                         |
| LAVA_BASE_URL      | yes      | Lava base URL                      | https://api.lava.dev/v1          |
| LAVA_DEFAULT_MODEL | yes      | Default model for agents           | claude-sonnet-4-20250514         |
| LAVA_FAST_MODEL    | yes      | Fast model for triage + chat       | claude-haiku-4-5-20251001        |
| LAVA_STRONG_MODEL  | yes      | Strong model for escalated RCA     | claude-sonnet-4-20250514         |
| HEX_API_TOKEN      | no       | Hex project API token (fallback ok)| hex-...                          |
| HEX_PROJECT_ID     | no       | Hex project ID                     | abc-123                          |
| HEX_BASE_URL       | no       | Hex API base URL                   | https://app.hex.tech/api/v1      |
| CLAUDE_MODEL       | yes      | Model string for all LLM calls     | claude-sonnet-4-20250514         |
| ENVIRONMENT        | yes      | development or production          | development                      |
| FRONTEND_URL       | no       | Production frontend URL for CORS   | https://hiveops.us               |

*Backend runs in demo mode (in-memory, mock data) when Supabase/Lava creds are empty.

## Frontend (.env)
| Variable            | Required | Description                 | Example value                        |
|---------------------|----------|-----------------------------|--------------------------------------|
| VITE_API_URL        | no*      | Backend URL for production  | https://hiveops-api.onrender.com     |

*When empty, Vite dev proxy routes /api to localhost:8000. Set for production deploys.

## Deployment platforms

### Vercel (frontend)
| Variable       | Value                                |
|----------------|--------------------------------------|
| VITE_API_URL   | https://hiveops-api.onrender.com     |

### Render (backend)
| Variable           | Value                           |
|--------------------|---------------------------------|
| SUPABASE_URL       | (from Supabase dashboard)       |
| SUPABASE_KEY       | (from Supabase dashboard)       |
| LAVA_API_KEY       | (from Lava dashboard)           |
| LAVA_BASE_URL      | https://api.lava.dev/v1         |
| ENVIRONMENT        | production                      |

## Notes
- Never commit real values — .env is in .gitignore
- If HEX_API_TOKEN is empty, memory layer auto-falls back to mock data
- If SUPABASE_URL is empty, backend runs in demo mode (in-memory stores)
- If LAVA_API_KEY is empty, QueenBee uses smart fallback responses from in-memory data
- LAVA_BASE_URL must end without trailing slash
- Backend .python-version pins Python 3.11 for Render compatibility

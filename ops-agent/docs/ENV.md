# Environment variables

## Backend (.env)
| Variable         | Required | Description                        | Example value                    |
|------------------|----------|------------------------------------|----------------------------------|
| SUPABASE_URL     | yes      | Supabase project URL               | https://xxx.supabase.co          |
| SUPABASE_KEY     | yes      | Supabase anon/service key          | eyJhbGci...                      |
| LAVA_API_KEY     | yes      | Lava gateway API key               | lava-...                         |
| LAVA_BASE_URL    | yes      | Lava base URL                      | https://api.lava.dev/v1          |
| HEX_API_TOKEN    | no       | Hex project API token (fallback ok)| hex-...                          |
| HEX_PROJECT_ID   | no       | Hex project ID                     | abc-123                          |
| CLAUDE_MODEL     | yes      | Model string for all LLM calls     | claude-sonnet-4-20250514         |
| ENVIRONMENT      | yes      | development or production          | development                      |

## Frontend (.env)
| Variable            | Required | Description           | Example value           |
|---------------------|----------|-----------------------|-------------------------|
| VITE_API_BASE_URL   | yes      | Backend URL           | http://localhost:8000   |

## Notes
- Never commit real values — .env is in .gitignore
- If HEX_API_TOKEN is empty, memory layer auto-falls back to mock data
- LAVA_BASE_URL must end without trailing slash

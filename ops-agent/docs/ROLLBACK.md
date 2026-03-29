# Rollback log

## How to use
After each chapter is verified, run:
  git add -A && git commit -m "checkpoint: chapter N complete"

If something breaks badly, run:
  git log --oneline   # find the checkpoint hash
  git checkout <hash> -- path/to/file   # restore specific file
  # or full rollback:
  git reset --hard <hash>

## Checkpoints
- Prompt 0 scaffold complete
- Ch 1-3 backend foundation complete
- Ch 4 routes + pipeline complete
- Ch 5-7 frontend complete
- Ch 8 integration complete
- Post-Ch8 polish: QueenBee, split view, deployment, mobile fixes

## Dangerous operations
- Never delete migrations.sql — append only
- Never rename Pydantic model fields without updating all routes that use them
- Never change the Supabase table names — foreign keys will break
- Never commit .env files with real API keys
- The in-memory stores reset on backend restart — this is by design for demo mode

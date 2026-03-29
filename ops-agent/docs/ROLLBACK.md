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
(fill as chapters complete)

## Dangerous operations
- Never delete migrations.sql — append only
- Never rename Pydantic model fields without updating all routes that use them
- Never change the Supabase table names — foreign keys will break

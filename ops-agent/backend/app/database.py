from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("database")

# Lazy init — don't crash if Supabase creds aren't set (demo mode works without DB)
supabase = None

if settings.supabase_url and settings.supabase_key:
    try:
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        logger.info("supabase client initialized")
    except Exception as e:
        logger.warning(f"supabase init failed: {e} — running in demo mode")
else:
    logger.info("supabase not configured — running in demo mode (in-memory only)")

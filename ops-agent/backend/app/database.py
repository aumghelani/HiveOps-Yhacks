from supabase import create_client, Client
from app.config import settings

# Singleton Supabase client — import this everywhere, never re-create
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

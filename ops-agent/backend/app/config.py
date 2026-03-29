from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Lava gateway — all LLM calls route through here
    lava_api_key: str = ""
    lava_base_url: str = "https://api.lava.dev/v1"
    lava_default_model: str = "claude-sonnet-4-20250514"
    lava_fast_model: str = "claude-haiku-4-5-20251001"
    lava_strong_model: str = "claude-sonnet-4-20250514"

    # Hex memory layer — falls back to mock if empty
    hex_api_token: str = ""
    hex_project_id: str = ""
    hex_base_url: str = "https://app.hex.tech/api/v1"

    # General
    claude_model: str = "claude-sonnet-4-20250514"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

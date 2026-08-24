"""
Application configuration using pydantic-settings.
Loads settings from environment variables and .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings — extended in Phase 2 with database configuration.

    Phase roadmap:
      Phase 1 — APP_NAME, APP_ENV, DEBUG, API_V1_PREFIX
      Phase 2 — DATABASE_URL                          ← current
      Phase 3 — JWT_SECRET, ACCESS_TOKEN_EXPIRE_MINUTES
      Phase 4 — SMTP_* (Gmail OTP)
      Phase 5 — AI API keys
    """

    # ------------------------------------------------------------------ #
    # Application                                                          #
    # ------------------------------------------------------------------ #
    APP_NAME: str = "DefectMind"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    # ------------------------------------------------------------------ #
    # Database (Phase 2)                                                   #
    # Format: postgresql+asyncpg://user:password@host:port/dbname         #
    # ------------------------------------------------------------------ #
    DATABASE_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Single shared settings instance for the entire application
settings = Settings()

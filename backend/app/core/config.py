"""
Application configuration using pydantic-settings.
Loads settings from environment variables and .env file.
All secrets (JWT key, SMTP password, DB password) live ONLY in backend/.env
which is git-ignored.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings.

    Phase roadmap:
      Phase 1 — APP_NAME, APP_ENV, DEBUG, API_V1_PREFIX
      Phase 2 — DATABASE_URL
      Phase 3 — JWT_*, OTP_*, SMTP_*          ← current
      Phase 4 — AI API keys
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
    # Format: postgresql+psycopg://user:password@host:port/dbname         #
    # ------------------------------------------------------------------ #
    DATABASE_URL: str = ""

    # ------------------------------------------------------------------ #
    # JWT (Phase 3)                                                        #
    # ------------------------------------------------------------------ #
    JWT_SECRET_KEY: str = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ------------------------------------------------------------------ #
    # OTP (Phase 3)                                                        #
    # ------------------------------------------------------------------ #
    OTP_EXPIRE_MINUTES: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_ATTEMPTS: int = 5

    # ------------------------------------------------------------------ #
    # SMTP / Email (Phase 3)                                               #
    # ------------------------------------------------------------------ #
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "DefectMind"
    SMTP_USE_TLS: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Single shared settings instance for the entire application
settings = Settings()


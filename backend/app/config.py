import os
from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
os.makedirs(str(UPLOAD_DIR), exist_ok=True)


class Settings(BaseSettings):
    APP_NAME: str = "CuraWeave"

    @property
    def resolved_db_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("sqlite") and "/./" in url:
            relative = url.split("/./", 1)[1]
            absolute = str(BASE_DIR / relative)
            scheme_part = url.split("://", 1)[0]
            return f"{scheme_part}:////{absolute.lstrip('/')}"
        return url
    APP_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/clinic_saas"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/clinic_saas"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-me-in-production-minimum-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    ENABLE_FALLBACK_PARSER: bool = True

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    TWILIO_SMS_FROM: str = ""

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    RESEND_API_KEY: str = ""

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    SENTRY_DSN: str = ""

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    ENFORCE_HTTPS: bool = False

    MIN_PASSWORD_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPER: bool = True
    PASSWORD_REQUIRE_LOWER: bool = True
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True

    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 48
    RESET_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"


settings = Settings()

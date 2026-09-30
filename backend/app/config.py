from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./ai_quiz.db"
    OPENAI_API_KEY: Optional[str] = None
    SECRET_KEY: str = "super-secret-key-ai-quiz-maker-jwt-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    MAX_PDF_SIZE_MB: int = 20
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

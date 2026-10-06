import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings."""

    # Server settings
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    DEBUG: bool = True
    APP_NAME: str = "DocuExtract AI"
    API_V1_PREFIX: str = "/api"

    # CORS settings
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # File Upload limits
    MAX_FILE_SIZE_MB: int = 25

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    # Firebase Admin Configuration
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None

    # Google Cloud Document AI Configuration
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    DOCUMENT_AI_LOCATION: str = "us"
    DOCUMENT_AI_PROCESSOR_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

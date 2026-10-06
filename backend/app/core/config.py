import os
from typing import List

class Settings:
    PROJECT_NAME: str = "FOOD x DRUG MOLECULAR INTELLIGENCE"
    VERSION: str = "2.4.0-scientific"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "molecular-intelligence-secret-key-super-secure-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL: defaults to SQLite for zero-config local run, supports PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./food_drug_intelligence.db")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Model settings
    MODEL_ENVIRONMENT: str = "DEMO MODEL (RDKit + XGBoost Hybrid Pipeline)"
    MODEL_VERSION: str = "v2.4.1-rc"

settings = Settings()

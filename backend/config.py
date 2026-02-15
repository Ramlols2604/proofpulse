"""Configuration management using Pydantic settings."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # External API Keys
    TWELVELABS_API_KEY: str
    BACKBOARD_API_KEY: str
    GEMINI_API_KEY: str
    BACKBOARD_BASE_URL: str = "https://api.backboard.io"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Feature Flags
    GEMINI_ENABLED: bool = True
    
    # Debug Settings
    DEBUG_JOB_ID: str = ""
    
    # Valkey/Redis Configuration
    VALKEY_URL: str = "redis://localhost:6379"
    VALKEY_TTL: int = 3600  # 1 hour TTL for cached data
    
    # Application Settings
    MAX_VIDEO_DURATION: int = 120  # seconds
    MAX_CLAIMS: int = 5
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()

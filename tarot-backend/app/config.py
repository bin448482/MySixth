"""
Configuration management for the Tarot Backend API.
"""
import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings
except ImportError:
    # 兼容旧版本的 pydantic
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application settings
    APP_NAME: str = "Tarot Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database configuration
    DATABASE_URL: str = "sqlite:///./backend_tarot.db"

    # LLM configuration (参考 ../tarot-ai-generator/.env)
    API_PROVIDER: str = "zhipu"  # zhipu 或 openai
    ZHIPUAI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None
    MODEL_NAME: str = "glm-4-flash"
    TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 1000

    # API 调用限制
    RATE_LIMIT_PER_MINUTE: int = 60
    BATCH_SIZE: int = 10

    # JWT configuration
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24 * 7  # 7天

    # CORS settings
    CORS_ORIGINS: list[str] = ["*"]  # 开发环境允许所有来源
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]

    # Static files
    STATIC_DIR: str = "static"
    CARDS_IMAGE_PATH: str = "static/images"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings
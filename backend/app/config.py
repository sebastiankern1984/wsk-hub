from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_VERSION: str = "0.1.0"
    APP_NAME: str = "WSK Hub"

    # PostgreSQL — SQLAlchemy (async)
    DATABASE_URL: str = "postgresql+asyncpg://wskhub:wskhub@db:5432/wskhub"
    # Sync URL for Alembic migrations
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://wskhub:wskhub@db:5432/wskhub"

    # asyncpg pool (for future batch imports)
    IMPORT_DB_HOST: str = "db"
    IMPORT_DB_PORT: int = 5432
    IMPORT_DB_USER: str = "wskhub"
    IMPORT_DB_PASSWORD: str = "wskhub"
    IMPORT_DB_NAME: str = "wskhub"
    IMPORT_DB_POOL_MIN: int = 5
    IMPORT_DB_POOL_MAX: int = 20

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3096", "http://localhost:5173"]

    # Auth — LDAP + JWT
    LDAP_URL: str = "ldap://10.55.88.21"
    LDAP_DOMAIN: str = "ad.wsk-medical.de"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 8

    # Upload
    UPLOAD_DIR: str = "/tmp/uploads"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

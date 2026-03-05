from __future__ import annotations

import asyncio
import logging

import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

# === SQLAlchemy async engine + session ===

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency: yield an async session with auto commit/rollback."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# === asyncpg pool for high-performance batch operations ===

_import_pool: asyncpg.Pool | None = None


async def get_import_pool() -> asyncpg.Pool:
    global _import_pool
    if _import_pool is None:
        raise RuntimeError("Import pool not initialized.")
    return _import_pool


async def init_import_pool() -> None:
    global _import_pool
    for attempt in range(5):
        try:
            _import_pool = await asyncpg.create_pool(
                host=settings.IMPORT_DB_HOST,
                port=settings.IMPORT_DB_PORT,
                user=settings.IMPORT_DB_USER,
                password=settings.IMPORT_DB_PASSWORD,
                database=settings.IMPORT_DB_NAME,
                min_size=settings.IMPORT_DB_POOL_MIN,
                max_size=settings.IMPORT_DB_POOL_MAX,
            )
            logger.info("asyncpg import pool initialized")
            return
        except Exception as e:
            if attempt < 4:
                wait = 2**attempt
                logger.warning(f"Import pool init attempt {attempt + 1} failed: {e}, retrying in {wait}s")
                await asyncio.sleep(wait)
            else:
                raise


async def close_import_pool() -> None:
    global _import_pool
    if _import_pool:
        await _import_pool.close()
        _import_pool = None
        logger.info("asyncpg import pool closed")


# === DB init ===

async def init_db() -> None:
    """Create extensions and all tables on startup."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")
    await init_import_pool()

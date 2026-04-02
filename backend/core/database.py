"""Database module for async PostgreSQL connection.

Provides async engine, session factory, and database initialization.
"""

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import get_settings
from core.models import Base

# Global engine and session factory (lazy initialized)
_async_engine: AsyncEngine | None = None
_async_session: async_sessionmaker[AsyncSession] | None = None


def get_async_engine() -> AsyncEngine:
    """Get or create the async database engine."""
    global _async_engine
    if _async_engine is None:
        settings = get_settings()
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Creating DB engine for: {settings.DATABASE_URL[:60]}...")
        
        kwargs = {"echo": False}
        # Pool settings only for PostgreSQL, not SQLite
        if "sqlite" not in settings.DATABASE_URL:
            kwargs["pool_pre_ping"] = True
            kwargs["pool_size"] = 5
            kwargs["max_overflow"] = 10
        
        _async_engine = create_async_engine(settings.DATABASE_URL, **kwargs)
    return _async_engine


def get_async_session() -> async_sessionmaker[AsyncSession]:
    """Get or create the async session factory.

    Returns:
        async_sessionmaker for creating AsyncSession instances.
    """
    global _async_session
    if _async_session is None:
        engine = get_async_engine()
        _async_session = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session


async def init_db(drop_existing: bool = False) -> None:
    """Initialize the database by creating all tables.

    Args:
        drop_existing: If True, drops all tables first (use for schema changes).
    """
    engine = get_async_engine()
    async with engine.begin() as conn:
        if drop_existing:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close the database connection and dispose of the engine."""
    global _async_engine, _async_session
    if _async_engine is not None:
        await _async_engine.dispose()
        _async_engine = None
        _async_session = None

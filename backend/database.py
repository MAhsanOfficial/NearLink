import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

from sqlalchemy.pool import NullPool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "") or "sqlite+aiosqlite:///./nearlink_dev.db"
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

IS_SQLITE = DATABASE_URL.startswith("sqlite")
# In serverless environments (like Vercel), pooling can cause "connection closed" errors.
# We use NullPool to ensure a fresh connection for every request if running on Vercel.
IS_VERCEL = os.getenv("VERCEL") == "1"

if IS_SQLITE:
    # Local development / tests: no pooling or asyncpg options apply.
    engine = create_async_engine(DATABASE_URL, echo=False)
else:
    # For Neon and other cloud PostgreSQL, SSL is required
    connect_args = {"command_timeout": 30}
    if "neon.tech" in DATABASE_URL or "aws" in DATABASE_URL:
        connect_args["ssl"] = "require"

    # Neon pooler (PgBouncer) does not support prepared statements well in transaction mode.
    # If using the pooler URL, we must disable the prepared statement cache.
    if "-pooler" in DATABASE_URL:
        connect_args["prepared_statement_cache_size"] = 0

    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        poolclass=NullPool if IS_VERCEL else None,
        pool_size=5 if not IS_VERCEL else None,
        max_overflow=10 if not IS_VERCEL else None,
        pool_pre_ping=True if not IS_VERCEL else False,
        pool_recycle=300,
        connect_args=connect_args
    )
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

from sqlalchemy.pool import NullPool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# For Neon and other cloud PostgreSQL, SSL is required
connect_args = {"command_timeout": 30}
if "neon.tech" in DATABASE_URL or "aws" in DATABASE_URL:
    connect_args["ssl"] = "require"

# In serverless environments (like Vercel), pooling can cause "connection closed" errors.
# We use NullPool to ensure a fresh connection for every request if running on Vercel.
IS_VERCEL = os.getenv("VERCEL") == "1"

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

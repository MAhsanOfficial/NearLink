from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, init_db
import time
import os

router = APIRouter(prefix="/api/health", tags=["health"])

# Track if DB has been initialized (for serverless cold starts)
_db_initialized = False

@router.get("")
@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Check the health of the API and its dependencies.
    """
    global _db_initialized
    start_time = time.time()
    
    # Initialize database tables on first request in serverless mode
    if os.getenv("VERCEL") == "1" and not _db_initialized:
        try:
            await init_db()
            _db_initialized = True
            print("✅ Database tables initialized on first request")
        except Exception as e:
            print(f"⚠️ Database init attempt: {e} (tables may already exist)")
            _db_initialized = True  # Don't retry every time
    
    db_status = "unhealthy"
    try:
        # Perform a simple query to check database connectivity
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        print(f"Health check database error: {e}")
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": time.time(),
        "latency_ms": round((time.time() - start_time) * 1000, 2)
    }

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
import time

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Check the health of the API and its dependencies.
    """
    start_time = time.time()
    
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

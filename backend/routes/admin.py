"""
Admin Dashboard Endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models import Provider, Booking, User

router = APIRouter(prefix="/api/management", tags=["admin"])


@router.get("/system-metrics")
async def get_system_metrics(db: AsyncSession = Depends(get_db)):
    """Get system statistics for admin dashboard"""
    
    # Count providers
    providers_result = await db.execute(select(func.count(Provider.id)))
    total_providers = providers_result.scalar() or 0
    
    verified_result = await db.execute(
        select(func.count(Provider.id)).where(Provider.verified == True)
    )
    verified_providers = verified_result.scalar() or 0
    
    # Count bookings
    bookings_result = await db.execute(select(func.count(Booking.id)))
    total_bookings = bookings_result.scalar() or 0
    
    return {
        "commissions": {
            "total": 0,
            "pending": 0,
            "paid": 0
        },
        "bookings": {
            "total": total_bookings,
            "completion_rate": 0
        },
        "providers": {
            "total": total_providers,
            "verified": verified_providers
        }
    }


@router.get("/emergency-reports")
async def get_emergency_reports():
    """Get SOS alarms - placeholder for now"""
    return []


@router.post("/resolve-emergency/{alarm_id}")
async def resolve_emergency(alarm_id: str):
    """Resolve an emergency alarm - placeholder"""
    return {"status": "resolved", "alarm_id": alarm_id}

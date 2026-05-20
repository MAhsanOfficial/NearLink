from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from database import get_db
from models import Booking, Provider, User
from schemas import BookingOut
from routes.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

async def check_admin(current_user: User = Depends(get_current_user)):
    # Strict admin check
    if current_user.user_type != "admin":
         raise HTTPException(
             status_code=403, 
             detail="Access denied. Administrator privileges required."
         )
    return current_user

@router.get("/stats")
async def get_system_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(check_admin)):
    """Get full system commission stats and overview"""
    
    # Commission Stats
    comm_result = await db.execute(select(func.sum(Booking.commission_amount)))
    total_commission = comm_result.scalar() or 0.0
    
    paid_result = await db.execute(select(func.sum(Booking.commission_amount)).filter(Booking.is_paid == True))
    paid_commission = paid_result.scalar() or 0.0
    
    pending_commission = total_commission - paid_commission
    
    # Booking Stats
    bookings_result = await db.execute(select(func.count(Booking.id)))
    total_bookings = bookings_result.scalar() or 0
    
    completed_result = await db.execute(select(func.count(Booking.id)).filter(Booking.status == "completed"))
    completed_bookings = completed_result.scalar() or 0
    
    # Provider Stats
    prov_result = await db.execute(select(func.count(Provider.id)))
    total_providers = prov_result.scalar() or 0
    
    ver_result = await db.execute(select(func.count(Provider.id)).filter(Provider.verified == True))
    verified_providers = ver_result.scalar() or 0
    
    # User Stats
    user_result = await db.execute(select(func.count(User.id)).filter(User.user_type == "customer"))
    total_users = user_result.scalar() or 0
    
    return {
        "commissions": {
            "total": round(total_commission, 2),
            "paid": round(paid_commission, 2),
            "pending": round(pending_commission, 2)
        },
        "bookings": {
            "total": total_bookings,
            "completed": completed_bookings,
            "completion_rate": round((completed_bookings / total_bookings * 100), 1) if total_bookings > 0 else 0
        },
        "providers": {
            "total": total_providers,
            "verified": verified_providers
        },
        "users": {
            "total": total_users
        }
    }

@router.get("/sos-alarms", response_model=List[BookingOut])
async def get_sos_alarms(db: AsyncSession = Depends(get_db), admin: User = Depends(check_admin)):
    """Get all bookings where safety alert was triggered"""
    result = await db.execute(
        select(Booking)
        .filter(Booking.safety_alert_triggered == True)
        .order_by(Booking.created_at.desc())
    )
    alarms = result.scalars().all()
    
    # Add provider name to each alarm
    alarm_list = []
    for alarm in alarms:
        # Create a copy or object to add extra fields
        p_result = await db.execute(select(Provider).filter(Provider.id == alarm.provider_id))
        provider = p_result.scalar_one_or_none()
        
        alarm_out = {
            "id": alarm.id,
            "request_id": alarm.request_id,
            "provider_id": alarm.provider_id,
            "provider_name": provider.name if provider else "Unknown",
            "service_type": provider.service_type if provider else "Unknown",
            "status": alarm.status,
            "scheduled_time": alarm.scheduled_time,
            "notes": alarm.notes,
            "price": alarm.price,
            "final_price": alarm.final_price,
            "commission_amount": alarm.commission_amount,
            "is_paid": alarm.is_paid,
            "is_rated": getattr(alarm, "is_rated", False),
            "safety_alert_triggered": alarm.safety_alert_triggered,
            "created_at": str(alarm.created_at) if alarm.created_at else None
        }
        alarm_list.append(alarm_out)
            
    return alarm_list

@router.post("/resolve-sos/{booking_id}")
async def resolve_sos(booking_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(check_admin)):
    """Mark an SOS alarm as resolved"""
    result = await db.execute(select(Booking).filter(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.safety_alert_triggered = False
    await db.commit()
    return {"status": "success", "message": "SOS alarm resolved"}

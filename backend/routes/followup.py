import os

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app_agents.followup_agent import fast_forward, process_due_notifications
from database import get_db
from models import Booking, Notification, User
from routes.auth import get_current_user

router = APIRouter(prefix="/api/followup", tags=["followup"])


@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()

    return [
        {
            "id": n.id,
            "booking_id": n.booking_id,
            "type": n.type,
            "message": n.message,
            "scheduled_for": str(n.scheduled_for) if n.scheduled_for else None,
            "sent": n.sent,
            "created_at": str(n.created_at) if n.created_at else None
        }
        for n in notifications
    ]


@router.get("/booking/{booking_id}")
async def get_booking_notifications(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.booking_id == booking_id)
        .order_by(Notification.scheduled_for.asc())
    )
    notifications = result.scalars().all()

    return [
        {
            "id": n.id,
            "booking_id": n.booking_id,
            "type": n.type,
            "message": n.message,
            "scheduled_for": str(n.scheduled_for) if n.scheduled_for else None,
            "sent": n.sent,
            "created_at": str(n.created_at) if n.created_at else None
        }
        for n in notifications
    ]


@router.post("/tick")
async def tick(x_cron_secret: str = Header(None), db: AsyncSession = Depends(get_db)):
    """Deliver every due notification. Called by the in-process scheduler locally and by an external cron on serverless."""
    secret = os.getenv("CRON_SECRET")
    if secret and x_cron_secret != secret:
        raise HTTPException(status_code=403, detail="Invalid cron secret")
    delivered = await process_due_notifications(db)
    return {"delivered": len(delivered), "notifications": delivered}


@router.post("/fast-forward/{booking_id}")
async def fast_forward_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Demo helper: pretend time has passed so all pending reminders/check-ins of a booking fire now."""
    booking = (await db.execute(select(Booking).where(Booking.id == booking_id))).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not your booking")
    delivered = await fast_forward(db, booking_id)
    return {"delivered": len(delivered), "notifications": delivered}

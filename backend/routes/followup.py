from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Notification
from routes.auth import get_current_user
from models import Notification, User

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

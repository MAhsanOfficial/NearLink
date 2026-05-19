from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Notification
from routes.auth import verify_token

router = APIRouter(prefix="/api/followup", tags=["followup"])


@router.get("/notifications")
async def get_notifications(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    user_id = user["sub"]

    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
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
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    verify_token(token)

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

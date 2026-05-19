import json
import time
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from models import Booking, Notification


async def create_booking(
    db: AsyncSession,
    request_id: str,
    user_id: str,
    provider_id: str,
    provider_name: str,
    service_type: str,
    scheduled_time: str,
    notes: str = "",
    price: str = ""
) -> dict:
    """Create a booking and schedule follow-up notifications."""
    start = time.time()

    # Create the booking
    booking_id = str(uuid.uuid4())
    booking = Booking(
        id=booking_id,
        request_id=request_id,
        user_id=user_id,
        provider_id=provider_id,
        status="confirmed",
        scheduled_time=scheduled_time,
        notes=notes,
        price=price,
        created_at=datetime.utcnow()
    )
    db.add(booking)

    # Schedule notifications
    now = datetime.utcnow()
    notifications = []

    # 1. Booking confirmation (immediate)
    notif_confirm = Notification(
        id=str(uuid.uuid4()),
        booking_id=booking_id,
        user_id=user_id,
        type="booking_confirmed",
        message=f"✅ Booking confirmed! {provider_name} ({service_type}) has been assigned. Scheduled: {scheduled_time}",
        scheduled_for=now,
        sent=True,
        created_at=now
    )
    db.add(notif_confirm)
    notifications.append({
        "type": "booking_confirmed",
        "message": notif_confirm.message,
        "sent": True
    })

    # 2. Provider assignment notification
    notif_assign = Notification(
        id=str(uuid.uuid4()),
        booking_id=booking_id,
        user_id=user_id,
        type="provider_assigned",
        message=f"🔧 {provider_name} has accepted your request and is preparing for the job.",
        scheduled_for=now + timedelta(minutes=5),
        sent=False,
        created_at=now
    )
    db.add(notif_assign)
    notifications.append({
        "type": "provider_assigned",
        "message": notif_assign.message,
        "sent": False,
        "scheduled_for": str(notif_assign.scheduled_for)
    })

    # 3. Completion confirmation
    notif_complete = Notification(
        id=str(uuid.uuid4()),
        booking_id=booking_id,
        user_id=user_id,
        type="completion",
        message=f"🎉 {service_type} job completed by {provider_name}. Please rate your experience!",
        scheduled_for=now + timedelta(hours=3),
        sent=False,
        created_at=now
    )
    db.add(notif_complete)
    notifications.append({
        "type": "completion",
        "message": notif_complete.message,
        "sent": False,
        "scheduled_for": str(notif_complete.scheduled_for)
    })

    await db.commit()
    duration_ms = int((time.time() - start) * 1000)

    return {
        "booking": {
            "id": booking_id,
            "request_id": request_id,
            "provider_id": provider_id,
            "provider_name": provider_name,
            "service_type": service_type,
            "status": "confirmed",
            "scheduled_time": scheduled_time,
            "notes": notes,
            "price": price
        },
        "notifications": notifications,
        "duration_ms": duration_ms
    }

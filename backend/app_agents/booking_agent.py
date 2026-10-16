import time
import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Booking, Notification, Provider, ExternalProvider
from .messages import msg
from .slots import book_slot
from .time_resolver import fmt_local


async def ensure_registered_provider(db: AsyncSession, provider_id: str, snapshot: Optional[dict] = None) -> Optional[Provider]:
    """Return the Provider row for an id, creating a proxy row for an external business if needed.

    Bookings have a foreign key to providers, so a Google/OSM business must exist as a Provider
    before it can be booked. `snapshot` is the search-result dict (used when the business was
    never cached in external_providers).
    """
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if provider:
        return provider

    ext = (await db.execute(select(ExternalProvider).where(ExternalProvider.id == provider_id))).scalar_one_or_none()
    if not ext:
        ext = (await db.execute(select(ExternalProvider).where(ExternalProvider.osm_id == provider_id))).scalar_one_or_none()

    src = None
    if ext:
        src = {
            "id": ext.id, "name": ext.name, "service_type": ext.service_type, "area": ext.area,
            "address": ext.address, "latitude": ext.latitude, "longitude": ext.longitude,
            "phone": ext.phone, "source": ext.source, "trust_score": ext.trust_score,
            "working_hours": ext.opening_hours,
        }
    elif snapshot:
        src = {**snapshot, "id": provider_id}
    if not src:
        return None

    working_hours = src.get("working_hours")
    provider = Provider(
        id=src["id"],
        name=src["name"],
        service_type=src.get("service_type") or "General Service",
        area=src.get("area") or "Karachi",
        address=src.get("address"),
        latitude=src.get("latitude"),
        longitude=src.get("longitude"),
        phone=src.get("phone") or "Not Available",
        description=f"Public business imported from {(src.get('source') or 'OSM').upper()}.",
        price_range="Medium",
        rating=src.get("rating") or round((src.get("trust_score") or 0.7) * 5.0, 1),
        total_reviews=src.get("total_reviews") or 5,
        availability=True,
        working_hours=working_hours if isinstance(working_hours, str) else None,
        verified=True,
        created_at=datetime.utcnow(),
    )
    db.add(provider)
    await db.flush()
    return provider


async def create_booking(
    db: AsyncSession,
    request_id: str,
    user_id: str,
    provider_id: str,
    provider_name: str,
    service_type: str,
    scheduled_time: str = "",
    notes: str = "",
    price: str = "",
    scheduled_at: Optional[datetime] = None,
    language: str = "english",
    now: Optional[datetime] = None,
) -> dict:
    """Create a booking, reserve the slot (when `scheduled_at` is given) and schedule follow-ups.

    Raises SlotConflict if the hour was taken in the meantime; nothing is persisted in that case.
    """
    start = time.time()
    now = now or datetime.utcnow()
    booking_id = str(uuid.uuid4())

    if scheduled_at and not scheduled_time:
        scheduled_time = fmt_local(scheduled_at)

    # Savepoint: a slot conflict undoes only this booking, not the caller's other pending work
    async with db.begin_nested():
        booking = Booking(
            id=booking_id, request_id=request_id, user_id=user_id, provider_id=provider_id,
            status="confirmed", scheduled_time=scheduled_time, notes=notes, price=price, created_at=now,
        )
        db.add(booking)
        await db.flush()
        if scheduled_at:
            await book_slot(db, provider_id, scheduled_at, booking_id)

        fmt = dict(provider=provider_name, service=service_type, when=scheduled_time)
        plan = [
            ("booking_confirmed", now, True),
            ("provider_assigned", now + timedelta(minutes=5), False),
        ]
        if scheduled_at:
            remind_at = scheduled_at - timedelta(hours=1)
            plan.append(("reminder", remind_at if remind_at > now else now + timedelta(minutes=1), False))
            plan.append(("completion", scheduled_at + timedelta(minutes=90), False))
        else:
            plan.append(("completion", now + timedelta(hours=3), False))

        notifications = []
        for kind, when, sent in plan:
            n = Notification(
                id=str(uuid.uuid4()), booking_id=booking_id, user_id=user_id, type=kind,
                message=msg(kind, language, **fmt), scheduled_for=when, sent=sent, created_at=now,
            )
            db.add(n)
            notifications.append({"type": kind, "message": n.message, "sent": sent, "scheduled_for": str(when)})

    await db.commit()
    return {
        "booking": {
            "id": booking_id, "request_id": request_id, "provider_id": provider_id,
            "provider_name": provider_name, "service_type": service_type, "status": "confirmed",
            "scheduled_time": scheduled_time, "scheduled_at": scheduled_at.isoformat() if scheduled_at else None,
            "notes": notes, "price": price,
        },
        "notifications": notifications,
        "duration_ms": int((time.time() - start) * 1000),
    }

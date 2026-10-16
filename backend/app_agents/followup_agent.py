"""FollowUpAgent: acts *after* a booking is made.

* delivers due notifications (reminder 1h before, provider-assigned, completion/rating check-in)
* reacts to cancellations: frees the slot and, if the provider cancelled, re-runs the orchestrator
  (excluding that provider, same time window) and tells the customer what it did.

Delivery is simulated: the "channel" is recorded in the agent trace instead of calling WhatsApp/SMS.
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import AgentTrace, Booking, Notification, Provider, ProviderSlot, ServiceRequest, User
from .messages import msg, norm_lang
from .slots import release_slot
from .time_resolver import fmt_local


def _trace(db: AsyncSession, request_id, action, input_data, output_data, reasoning):
    db.add(AgentTrace(
        id=str(uuid.uuid4()), request_id=request_id, agent_name="FollowUpAgent", action=action,
        input_data=input_data, output_data=output_data, reasoning=reasoning, duration_ms=0, created_at=datetime.utcnow(),
    ))


async def process_due_notifications(db: AsyncSession, now: Optional[datetime] = None) -> list:
    """Send every notification whose time has come. Idempotent: delivered rows are flagged sent."""
    now = now or datetime.utcnow()
    due = (await db.execute(
        select(Notification).where(Notification.sent == False, Notification.scheduled_for <= now)  # noqa: E712
        .order_by(Notification.scheduled_for.asc())
    )).scalars().all()

    delivered = []
    for n in due:
        booking = (await db.execute(select(Booking).where(Booking.id == n.booking_id))).scalar_one_or_none()
        user = (await db.execute(select(User).where(User.id == n.user_id))).scalar_one_or_none()
        if not booking or booking.status == "cancelled":
            await db.delete(n)
            continue
        # A reminder for a job that already started/finished is noise
        if n.type == "reminder" and booking.status != "confirmed":
            n.sent = True
            continue
        if n.type == "completion" and booking.is_rated:
            n.sent = True
            continue

        channel = "whatsapp" if user and user.phone else "in_app"
        n.sent = True
        record = {"notification_id": n.id, "booking_id": n.booking_id, "type": n.type, "channel": channel,
                  "to": (user.phone if user and user.phone else (user.email if user else None)), "message": n.message}
        _trace(db, booking.request_id, f"deliver_{n.type}", {"scheduled_for": str(n.scheduled_for)}, record,
               f"{n.type} was due at {n.scheduled_for}; delivered via {channel} (simulated).")
        delivered.append(record)
    await db.commit()
    return delivered


async def fast_forward(db: AsyncSession, booking_id: str, now: Optional[datetime] = None) -> list:
    """Demo helper: make every pending notification of a booking due right now, then deliver them in order."""
    now = now or datetime.utcnow()
    pending = (await db.execute(
        select(Notification).where(Notification.booking_id == booking_id, Notification.sent == False)  # noqa: E712
    )).scalars().all()
    for n in pending:
        n.scheduled_for = min(n.scheduled_for or now, now)
    await db.flush()
    return await process_due_notifications(db, now)


async def handle_cancellation(
    db: AsyncSession, booking_id: str, cancelled_by: str, *, now: Optional[datetime] = None,
    offline: bool = False, emit=None,
) -> dict:
    """Cancel a booking. When the *provider* cancels, find the customer a replacement automatically."""
    from .orchestrator import run_orchestration  # local import: orchestrator imports the booking agent

    now = now or datetime.utcnow()
    booking = (await db.execute(select(Booking).where(Booking.id == booking_id))).scalar_one_or_none()
    if not booking:
        return {"status": "not_found"}
    if booking.status in ("cancelled", "completed"):
        return {"status": "invalid_state", "detail": f"booking is already {booking.status}"}

    slot = (await db.execute(select(ProviderSlot).where(ProviderSlot.booking_id == booking_id))).scalars().first()
    slot_start = slot.start_time if slot else None
    old_provider = (await db.execute(select(Provider).where(Provider.id == booking.provider_id))).scalar_one_or_none()
    req = (await db.execute(select(ServiceRequest).where(ServiceRequest.id == booking.request_id))).scalar_one_or_none()
    user = (await db.execute(select(User).where(User.id == booking.user_id))).scalar_one_or_none()
    lang = norm_lang(req.language_detected if req else None)
    old_name = old_provider.name if old_provider else "Provider"
    service = (req.service_type if req and req.service_type else (old_provider.service_type if old_provider else "service"))

    booking.status = "cancelled"
    freed = await release_slot(db, booking_id)
    await db.execute(delete(Notification).where(Notification.booking_id == booking_id, Notification.sent == False))  # noqa: E712
    _trace(db, booking.request_id, "booking_cancelled", {"booking_id": booking_id, "by": cancelled_by},
           {"slot_released": bool(freed)}, f"{cancelled_by} cancelled; slot released and pending reminders removed.")
    await db.commit()

    if cancelled_by != "provider" or not req or not slot_start:
        return {"status": "cancelled", "rebooked": False}

    window = {
        "label": f"Same time as cancelled booking ({fmt_local(slot_start)})", "resolved": True, "is_asap": False,
        "display": f"around {fmt_local(slot_start)}", "preferred_utc": slot_start,
        "start_utc": slot_start - timedelta(hours=2), "end_utc": slot_start + timedelta(hours=3),
    }
    intent = {"service_type": req.service_type, "location": req.location, "time": req.time,
              "urgency": req.urgency or "medium", "language_detected": lang}
    # Reuse the position the original search used (geocoding the text again can land somewhere else)
    prior = (await db.execute(
        select(AgentTrace).where(AgentTrace.request_id == req.id, AgentTrace.action == "search_providers")
        .order_by(AgentTrace.created_at.asc())
    )).scalars().first()
    coords = ((prior.output_data or {}).get("coordinates") if prior else None) or {}
    result = await run_orchestration(
        db, user, req.raw_text, preset_intent=intent, forced_window=window, exclude_ids={booking.provider_id},
        lat=coords.get("latitude"), lng=coords.get("longitude"),
        now=now, offline=offline, mode="policy", channel="followup", emit=emit,
    )

    if result["status"] == "booked":
        new_name, when = result["provider"]["name"], fmt_local(datetime.fromisoformat(result["scheduled_at"]))
        text = msg("rebooked", lang, old=old_name, provider=new_name, service=service, when=when)
        notif_booking = result["booking"]["id"]
    else:
        text = msg("cancelled_no_alternative", lang, old=old_name, service=service)
        notif_booking = booking_id
    db.add(Notification(id=str(uuid.uuid4()), booking_id=notif_booking, user_id=booking.user_id, type="rebooked"
                        if result["status"] == "booked" else "cancelled", message=text, scheduled_for=now, sent=True, created_at=now))
    _trace(db, booking.request_id, "auto_rebook", {"excluded_provider": booking.provider_id},
           {"status": result["status"], "new_booking": result["booking"]["id"] if result.get("booking") else None},
           "Provider cancelled; searched again around the same time without them. " + text)
    await db.commit()
    return {"status": "cancelled", "rebooked": result["status"] == "booked", "message": text, "orchestration": result}


# ----------------------------------------------------------------------------- scheduler

_scheduler = None


async def _tick():
    from database import async_session
    async with async_session() as db:
        delivered = await process_due_notifications(db)
        if delivered:
            print(f"📨 FollowUpAgent delivered {len(delivered)} notification(s)")


def start_scheduler():
    """Poll for due notifications every 30s. Skipped on serverless hosts (use POST /api/followup/tick there)."""
    global _scheduler
    if os.getenv("VERCEL") == "1" or os.getenv("FOLLOWUP_SCHEDULER", "on").lower() == "off" or _scheduler:
        return None
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
    except ImportError:
        print("⚠️  apscheduler not installed; follow-ups only run via POST /api/followup/tick")
        return None
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(_tick, "interval", seconds=30, id="followup_tick", max_instances=1, coalesce=True)
    _scheduler.start()
    return _scheduler


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None

"""Provider scheduling: working hours, free-slot calculation and conflict-checked booking."""
import re
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models import ProviderSlot
from .time_resolver import PKT, to_local

SLOT_MINUTES = 60
MIN_LEAD = timedelta(minutes=30)
DEFAULT_HOURS = (9, 18)


class SlotConflict(Exception):
    """Raised when the requested hour is already taken for that provider."""


def parse_working_hours(value) -> Tuple[int, int]:
    """'9 AM - 6 PM' -> (9, 18). Anything unparseable falls back to 9-18."""
    if not value or not isinstance(value, str):
        return DEFAULT_HOURS
    if re.search(r"24\s*/\s*7|24 hours|open 24", value.lower()):
        return (0, 24)
    found = re.findall(r"(\d{1,2})(?::\d{2})?\s*(am|pm)", value.lower())
    if len(found) >= 2:
        hours = [int(h) % 12 + (12 if suffix == "pm" else 0) for h, suffix in found[:2]]
        if hours[1] > hours[0]:
            return (hours[0], hours[1])
        if hours[1] == 0:
            return (hours[0], 24)
    return DEFAULT_HOURS


async def booked_starts(db: AsyncSession, provider_id: str, start_utc: datetime, end_utc: datetime) -> set:
    rows = await db.execute(
        select(ProviderSlot.start_time).where(
            ProviderSlot.provider_id == provider_id,
            ProviderSlot.start_time >= start_utc,
            ProviderSlot.start_time < end_utc,
        )
    )
    return {r[0] for r in rows.all()}


async def free_slots(
    db: AsyncSession,
    provider_id: str,
    working_hours,
    window_start_utc: datetime,
    window_end_utc: datetime,
    now_utc: Optional[datetime] = None,
) -> List[datetime]:
    """Hourly free start times (UTC) inside the window, honouring working hours and existing bookings."""
    now_utc = now_utc or datetime.utcnow()
    open_h, close_h = parse_working_hours(working_hours)
    taken = await booked_starts(db, provider_id, window_start_utc, window_end_utc)

    out = []
    cursor = window_start_utc.replace(minute=0, second=0, microsecond=0)
    if cursor < window_start_utc:
        cursor += timedelta(hours=1)
    while cursor < window_end_utc:
        local_hour = to_local(cursor).hour
        if open_h <= local_hour < close_h and cursor >= now_utc + MIN_LEAD and cursor not in taken:
            out.append(cursor)
        cursor += timedelta(minutes=SLOT_MINUTES)
    return out


def nearest(slots: List[datetime], preferred_utc: datetime) -> Optional[datetime]:
    return min(slots, key=lambda s: abs((s - preferred_utc).total_seconds())) if slots else None


async def book_slot(db: AsyncSession, provider_id: str, start_utc: datetime, booking_id: str) -> ProviderSlot:
    """Reserve one hour. Raises SlotConflict if taken (checked up-front and by the unique constraint)."""
    clash = await db.execute(
        select(ProviderSlot.id).where(ProviderSlot.provider_id == provider_id, ProviderSlot.start_time == start_utc)
    )
    if clash.first():
        raise SlotConflict(f"{provider_id} already booked at {start_utc.isoformat()}")
    slot = ProviderSlot(
        provider_id=provider_id,
        booking_id=booking_id,
        start_time=start_utc,
        end_time=start_utc + timedelta(minutes=SLOT_MINUTES),
    )
    try:
        async with db.begin_nested():
            db.add(slot)
            await db.flush()
    except IntegrityError:
        raise SlotConflict(f"{provider_id} already booked at {start_utc.isoformat()}")
    return slot


async def release_slot(db: AsyncSession, booking_id: str) -> int:
    res = await db.execute(delete(ProviderSlot).where(ProviderSlot.booking_id == booking_id))
    return res.rowcount or 0


async def day_schedule(db: AsyncSession, provider_id: str, working_hours, around_utc: datetime) -> List[dict]:
    """Snapshot of one local day: [{time, status}] — used for before/after views."""
    local = to_local(around_utc)
    open_h, close_h = parse_working_hours(working_hours)
    day_start_utc = local.replace(hour=0, minute=0, second=0, microsecond=0) - PKT
    taken = await booked_starts(db, provider_id, day_start_utc, day_start_utc + timedelta(days=1))
    out = []
    for h in range(open_h, min(close_h, 24)):
        start_utc = day_start_utc + timedelta(hours=h)
        label = local.replace(hour=h, minute=0).strftime("%I:%M %p").lstrip("0")
        out.append({"time": label, "start_utc": start_utc.isoformat(), "status": "booked" if start_utc in taken else "free"})
    return out

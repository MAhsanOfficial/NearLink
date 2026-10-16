"""Turns phrases like "kal subah", "aaj shaam 5 baje" or "ASAP" into a concrete time window.

All inputs/outputs are naive UTC datetimes (the database convention). Pakistan has no DST, so
local time is a fixed UTC+5 offset.
"""
import re
from datetime import datetime, timedelta
from typing import Optional

PKT = timedelta(hours=5)

# (start_hour, end_hour, preferred_hour) in local time
PARTS_OF_DAY = {
    "morning": (9, 12, 10),
    "afternoon": (12, 16, 13),
    "evening": (16, 20, 17),
    "night": (20, 23, 20),
}

PART_WORDS = {
    "morning": ["subah", "subha", "morning", "sawere", "savere", "صبح"],
    "afternoon": ["dopahar", "dopehar", "dupahar", "afternoon", "دوپہر"],
    "evening": ["shaam", "sham", "evening", "شام"],
    "night": ["raat", "night", "رات"],
}

ASAP_WORDS = ["asap", "abhi", "jaldi", "urgent", "right now", "immediately", "emergency", "فوری", "ابھی", "جلدی"]
TODAY_WORDS = ["aaj", "today", "tonight", "آج"]
TOMORROW_WORDS = ["kal", "tomorrow", "tmrw", "کل"]
DAY_AFTER_WORDS = ["parson", "parsoon", "day after tomorrow", "پرسوں"]
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

EARLIEST_HOUR = 9
LATEST_HOUR = 20


def _has_word(text: str, words) -> bool:
    for w in words:
        if re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", text):
            return True
    return False


def _explicit_hour(text: str, part: Optional[str]) -> Optional[int]:
    """Find '3 pm', '15:30', '3 baje'. A bare number is never a time, so sectors like G-13 are safe."""
    m = re.search(r"(?<![\w-])(\d{1,2})(?::\d{2})?\s*(am|pm|baje|bje)\b", text)
    colon = re.search(r"(?<![\w-])([01]?\d|2[0-3]):([0-5]\d)(?!\d)", text)
    if m:
        hour, suffix = int(m.group(1)), m.group(2)
        if hour > 23:
            return None
        if suffix == "pm" and hour < 12:
            hour += 12
        elif suffix == "am" and hour == 12:
            hour = 0
        elif suffix in ("baje", "bje") and hour < 12:
            # "3 baje" is ambiguous: use the stated part of day, else assume daytime hours
            if part in ("afternoon", "evening", "night") or (part is None and hour < 8):
                hour += 12
        return hour
    if colon:
        return int(colon.group(1))
    return None


def _clamp_to_working_day(dt_local: datetime) -> datetime:
    if dt_local.hour < EARLIEST_HOUR:
        return dt_local.replace(hour=EARLIEST_HOUR, minute=0, second=0, microsecond=0)
    if dt_local.hour >= LATEST_HOUR:
        return (dt_local + timedelta(days=1)).replace(hour=EARLIEST_HOUR, minute=0, second=0, microsecond=0)
    return dt_local


def resolve_time(text: Optional[str], now_utc: Optional[datetime] = None) -> dict:
    """Resolve a free-text time phrase into {start_utc, end_utc, preferred_utc, ...}.

    `resolved` is False when nothing recognisable was found (treated as ASAP).
    """
    now_utc = now_utc or datetime.utcnow()
    now_local = now_utc + PKT
    t = (text or "").lower().strip()

    part = next((k for k, words in PART_WORDS.items() if _has_word(t, words)), None)
    is_asap = _has_word(t, ASAP_WORDS)
    day_offset = None
    if _has_word(t, DAY_AFTER_WORDS):
        day_offset = 2
    elif _has_word(t, TOMORROW_WORDS):
        day_offset = 1
    elif _has_word(t, TODAY_WORDS):
        day_offset = 0
    else:
        for i, name in enumerate(WEEKDAYS):
            if _has_word(t, [name]):
                day_offset = (i - now_local.weekday()) % 7 or 7
                break
    hour = _explicit_hour(t, part)

    recognised = bool(is_asap or part or day_offset is not None or hour is not None)

    # ASAP / unrecognised -> next 3 hours inside working time
    if (is_asap and day_offset is None and part is None and hour is None) or not recognised:
        start = _clamp_to_working_day((now_local + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0))
        end = start + timedelta(hours=3)
        return _result(start, end, start, "ASAP", recognised, True)

    base = now_local.replace(minute=0, second=0, microsecond=0)

    if hour is not None:
        pref = base.replace(hour=hour) + timedelta(days=day_offset or 0)
        start, end = pref - timedelta(hours=1), pref + timedelta(hours=2)
    elif part:
        s_h, e_h, p_h = PARTS_OF_DAY[part]
        day = base + timedelta(days=day_offset or 0)
        start, end, pref = day.replace(hour=s_h), day.replace(hour=e_h), day.replace(hour=p_h)
    else:  # only a day was given -> whole working day
        day = base + timedelta(days=day_offset or 0)
        start, end, pref = day.replace(hour=EARLIEST_HOUR), day.replace(hour=LATEST_HOUR), day.replace(hour=10)

    # A phrase without a day that already passed today ("subah" at 4pm) means tomorrow
    if day_offset is None and end <= now_local + timedelta(minutes=30):
        start, end, pref = start + timedelta(days=1), end + timedelta(days=1), pref + timedelta(days=1)
    return _result(start, end, pref, _label(part, hour, now_local, pref), True, False)


def _label(part, hour, now_local, pref) -> str:
    days = (pref.date() - now_local.date()).days
    day = {0: "Today", 1: "Tomorrow", 2: "Day after tomorrow"}.get(days, pref.strftime("%A"))
    if hour is not None:
        return f"{day} {pref.strftime('%I:%M %p').lstrip('0')}"
    return f"{day} {part.capitalize()}" if part else day


def _result(start_local, end_local, pref_local, label, recognised, is_asap) -> dict:
    return {
        "label": label,
        "resolved": recognised,
        "is_asap": is_asap,
        "start_utc": start_local - PKT,
        "end_utc": end_local - PKT,
        "preferred_utc": pref_local - PKT,
        "display": f"{pref_local.strftime('%a %d %b')} {start_local.strftime('%I:%M %p').lstrip('0')} - {end_local.strftime('%I:%M %p').lstrip('0')}",
    }


def to_local(dt_utc: datetime) -> datetime:
    return dt_utc + PKT


def fmt_local(dt_utc: datetime) -> str:
    local = to_local(dt_utc)
    return f"{local.strftime('%a %d %b')}, {local.strftime('%I:%M %p').lstrip('0')}"

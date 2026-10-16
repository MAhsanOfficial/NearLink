"""
Fallback intent parser used when Gemini is unavailable (and in offline tests).
Keyword/regex based; handles English, Roman Urdu and Urdu script.
"""
import json
import re
import time

URDU_HINTS = ["مجھے", "چاہیے", "چاہئے", "کل", "آج", "صبح", "شام", "دوپہر", "رات", "میں"]
ROMAN_URDU_HINTS = ["mujhe", "chahiye", "chahie", "kal", "aaj", "subah", "shaam", "abhi", "fori", "mein", "kharab", "kar", "do", "hai", "ka", "ki", "ko"]

SERVICE_KEYWORDS = {
    "AC Repair": ["ac", "a/c", "air conditioner", "air conditioning", "cooling", "اے سی"],
    "Electrician": ["electrician", "bijli", "electric", "wiring", "electricity", "الیکٹریشن", "بجلی"],
    "Plumber": ["plumber", "plumbing", "pani", "pipe", "drain", "leak", "tap", "پلمبر", "پانی"],
    "Carpenter": ["carpenter", "carpentry", "furniture", "wood", "کارپینٹر", "بڑھئی"],
    "Painter": ["painter", "painting", "paint", "رنگ"],
    "Cleaner": ["cleaner", "cleaning", "safai", "صفائی"],
    "Mechanic": ["mechanic", "car repair", "gaari", "gadi", "میکینک"],
    "Tutor": ["tutor", "teacher", "tuition", "ٹیوٹر"],
}

KNOWN_AREAS = [
    "(?:dha|defence) phase \\d+", "dha", "defence", "clifton", "gulshan", "gulistan", "johar", "saddar", "bahria", "nazimabad",
    "north nazimabad", "korangi", "malir", "pechs", "gulberg", "model town", "johar town", "satellite town",
    "blue area", "f-?\\d+", "e-?\\d+", "d-?\\d+", "i-?\\d+", "h-?\\d+", "g-?\\d+", "b-17", "pwd", "bahria town",
]

URGENT = ["urgent", "fori", "abhi", "now", "asap", "emergency", "jaldi", "فوری", "ابھی", "جلدی"]
TODAY = ["today", "aaj", "آج", "tonight"]
TOMORROW = ["tomorrow", "kal", "کل"]
PART = {
    "Morning": ["subah", "morning", "صبح"],
    "Afternoon": ["dopahar", "afternoon", "دوپہر"],
    "Evening": ["shaam", "evening", "شام"],
    "Night": ["raat", "night", "رات"],
}


def _has(text: str, words) -> bool:
    return any(re.search(r"(?<![a-z0-9])" + re.escape(w) + r"(?![a-z0-9])", text) for w in words)


def _normalize_sector(raw: str) -> str:
    m = re.fullmatch(r"([a-z])-?(\d+)", raw.strip(), re.I)
    return f"{m.group(1).upper()}-{m.group(2)}" if m else raw.strip().title().replace("Dha", "DHA")


def parse_intent_fallback(raw_text: str) -> dict:
    start = time.time()
    text = raw_text.lower()

    if any(w in raw_text for w in URDU_HINTS) and re.search(r"[؀-ۿ]", raw_text):
        language = "urdu"
    elif _has(text, ROMAN_URDU_HINTS):
        language = "roman_urdu"
    else:
        language = "english"

    service_type = "General Service"
    for service, keywords in SERVICE_KEYWORDS.items():
        if _has(text, keywords):
            service_type = service
            break

    location = "Unknown"
    for pattern in KNOWN_AREAS:
        m = re.search(r"(?<![a-z0-9])(" + pattern + r")(?![a-z0-9])", text)
        if m:
            location = _normalize_sector(m.group(1))
            break
    if location == "Unknown":
        m = re.search(r"\b(?:in|at|near|mein|me)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)", raw_text)
        if m:
            location = m.group(1)

    part = next((p for p, words in PART.items() if _has(text, words)), None)
    if _has(text, URGENT):
        time_str, urgency = "ASAP", "high"
    elif _has(text, TOMORROW):
        time_str, urgency = "Tomorrow" + (f" {part}" if part else ""), "low"
    elif _has(text, TODAY):
        time_str, urgency = "Today" + (f" {part}" if part else ""), "medium"
    elif part:
        time_str, urgency = part, "medium"
    else:
        time_str, urgency = "ASAP", "medium"

    parsed = {
        "service_type": service_type,
        "location": location,
        "time": time_str,
        "urgency": urgency,
        "language_detected": language,
    }
    return {
        "parsed": parsed,
        "duration_ms": int((time.time() - start) * 1000),
        "raw_output": json.dumps(parsed, ensure_ascii=False),
        "fallback": True,
    }

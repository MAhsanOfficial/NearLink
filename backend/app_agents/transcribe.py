"""Speech-to-text for WhatsApp voice notes and the in-app mic, using Gemini's native audio input."""
import base64
import os

import httpx

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
PROMPT = (
    "Transcribe this voice message exactly as spoken. It is probably Urdu, Roman Urdu or English (often mixed) "
    "and is a request for a local service such as a plumber, electrician or AC technician. "
    "Return ONLY the transcript text, written in the same script the speaker would naturally use "
    "(keep Urdu in Urdu script). No quotes, no commentary."
)


class TranscriptionError(Exception):
    pass


async def transcribe_audio(audio: bytes, mime_type: str = "audio/ogg", model: str = "gemini-2.5-flash") -> str:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise TranscriptionError("GEMINI_API_KEY is not configured")
    if not audio:
        raise TranscriptionError("empty audio")
    mime_type = (mime_type or "audio/ogg").split(";")[0].strip()  # "audio/webm;codecs=opus" -> "audio/webm"
    body = {"contents": [{"parts": [
        {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(audio).decode()}},
        {"text": PROMPT},
    ]}]}
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(GEMINI_URL.format(model=model), params={"key": key}, json=body)
    if r.status_code != 200:
        raise TranscriptionError(f"Gemini returned {r.status_code}: {r.text[:200]}")
    try:
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, ValueError):
        raise TranscriptionError("Gemini returned no transcript")
    if not text:
        raise TranscriptionError("empty transcript")
    return text

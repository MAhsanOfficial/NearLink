"""WhatsApp channel: text or voice note in, booking confirmation out.

* POST /api/whatsapp/webhook   - Twilio WhatsApp webhook (form-encoded, replies with TwiML)
* POST /api/whatsapp/simulate  - same pipeline for the in-app WhatsApp simulator (JSON/multipart)

Customers are identified by phone number; unknown numbers get a lightweight shadow account.
"""
import base64
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional
from xml.sax.saxutils import escape

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app_agents.orchestrator import run_orchestration
from app_agents.transcribe import TranscriptionError, transcribe_audio
from database import get_db
from models import ServiceRequest, User

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

CLARIFICATION_TTL = timedelta(minutes=30)
MAX_AUDIO_BYTES = 8 * 1024 * 1024


def _digits(phone: str) -> str:
    return "".join(c for c in (phone or "") if c.isdigit())


async def get_or_create_customer(db: AsyncSession, phone: str, name: Optional[str] = None) -> User:
    digits = _digits(phone)
    if len(digits) < 7:
        raise HTTPException(status_code=400, detail="A valid phone number is required")
    users = (await db.execute(select(User).where(User.phone.isnot(None)))).scalars().all()
    existing = next((u for u in users if _digits(u.phone).endswith(digits[-10:])), None)
    if existing:
        return existing
    user = User(
        id=str(uuid.uuid4()), email=f"wa{digits}@whatsapp.nearlink.local", name=name or f"WhatsApp {digits[-4:]}",
        password_hash="!" + secrets.token_hex(16),  # not a valid bcrypt hash: password login is impossible
        phone=phone, user_type="customer", created_at=datetime.utcnow(),
    )
    db.add(user)
    await db.commit()
    return user


async def pending_clarification(db: AsyncSession, user: User) -> Optional[str]:
    row = (await db.execute(
        select(ServiceRequest).where(ServiceRequest.user_id == user.id, ServiceRequest.status == "needs_clarification")
        .order_by(ServiceRequest.created_at.desc())
    )).scalars().first()
    if row and row.created_at and datetime.utcnow() - row.created_at <= CLARIFICATION_TTL:
        return row.id
    return None


async def handle_message(db: AsyncSession, phone: str, text: str, name: Optional[str] = None) -> dict:
    user = await get_or_create_customer(db, phone, name)
    previous = await pending_clarification(db, user)
    result = await run_orchestration(db, user, text, previous_request_id=previous, channel="whatsapp")
    result["customer"] = {"id": user.id, "name": user.name, "phone": user.phone}
    return result


@router.post("/simulate")
async def simulate(
    phone: str = Form(...), text: Optional[str] = Form(None), name: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None), db: AsyncSession = Depends(get_db),
):
    """Used by the WhatsApp simulator page. Accepts typed text and/or a recorded voice note."""
    transcript = None
    if audio is not None:
        data = await audio.read()
        if len(data) > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail="Voice note too large (max 8 MB)")
        try:
            transcript = await transcribe_audio(data, audio.content_type or "audio/webm")
        except TranscriptionError as e:
            raise HTTPException(status_code=422, detail=f"Could not transcribe voice note: {e}")
        text = transcript
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Send text or a voice note")
    result = await handle_message(db, phone, text, name)
    return {"transcript": transcript, "text": text, "reply": result["reply_text"], "result": result}


def _valid_signature(url: str, params: dict, signature: str, token: str) -> bool:
    payload = url + "".join(k + str(params[k]) for k in sorted(params))
    expected = base64.b64encode(hmac.new(token.encode(), payload.encode(), hashlib.sha1).digest()).decode()
    return hmac.compare_digest(expected, signature or "")


@router.post("/webhook")
async def twilio_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    form = dict((await request.form()).items())
    token = os.getenv("TWILIO_AUTH_TOKEN")
    if token:
        base = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
        url = f"{base}{request.url.path}" if base else str(request.url)
        if not _valid_signature(url, form, request.headers.get("X-Twilio-Signature", ""), token):
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")
    else:
        print("⚠️  TWILIO_AUTH_TOKEN not set: WhatsApp webhook signature is NOT being verified (dev mode)")

    phone = (form.get("From") or "").replace("whatsapp:", "")
    text = (form.get("Body") or "").strip()
    reply = None

    if int(form.get("NumMedia") or 0) > 0 and str(form.get("MediaContentType0", "")).startswith("audio"):
        try:
            auth = (os.getenv("TWILIO_ACCOUNT_SID", ""), token or "") if token else None
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                media = await client.get(form["MediaUrl0"], auth=auth)
            media.raise_for_status()
            text = await transcribe_audio(media.content[:MAX_AUDIO_BYTES], form["MediaContentType0"])
        except Exception as e:
            print(f"Voice note failed: {e}")
            reply = "Sorry, I couldn't understand that voice note. Please type your request or try again."

    if reply is None:
        if not text:
            reply = "Hi! Tell me what you need, e.g. 'Kal subah G-13 mein AC technician chahiye'. You can also send a voice note."
        else:
            result = await handle_message(db, phone, text)
            reply = result["reply_text"]

    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{escape(reply)}</Message></Response>'
    return Response(content=twiml, media_type="application/xml")

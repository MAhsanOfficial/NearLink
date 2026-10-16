"""HTTP-level tests: streaming endpoint, WhatsApp channel, cancellation + rebooking."""
import base64
import hashlib
import hmac
import json

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import select

import database
import main
from routes import orchestrator as orchestrator_routes
from routes.auth import create_token
from database import get_db
from models import Booking, User
from tests.conftest import G13

BRIEF = "Mujhe kal subah G-13 mein AC technician chahiye"


@pytest_asyncio.fixture
async def client(session_factory, monkeypatch):
    async def override():
        async with session_factory() as s:
            yield s

    main.app.dependency_overrides[get_db] = override
    monkeypatch.setattr(orchestrator_routes, "async_session", session_factory)  # the streaming route opens its own session
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    main.app.dependency_overrides.clear()


def auth(user):
    return {"Authorization": f"Bearer {create_token(user.id, user.email, user.name)}"}


def parse_sse(text):
    events, name = [], None
    for line in text.splitlines():
        if line.startswith("event: "):
            name = line[7:]
        elif line.startswith("data: "):
            events.append((name, json.loads(line[6:])))
    return events


async def test_run_endpoint_books_for_signed_in_user(client, customer, providers):
    r = await client.post("/api/orchestrator/run", json={"text": BRIEF, "latitude": G13[0], "longitude": G13[1]}, headers=auth(customer))
    body = r.json()
    assert r.status_code == 200 and body["status"] == "booked"
    assert body["provider"]["name"] == "Ali AC Services" and body["booking"]["id"]


async def test_run_endpoint_without_login_recommends_only(client, providers):
    r = await client.post("/api/orchestrator/run", json={"text": BRIEF, "latitude": G13[0], "longitude": G13[1]})
    assert r.json()["status"] == "needs_login"


async def test_stream_endpoint_emits_steps_then_result(client, customer, providers):
    r = await client.post("/api/orchestrator/stream", json={"text": BRIEF, "latitude": G13[0], "longitude": G13[1]}, headers=auth(customer))
    events = parse_sse(r.text)
    names = [n for n, _ in events]
    assert r.headers["content-type"].startswith("text/event-stream")
    assert names[-1] == "result" and names.count("step") >= 8 and "error" not in names
    assert events[-1][1]["status"] == "booked"
    assert "events" not in events[-1][1]  # steps were already streamed, not repeated


async def test_input_validation(client):
    r = await client.post("/api/orchestrator/run", json={"text": "x"})
    assert r.status_code == 422


async def test_trace_replay_returns_stored_steps(client, customer, providers):
    run = (await client.post("/api/orchestrator/run", json={"text": BRIEF, "latitude": G13[0], "longitude": G13[1]}, headers=auth(customer))).json()
    steps = (await client.get(f"/api/orchestrator/runs/{run['request_id']}")).json()
    assert len(steps) >= 8 and steps[0]["agent"] == "OrchestratorAgent"


# --- WhatsApp -------------------------------------------------------------------

async def test_whatsapp_simulate_creates_customer_and_asks_for_location(client, providers):
    r = await client.post("/api/whatsapp/simulate", data={"phone": "+92 321 5550001", "text": "AC kharab hai"})
    body = r.json()
    assert r.status_code == 200 and body["result"]["status"] == "clarify"
    assert "sector" in body["reply"].lower()


async def test_whatsapp_clarification_continues_the_same_request(client, session_factory, providers):
    phone = "+923215550002"
    first = (await client.post("/api/whatsapp/simulate", data={"phone": phone, "text": "kal subah AC technician chahiye"})).json()
    assert first["result"]["status"] == "clarify"
    second = (await client.post("/api/whatsapp/simulate", data={"phone": phone, "text": "G-13 mein"})).json()
    # the answer was merged with the earlier message, so the service + time were remembered
    assert second["result"]["intent"]["service_type"] == "AC Repair"
    assert second["result"]["intent"]["location"] == "G-13"
    assert second["result"]["window"]["label"] == "Tomorrow Morning"


async def test_whatsapp_requires_text_or_audio(client):
    r = await client.post("/api/whatsapp/simulate", data={"phone": "+923215550003"})
    assert r.status_code == 400


async def test_whatsapp_voice_note_is_transcribed(client, monkeypatch, providers):
    from routes import whatsapp

    async def fake_transcribe(audio, mime):
        assert audio == b"fake-bytes" and mime == "audio/webm"
        return "AC kharab hai"

    monkeypatch.setattr(whatsapp, "transcribe_audio", fake_transcribe)
    r = await client.post("/api/whatsapp/simulate", data={"phone": "+923215550004"},
                          files={"audio": ("note.webm", b"fake-bytes", "audio/webm")})
    assert r.status_code == 200 and r.json()["transcript"] == "AC kharab hai"


async def test_whatsapp_webhook_replies_with_twiml_and_checks_signature(client, monkeypatch, providers):
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secret")
    form = {"From": "whatsapp:+923215550005", "Body": "AC kharab hai", "NumMedia": "0"}
    url = "http://test/api/whatsapp/webhook"
    sig = base64.b64encode(hmac.new(b"secret", (url + "".join(k + form[k] for k in sorted(form))).encode(), hashlib.sha1).digest()).decode()

    bad = await client.post("/api/whatsapp/webhook", data=form, headers={"X-Twilio-Signature": "nope"})
    assert bad.status_code == 403

    ok = await client.post("/api/whatsapp/webhook", data=form, headers={"X-Twilio-Signature": sig})
    assert ok.status_code == 200 and ok.headers["content-type"].startswith("application/xml")
    assert ok.text.startswith("<?xml") and "<Message>" in ok.text


# --- cancellation ---------------------------------------------------------------

async def test_provider_cancel_endpoint_rebooks(client, session_factory, customer, providers):
    run = (await client.post("/api/orchestrator/run", json={"text": BRIEF, "latitude": G13[0], "longitude": G13[1]}, headers=auth(customer))).json()
    booking_id = run["booking"]["id"]

    async with session_factory() as s:
        owner = User(id="prov-owner", email="p@example.com", name="Ali", password_hash="x", user_type="provider")
        s.add(owner)
        ali = (await s.execute(select(Booking).where(Booking.id == booking_id))).scalar_one()
        from models import Provider
        prov = (await s.execute(select(Provider).where(Provider.id == ali.provider_id))).scalar_one()
        prov.user_id = owner.id
        await s.commit()

    r = await client.post(f"/api/bookings/{booking_id}/cancel", headers=auth(owner))
    body = r.json()
    assert r.status_code == 200 and body["rebooked"] is True
    assert body["new_booking"]["provider_id"] != "prov-ali"


async def test_stranger_cannot_cancel(client, customer, providers):
    run = (await client.post("/api/orchestrator/run", json={"text": BRIEF, "latitude": G13[0], "longitude": G13[1]}, headers=auth(customer))).json()
    stranger = User(id="stranger", email="s@example.com", name="S", password_hash="x")
    # token for a user that does not exist is rejected before any booking logic
    r = await client.post(f"/api/bookings/{run['booking']['id']}/cancel", headers=auth(stranger))
    assert r.status_code in (401, 403)

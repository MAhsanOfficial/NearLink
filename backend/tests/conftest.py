"""Shared fixtures: in-memory SQLite, seeded providers, and a network-free discovery stub."""
import math
import os
import sys
import uuid
from datetime import datetime

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base  # noqa: E402
from models import Provider, User  # noqa: E402

# Friday 2026-10-16 12:00 in Pakistan (07:00 UTC). "kal subah" = Sat 17 Oct, 09:00-12:00 local.
NOW = datetime(2026, 10, 16, 7, 0)
G13 = (33.6465, 72.9617)  # user's position


def _hav(lat1, lon1, lat2, lon2):
    r = 6371
    a = math.sin(math.radians(lat2 - lat1) / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 2)


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    """Tests never call Gemini or the network."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)


@pytest_asyncio.fixture
async def session_factory():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


@pytest_asyncio.fixture
async def db(session_factory):
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def customer(db):
    u = User(id=str(uuid.uuid4()), email="c@example.com", name="Customer", password_hash="x", phone="+923001234567", user_type="customer")
    db.add(u)
    await db.commit()
    return u


def _provider(name, dlat, dlng, rating, reviews, service="AC Repair", hours="9 AM - 6 PM", **kw):
    return Provider(
        id=f"prov-{name.split()[0].lower()}", name=name, service_type=service, area="G-13",
        latitude=G13[0] + dlat, longitude=G13[1] + dlng, rating=rating, total_reviews=reviews,
        availability=True, verified=True, phone="0300-0000000", working_hours=hours, price_range="Medium", **kw,
    )


@pytest_asyncio.fixture
async def providers(db):
    rows = [
        _provider("Ali AC Services", 0.010, 0.005, 4.8, 50),     # ~1.3 km
        _provider("Bashir Cooling", 0.030, 0.015, 4.5, 20),      # ~3.8 km
        _provider("Kamran Technician", 0.080, 0.010, 4.0, 8),    # ~9 km
    ]
    db.add_all(rows)
    await db.commit()
    return rows


@pytest.fixture(autouse=True)
def fake_discovery(monkeypatch):
    """Replace network discovery with a DB-only version that returns the same dict shape."""
    from app_agents import orchestrator

    async def fake(db, service_type, location, user_lat=None, user_lng=None):
        rows = (await db.execute(select(Provider))).scalars().all()
        out = []
        for p in rows:
            if service_type.lower() not in p.service_type.lower():
                continue
            d = _hav(user_lat, user_lng, p.latitude, p.longitude) if user_lat and p.latitude else None
            out.append({
                "id": p.id, "name": p.name, "service_type": p.service_type, "area": p.area, "address": p.address,
                "latitude": p.latitude, "longitude": p.longitude, "rating": p.rating, "total_reviews": p.total_reviews,
                "availability": True, "price_range": p.price_range, "phone": p.phone, "working_hours": p.working_hours,
                "verified": p.verified, "distance_km": d, "source": "registered", "source_label": "Registered",
            })
        out.sort(key=lambda x: x["distance_km"] or 999)
        return {"providers": out, "count": len(out), "duration_ms": 1}

    monkeypatch.setattr(orchestrator, "discover_providers", fake)
    monkeypatch.setattr(orchestrator, "geocode_location", lambda location: None)  # no network in tests

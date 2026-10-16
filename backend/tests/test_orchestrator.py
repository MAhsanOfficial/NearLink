from datetime import datetime, timedelta

from sqlalchemy import select

from app_agents import orchestrator
from app_agents.slots import SlotConflict, book_slot
from app_agents.time_resolver import resolve_time, to_local
from models import Booking, Notification, ProviderSlot, ServiceRequest
from tests.conftest import G13, NOW

BRIEF_EXAMPLE = "Mujhe kal subah G-13 mein AC technician chahiye"


async def run(db, user, text, **kw):
    kw.setdefault("lat", G13[0])
    kw.setdefault("lng", G13[1])
    return await orchestrator.run_orchestration(db, user, text, now=NOW, offline=True, mode="policy", **kw)


def tools_called(result):
    """Tool names in call order, with repeated searches (radius widening) collapsed."""
    names = [e["tool"] for e in result["events"] if e["type"] == "tool_result"]
    return [n for i, n in enumerate(names) if i == 0 or n != names[i - 1]]


async def test_brief_example_end_to_end(db, customer, providers):
    r = await run(db, customer, BRIEF_EXAMPLE)

    assert r["status"] == "booked"
    assert r["intent"]["service_type"] == "AC Repair" and r["intent"]["location"] == "G-13"
    assert r["language"] == "roman_urdu"
    assert r["provider"]["name"] == "Ali AC Services"            # closest + best rated + free
    assert to_local(datetime.fromisoformat(r["scheduled_at"])).hour == 10  # preferred hour in the window
    assert tools_called(r) == ["parse_request", "search_providers", "check_availability", "rank_candidates", "book_slot", "schedule_followups"]

    # state really changed: booking row, reserved slot, request marked booked
    booking = (await db.execute(select(Booking))).scalar_one()
    assert booking.status == "confirmed" and booking.provider_id == "prov-ali"
    assert (await db.execute(select(ProviderSlot))).scalar_one().booking_id == booking.id
    assert (await db.execute(select(ServiceRequest))).scalar_one().status == "booked"

    # before/after schedule snapshots show the hour flipping free -> booked
    before = {s["time"]: s["status"] for s in r["schedule_before"]}
    after = {s["time"]: s["status"] for s in r["schedule_after"]}
    assert before["10:00 AM"] == "free" and after["10:00 AM"] == "booked"

    # follow-ups: reminder exactly one hour before the visit, completion check-in after it
    notifs = {n.type: n for n in (await db.execute(select(Notification))).scalars().all()}
    slot = (await db.execute(select(ProviderSlot))).scalar_one()
    assert notifs["reminder"].scheduled_for == slot.start_time - timedelta(hours=1)
    assert notifs["completion"].scheduled_for > slot.start_time
    assert notifs["booking_confirmed"].sent and not notifs["reminder"].sent
    assert "Booking ho gayi" in notifs["booking_confirmed"].message  # replied in the user's language


async def test_ranking_scores_and_reply_are_explained(db, customer, providers):
    r = await run(db, customer, BRIEF_EXAMPLE)
    top = r["options"][0]
    assert top["name"] == "Ali AC Services" and top["rank"] == 1
    assert set(top["score_breakdown"]) == {"distance", "rating", "availability", "trust", "price"}
    assert abs(sum(top["score_breakdown"].values()) - top["score"]) < 0.2
    assert r["options"][0]["score"] >= r["options"][1]["score"]
    assert "Ali AC Services" in r["reply_text"] and "Booking" in r["reply_text"]


async def test_closest_provider_busy_switches_provider(db, customer, providers):
    w = resolve_time("kal subah", NOW)
    for h in range(3):  # Ali is fully booked all morning
        await book_slot(db, "prov-ali", w["start_utc"] + timedelta(hours=h), f"x{h}")
    await db.commit()

    r = await run(db, customer, BRIEF_EXAMPLE)
    assert r["status"] == "booked" and r["provider"]["name"] == "Bashir Cooling"
    assert any("Ali AC Services" in d and "no free slot" in d for d in r["decisions"])


async def test_preferred_hour_taken_books_nearest_hour(db, customer, providers):
    w = resolve_time("kal subah", NOW)
    await book_slot(db, "prov-ali", w["preferred_utc"], "x")  # 10:00 taken
    await db.commit()
    r = await run(db, customer, BRIEF_EXAMPLE)
    assert r["provider"]["name"] == "Ali AC Services"
    assert to_local(datetime.fromisoformat(r["scheduled_at"])).hour in (9, 11)
    assert any("not free at" in d for d in r["decisions"])


async def test_widens_radius_when_nobody_is_close(db, customer, providers):
    # user is far from everyone (~20 km): nothing within 3, 8 or 15 km
    r = await run(db, customer, BRIEF_EXAMPLE, lat=G13[0] + 0.25, lng=G13[1])
    widen = [e for e in r["events"] if e["tool"] == "widen_radius"]
    assert len(widen) >= 2
    assert r["status"] == "booked"


async def test_widens_time_window_when_everyone_is_busy(db, customer, providers):
    w = resolve_time("kal subah", NOW)
    for pid in ("prov-ali", "prov-bashir", "prov-kamran"):
        for h in range(3):
            await book_slot(db, pid, w["start_utc"] + timedelta(hours=h), f"{pid}{h}")
    await db.commit()

    r = await run(db, customer, BRIEF_EXAMPLE)
    assert r["status"] == "booked"
    assert any(e["tool"] == "widen_time_window" for e in r["events"])
    assert to_local(datetime.fromisoformat(r["scheduled_at"])).hour >= 12  # afternoon, same day


async def test_no_providers_at_all_is_a_clean_no_match(db, customer):
    r = await run(db, customer, BRIEF_EXAMPLE)
    assert r["status"] == "no_match" and "AC Repair" in r["reply_text"]
    assert (await db.execute(select(Booking))).first() is None


async def test_missing_location_asks_then_continues(db, customer, providers):
    first = await run(db, customer, "AC kharab hai", lat=None, lng=None)
    assert first["status"] == "clarify"
    assert "sector" in first["question"].lower()  # asked in the user's language, about the missing location
    assert (await db.execute(select(Booking))).first() is None

    second = await run(db, customer, "G-13 mein, kal subah", previous_request_id=first["request_id"], lat=G13[0], lng=G13[1])
    assert second["status"] == "booked"
    old = (await db.execute(select(ServiceRequest).where(ServiceRequest.id == first["request_id"]))).scalar_one()
    assert old.status == "merged"


async def test_anonymous_user_gets_recommendation_but_no_booking(db, providers):
    r = await run(db, None, BRIEF_EXAMPLE)
    assert r["status"] == "needs_login"
    assert r["provider"]["name"] == "Ali AC Services"
    assert (await db.execute(select(Booking))).first() is None
    assert (await db.execute(select(ProviderSlot))).first() is None


async def test_slot_conflict_during_booking_recovers(db, customer, providers, monkeypatch):
    real = orchestrator.create_booking
    calls = {"n": 0}

    async def flaky(*a, **kw):
        calls["n"] += 1
        if calls["n"] == 1:
            raise SlotConflict("someone else booked it")
        return await real(*a, **kw)

    monkeypatch.setattr(orchestrator, "create_booking", flaky)
    r = await run(db, customer, BRIEF_EXAMPLE)
    assert r["status"] == "booked" and calls["n"] == 2
    assert (await db.execute(select(Booking))).scalar_one().status == "confirmed"


async def test_every_step_is_persisted_as_a_trace(db, customer, providers):
    from models import AgentTrace
    r = await run(db, customer, BRIEF_EXAMPLE)
    traces = (await db.execute(select(AgentTrace).where(AgentTrace.request_id == r["request_id"]))).scalars().all()
    agents = {t.agent_name for t in traces}
    assert {"OrchestratorAgent", "IntentAgent", "DiscoveryAgent", "AvailabilityAgent", "RankingAgent", "BookingAgent", "FollowUpAgent"} <= agents
    assert all(t.reasoning for t in traces if t.action not in ("final",))


async def test_events_are_streamed_in_order(db, customer, providers):
    seen = []

    async def emit(e):
        seen.append(e["seq"])

    await run(db, customer, BRIEF_EXAMPLE, emit=emit)
    assert seen == sorted(seen) and seen[0] == 1 and len(seen) >= 8

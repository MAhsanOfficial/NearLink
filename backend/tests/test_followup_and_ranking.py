from datetime import datetime, timedelta

from sqlalchemy import select

from app_agents import orchestrator
from app_agents.followup_agent import fast_forward, handle_cancellation, process_due_notifications
from app_agents.ranking_agent import score_provider
from models import Booking, Notification, ProviderSlot
from tests.conftest import G13, NOW


async def book_brief(db, customer):
    return await orchestrator.run_orchestration(
        db, customer, "Mujhe kal subah G-13 mein AC technician chahiye", lat=G13[0], lng=G13[1],
        now=NOW, offline=True, mode="policy",
    )


async def test_reminder_fires_one_hour_before_and_only_once(db, customer, providers):
    r = await book_brief(db, customer)
    slot = (await db.execute(select(ProviderSlot))).scalar_one()

    early = await process_due_notifications(db, now=slot.start_time - timedelta(hours=2))
    assert all(d["type"] != "reminder" for d in early)

    due = await process_due_notifications(db, now=slot.start_time - timedelta(minutes=59))
    assert [d["type"] for d in due] == ["reminder"]
    assert "Yaad dahani" in due[0]["message"]            # Roman Urdu, matching the customer's language
    assert due[0]["channel"] == "whatsapp"                # customer has a phone number

    assert await process_due_notifications(db, now=slot.start_time - timedelta(minutes=59)) == []  # idempotent


async def test_completion_checkin_is_delivered_after_the_visit(db, customer, providers):
    await book_brief(db, customer)
    slot = (await db.execute(select(ProviderSlot))).scalar_one()
    delivered = await process_due_notifications(db, now=slot.start_time + timedelta(hours=3))
    assert "completion" in {d["type"] for d in delivered}


async def test_fast_forward_delivers_everything_for_a_booking(db, customer, providers):
    r = await book_brief(db, customer)
    delivered = await fast_forward(db, r["booking"]["id"], now=NOW)
    assert {d["type"] for d in delivered} >= {"provider_assigned", "reminder", "completion"}
    pending = (await db.execute(select(Notification).where(Notification.sent == False))).scalars().all()  # noqa: E712
    assert pending == []


async def test_provider_cancellation_frees_slot_and_rebooks_elsewhere(db, customer, providers):
    r = await book_brief(db, customer)
    assert r["provider"]["name"] == "Ali AC Services"
    old_booking_id = r["booking"]["id"]

    out = await handle_cancellation(db, old_booking_id, "provider", now=NOW, offline=True)

    assert out["rebooked"] is True
    # the rebooking search reused the original position instead of re-geocoding the text
    searched = [e for e in out["orchestration"]["events"] if e["tool"] == "search_providers"]
    assert searched[0]["output"]["coordinates"] == {"latitude": G13[0], "longitude": G13[1]}
    old = (await db.execute(select(Booking).where(Booking.id == old_booking_id))).scalar_one()
    assert old.status == "cancelled"
    new = out["orchestration"]["booking"]
    assert new["provider_id"] != "prov-ali"                                        # never the provider who cancelled
    slots = (await db.execute(select(ProviderSlot))).scalars().all()
    assert [s.booking_id for s in slots] == [new["id"]]                            # old slot released, new one held
    msgs = [n.message for n in (await db.execute(select(Notification).where(Notification.type == "rebooked"))).scalars().all()]
    assert msgs and "rebook" in msgs[0].lower()
    # cancelled booking's pending reminders are gone
    leftovers = (await db.execute(select(Notification).where(Notification.booking_id == old_booking_id, Notification.sent == False))).scalars().all()  # noqa: E712
    assert leftovers == []


async def test_provider_cancellation_with_no_alternative_tells_the_customer(db, customer, providers):
    # only one provider exists
    for p in providers[1:]:
        await db.delete(p)
    await db.commit()
    r = await book_brief(db, customer)

    out = await handle_cancellation(db, r["booking"]["id"], "provider", now=NOW, offline=True)
    assert out["rebooked"] is False
    assert (await db.execute(select(Notification).where(Notification.type == "cancelled"))).scalar_one()


async def test_customer_cancellation_just_releases_the_slot(db, customer, providers):
    r = await book_brief(db, customer)
    out = await handle_cancellation(db, r["booking"]["id"], "customer", now=NOW, offline=True)
    assert out == {"status": "cancelled", "rebooked": False}
    assert (await db.execute(select(ProviderSlot))).first() is None


async def test_cannot_cancel_twice(db, customer, providers):
    r = await book_brief(db, customer)
    await handle_cancellation(db, r["booking"]["id"], "customer", now=NOW, offline=True)
    again = await handle_cancellation(db, r["booking"]["id"], "customer", now=NOW, offline=True)
    assert again["status"] == "invalid_state"


# --- ranking math ----------------------------------------------------------------

def provider(**kw):
    base = {"distance_km": 2.0, "rating": 4.5, "total_reviews": 30, "trust_score": 0.9, "price_range": "Medium", "source": "registered"}
    return {**base, **kw}


def test_closer_and_better_rated_scores_higher():
    pref = datetime(2026, 10, 17, 5, 0)
    good = score_provider(provider(best_slot=pref), pref)
    far = score_provider(provider(distance_km=9, best_slot=pref), pref)
    meh = score_provider(provider(rating=3.0, best_slot=pref), pref)
    assert good["score"] > far["score"] and good["score"] > meh["score"]


def test_no_free_slot_zeroes_availability():
    pref = datetime(2026, 10, 17, 5, 0)
    s = score_provider(provider(best_slot=None), pref)
    assert s["breakdown"]["availability"] == 0 and "no free slot" in s["notes"]["availability"]


def test_one_perfect_review_does_not_beat_many_good_ones():
    pref = datetime(2026, 10, 17, 5, 0)
    lucky = score_provider(provider(rating=5.0, total_reviews=1, best_slot=pref), pref)
    proven = score_provider(provider(rating=4.7, total_reviews=200, best_slot=pref), pref)
    assert proven["breakdown"]["rating"] > lucky["breakdown"]["rating"]


def test_unverified_external_schedule_is_discounted():
    pref = datetime(2026, 10, 17, 5, 0)
    reg = score_provider(provider(best_slot=pref, slot_known=True), pref)
    ext = score_provider(provider(best_slot=pref, slot_known=False), pref)
    assert ext["breakdown"]["availability"] < reg["breakdown"]["availability"]

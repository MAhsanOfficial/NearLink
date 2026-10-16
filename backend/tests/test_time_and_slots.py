from datetime import datetime, timedelta

import pytest

from app_agents.slots import SlotConflict, book_slot, day_schedule, free_slots, nearest, parse_working_hours, release_slot
from app_agents.time_resolver import PKT, resolve_time, to_local
from tests.conftest import NOW  # Fri 16 Oct 2026, 12:00 PKT


def local(w, key):
    return to_local(w[key])


def test_kal_subah_is_tomorrow_morning():
    w = resolve_time("Mujhe kal subah G-13 mein AC technician chahiye", NOW)
    assert w["resolved"] and not w["is_asap"]
    assert local(w, "start_utc").day == 17 and local(w, "start_utc").hour == 9
    assert local(w, "end_utc").hour == 12
    assert local(w, "preferred_utc").hour == 10
    assert w["label"] == "Tomorrow Morning"


def test_sector_number_is_not_a_time():
    # "G-13" must not be read as 13:00
    w = resolve_time("plumber in G-13", NOW)
    assert not w["resolved"]
    assert w["is_asap"]


def test_explicit_hours():
    assert local(resolve_time("aaj shaam 5 baje", NOW), "preferred_utc").hour == 17
    assert local(resolve_time("tomorrow 3 pm", NOW), "preferred_utc").hour == 15
    assert local(resolve_time("kal 10 am", NOW), "preferred_utc").hour == 10
    assert local(resolve_time("kal 14:30", NOW), "preferred_utc").hour == 14


def test_urdu_script_and_asap():
    assert local(resolve_time("کل صبح", NOW), "start_utc").day == 17
    w = resolve_time("urgent abhi chahiye", NOW)
    assert w["is_asap"] and w["start_utc"] >= NOW


def test_part_of_day_already_passed_rolls_to_tomorrow():
    # 4 pm local: "subah" (morning) today is over
    late = datetime(2026, 10, 16, 11, 0)
    w = resolve_time("subah", late)
    assert local(w, "start_utc").day == 17


def test_asap_outside_working_hours_moves_to_next_morning():
    night = datetime(2026, 10, 16, 18, 30)  # 23:30 local
    w = resolve_time("abhi", night)
    assert local(w, "start_utc").day == 17 and local(w, "start_utc").hour == 9


def test_parse_working_hours():
    assert parse_working_hours("9 AM - 6 PM") == (9, 18)
    assert parse_working_hours("8:30 AM – 10:00 PM") == (8, 22)
    assert parse_working_hours("Open 24 hours") == (0, 24)
    assert parse_working_hours(None) == (9, 18)
    assert parse_working_hours("Monday: Closed") == (9, 18)


async def test_free_slots_respect_hours_and_bookings(db):
    w = resolve_time("kal subah", NOW)
    slots = await free_slots(db, "p1", "9 AM - 6 PM", w["start_utc"], w["end_utc"], NOW)
    assert [to_local(s).hour for s in slots] == [9, 10, 11]

    await book_slot(db, "p1", slots[1], "b1")
    again = await free_slots(db, "p1", "9 AM - 6 PM", w["start_utc"], w["end_utc"], NOW)
    assert [to_local(s).hour for s in again] == [9, 11]
    assert to_local(nearest(again, w["preferred_utc"])).hour == 9  # tie -> earlier

    # a provider who opens at noon has nothing in the morning
    assert await free_slots(db, "p1", "12 PM - 6 PM", w["start_utc"], w["end_utc"], NOW) == []


async def test_past_and_too_soon_slots_are_excluded(db):
    start = NOW
    slots = await free_slots(db, "p1", "9 AM - 6 PM", start, start + timedelta(hours=3), NOW)
    assert all(s >= NOW + timedelta(minutes=30) for s in slots)


async def test_double_booking_is_rejected_and_release_frees_it(db):
    t = datetime(2026, 10, 17, 5, 0)
    await book_slot(db, "p1", t, "b1")
    with pytest.raises(SlotConflict):
        await book_slot(db, "p1", t, "b2")
    await book_slot(db, "p2", t, "b3")  # other provider is unaffected
    assert await release_slot(db, "b1") == 1
    await book_slot(db, "p1", t, "b4")  # free again


async def test_day_schedule_marks_booked_hours(db):
    t = datetime(2026, 10, 17, 5, 0)  # 10:00 local
    await book_slot(db, "p1", t, "b1")
    sched = await day_schedule(db, "p1", "9 AM - 12 PM", t)
    assert [(s["time"], s["status"]) for s in sched] == [("9:00 AM", "free"), ("10:00 AM", "booked"), ("11:00 AM", "free")]

"""NearLink orchestrator: one planner, many tools.

A request ("kal subah G-13 mein AC technician chahiye") flows through tools that each do one thing and
report a trace event: parse -> search -> check availability -> rank -> book -> schedule follow-ups.

Two planners drive the *same* tools:
  * "llm"    - Gemini (OpenAI Agents SDK) decides which tool to call next and with what arguments.
  * "policy" - a deterministic fallback that applies the same rules in a fixed order. It also takes over
               if the LLM crashes or stops without reaching an outcome, so a booking never depends on the LLM.

Autonomy lives in the tools' guard rails + the policy: widen the search radius when nobody is close, widen the
time window when nobody is free, switch provider when the closest is busy, recover from slot conflicts, and ask
for clarification instead of guessing.
"""
import asyncio
import json
import os
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable, Dict, List, Optional

from agents import Agent, Runner, RunContextWrapper, function_tool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import AgentTrace, ExternalProvider, ServiceRequest, User
from . import gemini_model
from .booking_agent import create_booking, ensure_registered_provider
from .intent_agent import parse_intent
from .intent_agent_fallback import parse_intent_fallback
from .messages import msg, norm_lang
from .osm_search_agent import geocode_location
from .provider_agent import discover_providers
from .ranking_agent import rank_with_breakdown
from .slots import SlotConflict, day_schedule, free_slots, nearest
from .time_resolver import PKT, fmt_local, resolve_time, to_local

RADIUS_STEPS = (3.0, 8.0, 15.0, 25.0)
UNKNOWN_SERVICE = {"", "general service", "unknown", "none", "n/a"}
UNKNOWN_LOCATION = {"", "unknown", "none", "n/a"}
MAX_CANDIDATES_CHECKED = 10
MAX_BOOK_ATTEMPTS = 4
MIN_OPTIONS = 3  # keep widening (up to ALTERNATIVES_MAX_RADIUS) until the user has alternatives
ALTERNATIVES_MAX_RADIUS = 15.0

Emit = Callable[[dict], Awaitable[None]]


def _safe(obj: Any) -> Any:
    """Make anything JSON-serialisable (datetimes, sets, ORM leftovers)."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {str(k): _safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_safe(v) for v in obj]
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    return str(obj)


@dataclass
class OrchestrationContext:
    db: AsyncSession
    user: Optional[User]
    raw_text: str
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    lat: Optional[float] = None
    lng: Optional[float] = None
    now: datetime = field(default_factory=datetime.utcnow)
    emit: Optional[Emit] = None
    offline: bool = False  # no network LLM calls (tests / outages)
    channel: str = "web"
    exclude_ids: set = field(default_factory=set)
    forced_window: Optional[dict] = None
    preset_intent: Optional[dict] = None
    planner: str = "policy"
    language: str = "english"
    state: Dict[str, Any] = field(default_factory=dict)
    events: List[dict] = field(default_factory=list)
    decisions: List[str] = field(default_factory=list)
    seq: int = 0

    async def step(self, type_: str, agent: str, tool: Optional[str] = None, input: Any = None,
                   output: Any = None, reasoning: Optional[str] = None, duration_ms: int = 0) -> dict:
        self.seq += 1
        event = {
            "seq": self.seq, "type": type_, "agent": agent, "tool": tool,
            "input": _safe(input), "output": _safe(output), "reasoning": reasoning,
            "duration_ms": duration_ms, "ts": datetime.utcnow().isoformat() + "Z",
        }
        self.db.add(AgentTrace(
            id=str(uuid.uuid4()), request_id=self.request_id, agent_name=agent, action=tool or type_,
            input_data=event["input"], output_data=event["output"], reasoning=reasoning,
            duration_ms=duration_ms, created_at=datetime.utcnow(),
        ))
        self.events.append(event)
        if type_ == "decision" and reasoning:
            self.decisions.append(reasoning)
        if self.emit:
            await self.emit(event)
        return event


def _ms(t0: float) -> int:
    return int((time.time() - t0) * 1000)


# ----------------------------------------------------------------------------- public serialisation

def _pub(o: dict) -> dict:
    slots = o.get("free_slots") or []
    return _safe({
        "key": o.get("key"), "id": o.get("id"), "name": o.get("name"), "service_type": o.get("service_type"),
        "area": o.get("area"), "address": o.get("address"), "phone": o.get("phone"),
        "latitude": o.get("latitude"), "longitude": o.get("longitude"),
        "distance_km": o.get("distance_km"), "rating": o.get("rating"), "total_reviews": o.get("total_reviews"),
        "source": o.get("source"), "source_label": o.get("source_label"), "price_range": o.get("price_range"),
        "rank": o.get("rank"), "score": o.get("score"), "score_breakdown": o.get("score_breakdown"),
        "score_notes": o.get("score_notes"), "reasoning": o.get("reasoning"),
        "best_slot": o.get("best_slot"), "slot_label": o.get("slot_label"),
        "slot_known": o.get("slot_known"),
        "free_slots": [{"iso": s, "label": fmt_local(s)} for s in slots[:6]],
    })


# ----------------------------------------------------------------------------- tools

async def tool_parse_request(ctx: OrchestrationContext) -> dict:
    t0 = time.time()
    if ctx.preset_intent:
        parsed, source = dict(ctx.preset_intent), "preset"
    elif ctx.offline or not os.getenv("GEMINI_API_KEY"):
        parsed, source = parse_intent_fallback(ctx.raw_text)["parsed"], "keyword_fallback"
    else:
        res = await parse_intent(ctx.raw_text)
        parsed, source = res["parsed"], ("keyword_fallback" if res.get("fallback") else "gemini")

    parsed.setdefault("service_type", "General Service")
    parsed.setdefault("location", "Unknown")
    parsed.setdefault("time", "ASAP")
    parsed.setdefault("urgency", "medium")
    ctx.language = norm_lang(parsed.get("language_detected"))
    parsed["language_detected"] = ctx.language

    if ctx.user and ctx.lat is None and ctx.user.latitude is not None and ctx.user.longitude is not None \
            and str(parsed["location"]).lower() in UNKNOWN_LOCATION:
        ctx.lat, ctx.lng = ctx.user.latitude, ctx.user.longitude
        parsed["location"] = ctx.user.area or "Saved location"
    if str(parsed["location"]).lower() in UNKNOWN_LOCATION and ctx.lat is not None:
        parsed["location"] = "Current location"

    if ctx.forced_window:
        window = ctx.forced_window
    else:
        window = resolve_time(ctx.raw_text, ctx.now)
        if not window["resolved"]:
            window = resolve_time(parsed.get("time"), ctx.now)

    question = None
    if str(parsed["service_type"]).lower() in UNKNOWN_SERVICE:
        question = msg("ask_service", ctx.language)
    elif str(parsed["location"]).lower() in UNKNOWN_LOCATION:
        question = msg("ask_location", ctx.language, service=parsed["service_type"])

    existing = (await ctx.db.execute(select(ServiceRequest).where(ServiceRequest.id == ctx.request_id))).scalar_one_or_none()
    if not existing:
        ctx.db.add(ServiceRequest(
            id=ctx.request_id, user_id=ctx.user.id if ctx.user else None, raw_text=ctx.raw_text,
            service_type=parsed["service_type"], location=parsed["location"], time=window["label"],
            urgency=parsed["urgency"], language_detected=ctx.language,
            status="needs_clarification" if question else "parsed", created_at=ctx.now,
        ))
        await ctx.db.flush()

    ctx.state.update(intent=parsed, window=window, question=question)
    out = {
        "service_type": parsed["service_type"], "location": parsed["location"], "language": ctx.language,
        "urgency": parsed["urgency"], "time_label": window["label"], "time_window": window["display"],
        "parsed_by": source, "needs_clarification": question,
    }
    await ctx.step("tool_result", "IntentAgent", "parse_request", {"text": ctx.raw_text}, out,
                   f"Understood a {ctx.language} request for {parsed['service_type']} in {parsed['location']}, "
                   f"time resolved to {window['display']} ({window['label']}).", _ms(t0))
    if question:
        ctx.state["outcome"] = "clarify"
        await ctx.step("clarification", "OrchestratorAgent", "ask_user", {}, {"question": question},
                       "A required detail is missing; asking instead of guessing.")
    return out


async def _canonicalise_external_ids(ctx: OrchestrationContext, pool: List[dict]) -> None:
    """Search results key live businesses by place_id; the DB cache keys them by its own uuid. Unify on the cache id."""
    for p in pool:
        if p.get("source") == "registered":
            continue
        row = (await ctx.db.execute(select(ExternalProvider).where(
            (ExternalProvider.id == p["id"]) | (ExternalProvider.osm_id == p["id"])))).scalars().first()
        if row:
            p["external_ref"], p["id"] = p["id"], row.id


async def tool_search_providers(ctx: OrchestrationContext, radius_km: float) -> dict:
    t0 = time.time()
    intent = ctx.state.get("intent")
    if not intent:
        return {"error": "call parse_request first"}
    radius_km = max(1.0, min(float(radius_km), 25.0))

    if "pool" not in ctx.state:
        if ctx.lat is None and not ctx.offline:
            # Resolve the position once, here, so it can be recorded in the trace and reused by later rebooking
            try:
                geo = await asyncio.wait_for(asyncio.to_thread(geocode_location, intent["location"]), 8)
                if geo:
                    ctx.lat, ctx.lng = geo["latitude"], geo["longitude"]
            except Exception as e:
                print(f"Geocoding failed in orchestrator: {e}")
        res = await discover_providers(ctx.db, intent["service_type"], intent["location"], ctx.lat, ctx.lng)
        pool = list(res.get("providers", []))
        await _canonicalise_external_ids(ctx, pool)
        ctx.state["pool"] = [p for p in pool if p["id"] not in ctx.exclude_ids]
        ctx.state["discovery_ms"] = res.get("duration_ms", 0)

    cands = []
    for p in ctx.state["pool"]:
        d = p.get("distance_km")
        if (d is not None and d <= radius_km) or (d is None and p.get("source") == "registered"):
            cands.append(p)
    cands.sort(key=lambda p: p.get("distance_km") if p.get("distance_km") is not None else 999)
    for i, p in enumerate(cands):
        p["key"] = f"p{i + 1}"
    ctx.state.update(candidates=cands, radius=radius_km)

    out = {
        "radius_km": radius_km, "found": len(cands), "pool_size": len(ctx.state["pool"]),
        "coordinates": {"latitude": ctx.lat, "longitude": ctx.lng} if ctx.lat is not None else None,
        "providers": [{"key": p["key"], "name": p["name"], "distance_km": p.get("distance_km"),
                       "rating": p.get("rating"), "source": p.get("source")} for p in cands[:8]],
    }
    await ctx.step("tool_result", "DiscoveryAgent", "search_providers", {"radius_km": radius_km}, out,
                   f"{len(cands)} providers within {radius_km:g} km "
                   f"(registered DB + Google Places/OSM; {len(ctx.state['pool'])} candidates fetched).", _ms(t0))
    return out


def _window_for(ctx: OrchestrationContext, mode: str):
    w = ctx.state["window"]
    pref = w["preferred_utc"]
    if mode == "requested":
        return w["start_utc"], w["end_utc"], pref
    local = to_local(pref).replace(minute=0, second=0, microsecond=0)
    if mode == "next_day":
        local += timedelta(days=1)
        pref = pref + timedelta(days=1)
    return local.replace(hour=9) - PKT, local.replace(hour=20) - PKT, pref


async def tool_check_availability(ctx: OrchestrationContext, mode: str = "requested") -> dict:
    t0 = time.time()
    if not ctx.state.get("candidates"):
        return {"error": "no candidates: call search_providers first (try a larger radius)"}
    if mode not in ("requested", "full_day", "next_day"):
        mode = "requested"
    start, end, pref = _window_for(ctx, mode)

    summary = []
    for p in ctx.state["candidates"][:MAX_CANDIDATES_CHECKED]:
        slots = await free_slots(ctx.db, p["id"], p.get("working_hours"), start, end, ctx.now)
        p["free_slots"] = slots
        p["best_slot"] = nearest(slots, pref)
        p["slot_label"] = fmt_local(p["best_slot"]) if p["best_slot"] else None
        p["slot_known"] = p.get("source") == "registered"
        summary.append({"key": p["key"], "name": p["name"], "free_slots": len(slots), "best_slot": p["slot_label"]})
    for p in ctx.state["candidates"][MAX_CANDIDATES_CHECKED:]:
        p["free_slots"], p["best_slot"], p["slot_label"] = [], None, None

    ctx.state.update(avail_mode=mode, preferred_used=pref, window_used=(start, end))
    n_free = sum(1 for s in summary if s["free_slots"])
    out = {"window_mode": mode, "from": fmt_local(start), "to": fmt_local(end), "providers_with_slots": n_free,
           "checked": len(summary), "results": summary}
    await ctx.step("tool_result", "AvailabilityAgent", "check_availability", {"window": mode}, out,
                   f"{n_free}/{len(summary)} providers have a free hour between {fmt_local(start)} and {fmt_local(end)} "
                   "(working hours minus existing bookings).", _ms(t0))
    return out


async def tool_rank(ctx: OrchestrationContext) -> dict:
    t0 = time.time()
    cands = ctx.state.get("candidates") or []
    if not cands or "preferred_used" not in ctx.state:
        return {"error": "search and check availability first"}
    intent = ctx.state["intent"]
    ranking = await rank_with_breakdown(
        cands, intent["service_type"], intent["location"], ctx.state["preferred_used"],
        ctx.language, explain=not ctx.offline and bool(os.getenv("GEMINI_API_KEY")),
    )
    by_id = {p["id"]: p for p in cands}
    options = []
    for r in ranking["ranked_providers"]:
        p = by_id.get(r["provider_id"])
        if p:
            options.append({**p, "rank": r["rank"], "score": r["score"], "score_breakdown": r["score_breakdown"],
                            "score_notes": r["score_notes"], "reasoning": r["reasoning"]})
    ctx.state.update(options=options, recommendation=ranking["recommendation"])
    out = {"explained_by": ranking["explained_by"], "recommendation": ranking["recommendation"],
           "ranking": [{"key": o["key"], "name": o["name"], "score": o["score"], "breakdown": o["score_breakdown"],
                        "slot": o.get("slot_label"), "why": o["reasoning"]} for o in options[:5]]}
    await ctx.step("tool_result", "RankingAgent", "rank_candidates", {"candidates": len(cands)}, out,
                   "Scored every candidate on distance, rating, availability fit, trust and price. "
                   f"Explanations written by {ranking['explained_by']}.", _ms(t0))
    return out


async def tool_book(ctx: OrchestrationContext, option: dict, slot) -> dict:
    t0 = time.time()
    intent = ctx.state["intent"]
    if not ctx.user:
        ctx.state.update(outcome="needs_login", chosen=option, chosen_slot=slot)
        out = {"status": "needs_login", "provider": option["name"], "slot": fmt_local(slot)}
        await ctx.step("tool_result", "BookingAgent", "book_slot", {"option": option["key"], "slot": slot}, out,
                       "Best option selected but the user is not signed in, so nothing was booked.", _ms(t0))
        return out

    provider = await ensure_registered_provider(ctx.db, option["id"], snapshot=option)
    if not provider:
        return {"status": "error", "error": "provider could not be registered"}
    before = await day_schedule(ctx.db, provider.id, provider.working_hours or option.get("working_hours"), slot)
    try:
        result = await create_booking(
            ctx.db, ctx.request_id, ctx.user.id, provider.id, provider.name, intent["service_type"],
            notes=ctx.raw_text[:200], price=provider.price_range or "", scheduled_at=slot,
            language=ctx.language, now=ctx.now,
        )
    except SlotConflict as e:
        option["free_slots"] = [s for s in option.get("free_slots", []) if s != slot]
        option["best_slot"] = nearest(option["free_slots"], ctx.state["preferred_used"])
        option["slot_label"] = fmt_local(option["best_slot"]) if option["best_slot"] else None
        out = {"status": "conflict", "provider": option["name"], "slot": fmt_local(slot)}
        await ctx.step("tool_result", "BookingAgent", "book_slot", {"option": option["key"], "slot": slot}, out,
                       f"Slot was taken meanwhile ({e}); recovering with another slot/provider.", _ms(t0))
        return out

    after = await day_schedule(ctx.db, provider.id, provider.working_hours or option.get("working_hours"), slot)
    req = (await ctx.db.execute(select(ServiceRequest).where(ServiceRequest.id == ctx.request_id))).scalar_one_or_none()
    if req:
        req.status = "booked"
        await ctx.db.commit()

    ctx.state.update(outcome="booked", chosen=option, chosen_slot=slot, booking=result["booking"],
                     notifications=result["notifications"], schedule_before=before, schedule_after=after)
    out = {"status": "booked", "booking_id": result["booking"]["id"], "provider": provider.name, "slot": fmt_local(slot)}
    await ctx.step("tool_result", "BookingAgent", "book_slot", {"option": option["key"], "slot": slot}, out,
                   f"Reserved {fmt_local(slot)} with {provider.name}; booking {result['booking']['id'][:8]} confirmed.", _ms(t0))
    await ctx.step("tool_result", "FollowUpAgent", "schedule_followups", {"booking_id": result["booking"]["id"]},
                   {"notifications": result["notifications"]},
                   "Queued confirmation, provider-assigned notice, a reminder 1 hour before the visit and a "
                   "completion/rating check-in after it.")
    return out


# ----------------------------------------------------------------------------- deterministic planner

def _pick_best(ctx: OrchestrationContext) -> Optional[dict]:
    for o in ctx.state.get("options", []):
        if o.get("best_slot"):
            return o
    return None


async def _explain_choice(ctx: OrchestrationContext, chosen: dict) -> None:
    options = ctx.state["options"]
    with_d = [o for o in options if o.get("distance_km") is not None]
    closest = min(with_d, key=lambda o: o["distance_km"]) if with_d else None
    pref = ctx.state["preferred_used"]
    if closest and closest["id"] != chosen["id"]:
        if not closest.get("best_slot"):
            why = f"Closest provider {closest['name']} ({closest['distance_km']} km) has no free slot in the requested window, so I chose {chosen['name']} instead."
        else:
            why = (f"{chosen['name']} scores {chosen['score']} vs {closest['score']} for the closest provider "
                   f"{closest['name']} ({closest['distance_km']} km): " + chosen["reasoning"])
        await ctx.step("decision", "OrchestratorAgent", "choose_provider", {"chosen": chosen["key"]}, {"chosen": chosen["name"]}, why)
    gap = abs((chosen["best_slot"] - pref).total_seconds()) / 3600
    if gap >= 1:
        await ctx.step("decision", "OrchestratorAgent", "adjust_time", {"preferred": pref}, {"slot": chosen["best_slot"]},
                       f"{chosen['name']} is not free at {fmt_local(pref)}; the nearest free hour is {fmt_local(chosen['best_slot'])}.")


async def _book_best(ctx: OrchestrationContext) -> None:
    for _ in range(MAX_BOOK_ATTEMPTS):
        chosen = _pick_best(ctx)
        if not chosen:
            break
        if not ctx.state.get("explained"):
            await _explain_choice(ctx, chosen)
            ctx.state["explained"] = True
        res = await tool_book(ctx, chosen, chosen["best_slot"])
        if res.get("status") in ("booked", "needs_login", "error"):
            return
    ctx.state["outcome"] = "no_match"


async def run_policy(ctx: OrchestrationContext) -> None:
    """Deterministic planner. Idempotent: resumes from whatever the state already holds."""
    if "intent" not in ctx.state:
        await tool_parse_request(ctx)
    if ctx.state.get("outcome"):
        return

    # 1. find candidates: widen the radius until someone is found, and (up to 15 km) until there are alternatives
    if not ctx.state.get("candidates"):
        for i, radius in enumerate(RADIUS_STEPS):
            found = (await tool_search_providers(ctx, radius)).get("found", 0)
            last = i + 1 == len(RADIUS_STEPS)
            if last or found >= MIN_OPTIONS or (found and radius >= ALTERNATIVES_MAX_RADIUS):
                break
            nxt = RADIUS_STEPS[i + 1]
            why = (f"Nobody within {radius:g} km; widening to {nxt:g} km." if not found
                   else f"Only {found} provider(s) within {radius:g} km; widening to {nxt:g} km to offer alternatives.")
            await ctx.step("decision", "OrchestratorAgent", "widen_radius", {"from_km": radius}, {"to_km": nxt}, why)
        if not ctx.state.get("candidates"):
            ctx.state["outcome"] = "no_match"
            return

    # 2. find availability, widening the time window until someone is free
    if "avail_mode" not in ctx.state:
        for i, mode in enumerate(("requested", "full_day", "next_day")):
            await tool_check_availability(ctx, mode)
            if any(p.get("best_slot") for p in ctx.state["candidates"]):
                break
            if i < 2:
                nxt = ("full_day", "next_day")[i]
                await ctx.step("decision", "OrchestratorAgent", "widen_time_window", {"from": mode}, {"to": nxt},
                               "Nobody is free in the requested window; " +
                               ("trying the whole day." if nxt == "full_day" else "trying the next day."))
        if not any(p.get("best_slot") for p in ctx.state["candidates"]):
            ctx.state["outcome"] = "no_match"
            return

    # 3. rank, 4. book (with conflict recovery)
    if not ctx.state.get("options"):
        await tool_rank(ctx)
    await _book_best(ctx)


# ----------------------------------------------------------------------------- LLM planner (tool-calling)

def _llm_json(obj: Any) -> str:
    return json.dumps(_safe(obj), ensure_ascii=False)


@function_tool(strict_mode=False)
async def parse_request(wrapper: RunContextWrapper[OrchestrationContext]) -> str:
    """Parse the user's message into service type, location, resolved time window and language. ALWAYS call this first."""
    return _llm_json(await tool_parse_request(wrapper.context))


@function_tool(strict_mode=False)
async def search_providers(wrapper: RunContextWrapper[OrchestrationContext], radius_km: float) -> str:
    """Find providers within radius_km (1-25) of the user. If it returns 0, call again with a larger radius (3, 8, 15, 25)."""
    ctx = wrapper.context
    if "intent" not in ctx.state:
        return _llm_json({"error": "call parse_request first"})
    return _llm_json(await tool_search_providers(ctx, radius_km))


@function_tool(strict_mode=False)
async def check_availability(wrapper: RunContextWrapper[OrchestrationContext], window: str) -> str:
    """Check which candidates have a free hour. window is 'requested' (the user's time), 'full_day' (whole working day)
    or 'next_day'. If nobody is free, retry with the next wider window."""
    return _llm_json(await tool_check_availability(wrapper.context, window))


@function_tool(strict_mode=False)
async def rank_candidates(wrapper: RunContextWrapper[OrchestrationContext]) -> str:
    """Score and rank the candidates (distance, rating, availability, trust, price). Call after check_availability."""
    return _llm_json(await tool_rank(wrapper.context))


@function_tool(strict_mode=False)
async def book_appointment(wrapper: RunContextWrapper[OrchestrationContext], option_key: str, slot_index: int) -> str:
    """Book the chosen provider. option_key is a key such as 'p2' from rank_candidates; slot_index is the 0-based index
    into that provider's free slots (0 = the slot closest to the requested time). Only book providers that have a slot."""
    ctx = wrapper.context
    option = next((o for o in ctx.state.get("options", []) if o["key"] == option_key), None)
    if not option or not option.get("free_slots"):
        return _llm_json({"error": f"{option_key} is not a ranked provider with free slots"})
    slots = sorted(option["free_slots"], key=lambda s: abs((s - ctx.state["preferred_used"]).total_seconds()))
    if not 0 <= slot_index < len(slots):
        return _llm_json({"error": "slot_index out of range", "available": len(slots)})
    if not ctx.state.get("explained"):
        await _explain_choice(ctx, option)
        ctx.state["explained"] = True
    return _llm_json(await tool_book(ctx, option, slots[slot_index]))


@function_tool(strict_mode=False)
async def ask_user(wrapper: RunContextWrapper[OrchestrationContext], question: str) -> str:
    """Ask the user ONE clarifying question when a detail you cannot infer is missing. Ends the run until they answer."""
    ctx = wrapper.context
    ctx.state.update(outcome="clarify", question=question)
    await ctx.step("clarification", "OrchestratorAgent", "ask_user", {}, {"question": question}, "Asked the user instead of guessing.")
    return _llm_json({"status": "waiting_for_user"})


PLANNER_INSTRUCTIONS = """You are NearLink's orchestrator for booking local service providers in Pakistan.
Users write Urdu, Roman Urdu or English. Work autonomously with the tools; do not ask the user anything you can infer.

Procedure:
1. parse_request (always first). If it reports needs_clarification, stop: the question was already sent.
2. search_providers(radius_km=3). If found == 0, retry with 8, then 15, then 25.
3. check_availability('requested'). If providers_with_slots == 0, try 'full_day', then 'next_day'.
4. rank_candidates.
5. book_appointment for the best-ranked provider that has a free slot (slot_index 0 is closest to the requested time).
   If it returns status 'conflict', book the next best option. If 'needs_login', stop - the user must sign in.
6. Finish with one or two sentences in the user's language.
Never invent option keys; only use keys returned by the tools."""


async def _run_llm(ctx: OrchestrationContext) -> None:
    agent = Agent[OrchestrationContext](
        name="OrchestratorAgent", instructions=PLANNER_INSTRUCTIONS, model=gemini_model,
        tools=[parse_request, search_providers, check_availability, rank_candidates, book_appointment, ask_user],
    )
    result = await Runner.run(agent, input=ctx.raw_text, context=ctx, max_turns=16)
    await ctx.step("agent_message", "OrchestratorAgent", None, None, {"text": str(result.final_output)[:500]},
                   "Planner finished.")


# ----------------------------------------------------------------------------- entry point

async def run_orchestration(
    db: AsyncSession, user: Optional[User], text: str, *, lat: Optional[float] = None, lng: Optional[float] = None,
    previous_request_id: Optional[str] = None, mode: Optional[str] = None, emit: Optional[Emit] = None,
    now: Optional[datetime] = None, offline: bool = False, exclude_ids: Optional[set] = None,
    forced_window: Optional[dict] = None, preset_intent: Optional[dict] = None, channel: str = "web",
    request_id: Optional[str] = None,
) -> dict:
    text = (text or "").strip()
    if previous_request_id:
        prev = (await db.execute(select(ServiceRequest).where(ServiceRequest.id == previous_request_id))).scalar_one_or_none()
        if prev and prev.status == "needs_clarification" and (not user or prev.user_id in (None, user.id)):
            text = f"{prev.raw_text} {text}".strip()
            prev.status = "merged"

    ctx = OrchestrationContext(
        db=db, user=user, raw_text=text, lat=lat, lng=lng, emit=emit, offline=offline, channel=channel,
        exclude_ids=set(exclude_ids or ()), forced_window=forced_window, preset_intent=preset_intent,
    )
    if request_id:
        ctx.request_id = request_id
    if now:
        ctx.now = now

    wanted = mode or os.getenv("ORCHESTRATOR_MODE") or "llm"
    ctx.planner = "llm" if wanted == "llm" and not offline and os.getenv("GEMINI_API_KEY") else "policy"
    await ctx.step("plan", "OrchestratorAgent", None, {"text": text, "channel": channel},
                   {"planner": ctx.planner, "steps": ["parse_request", "search_providers", "check_availability",
                                                      "rank_candidates", "book_appointment", "schedule_followups"]},
                   ("Gemini decides the next tool call at each step." if ctx.planner == "llm"
                    else "Deterministic policy runs the tools in order and adapts to what they return."))

    try:
        if ctx.planner == "llm":
            try:
                await _run_llm(ctx)
            except Exception as e:  # LLM outage / malformed tool call -> never leave the user without an answer
                await ctx.step("fallback", "OrchestratorAgent", "planner_fallback", {"error": str(e)[:300]}, None,
                               "LLM planner failed; the deterministic policy takes over from the current state.")
            if not ctx.state.get("outcome") and ctx.planner == "llm":
                await ctx.step("fallback", "OrchestratorAgent", "policy_takeover", None, None,
                               "LLM stopped without reaching an outcome; policy completes the run.")
        if not ctx.state.get("outcome"):
            await run_policy(ctx)
    except Exception as e:
        ctx.state["outcome"] = "error"
        ctx.state["error"] = str(e)
        await ctx.step("error", "OrchestratorAgent", None, None, {"error": str(e)[:500]}, f"Run failed: {e}")
        try:
            await db.rollback()
        except Exception:
            pass

    result = build_result(ctx)
    await ctx.step("final", "OrchestratorAgent", None, None, {k: result[k] for k in ("status", "reply_text")},
                   f"Outcome: {result['status']}.")
    try:
        await db.commit()
    except Exception:
        await db.rollback()
    result["events"] = ctx.events
    return result


def build_result(ctx: OrchestrationContext) -> dict:
    s = ctx.state
    status = s.get("outcome") or "no_match"
    chosen = s.get("chosen")
    options = [_pub(o) for o in s.get("options", [])[:3]]
    result = {
        "status": status, "request_id": ctx.request_id, "planner": ctx.planner, "language": ctx.language,
        "intent": s.get("intent"),
        "window": _safe({"label": s["window"]["label"], "display": s["window"]["display"]}) if s.get("window") else None,
        "question": s.get("question"), "booking": s.get("booking"), "provider": _pub(chosen) if chosen else None,
        "scheduled_at": _safe(s.get("chosen_slot")), "options": options,
        "schedule_before": s.get("schedule_before"), "schedule_after": s.get("schedule_after"),
        "notifications": s.get("notifications"), "decisions": ctx.decisions, "error": s.get("error"),
    }
    result["reply_text"] = compose_reply(result)
    return result


def compose_reply(result: dict) -> str:
    lang = result.get("language") or "english"
    intent = result.get("intent") or {}
    service = intent.get("service_type", "service")
    status = result["status"]
    p = result.get("provider")
    if status == "clarify":
        return result.get("question") or msg("ask_service", lang)
    if status in ("booked", "needs_login") and p:
        when = fmt_local(datetime.fromisoformat(result["scheduled_at"])) if result.get("scheduled_at") else ""
        dist = f"{p['distance_km']} km" if p.get("distance_km") is not None else "?"
        if status == "booked":
            return msg("reply_booked", lang, provider=p["name"], distance=dist, service=service, when=when,
                       phone=p.get("phone") or "N/A", reason=p.get("reasoning") or "")
        return msg("reply_login", lang, provider=p["name"], distance=dist, when=when)
    if status == "error":
        return "Something went wrong while processing your request. Please try again."
    return msg("reply_none", lang, service=service, location=intent.get("location", ""))

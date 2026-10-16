"""Exercises the real OpenAI-Agents-SDK tool-calling loop against a scripted fake chat-completions endpoint.

No network and no API key: it verifies tool schemas, context passing, guard rails and the fallbacks when the
LLM misbehaves. (Live Gemini quality is a separate, manual check.)
"""
import json

import httpx
import pytest
from openai import AsyncOpenAI
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel
from sqlalchemy import select

from app_agents import orchestrator
from models import Booking
from tests.conftest import G13, NOW

BRIEF = "Mujhe kal subah G-13 mein AC technician chahiye"


def completion(content=None, tool=None):
    message = {"role": "assistant", "content": content}
    if tool:
        name, args = tool
        message["tool_calls"] = [{"id": f"call_{name}", "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}]
    return {
        "id": "chatcmpl-fake", "object": "chat.completion", "created": 0, "model": "fake",
        "choices": [{"index": 0, "finish_reason": "tool_calls" if tool else "stop", "message": message}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    }


def install_fake_llm(monkeypatch, script):
    """script(tool_messages_so_far) -> completion dict, or an int to return as HTTP error."""
    requests_seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        requests_seen.append(body)
        tool_msgs = [m for m in body["messages"] if m["role"] == "tool"]
        out = script(tool_msgs)
        if isinstance(out, int):
            return httpx.Response(out, json={"error": {"message": "boom"}})
        return httpx.Response(200, json=out)

    client = AsyncOpenAI(api_key="x", base_url="http://fake/v1", http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)), max_retries=0)
    monkeypatch.setattr(orchestrator, "gemini_model", OpenAIChatCompletionsModel(model="fake", openai_client=client))
    monkeypatch.setenv("GEMINI_API_KEY", "fake")  # selects the llm planner (calls go to the mock transport)
    return requests_seen


async def run_llm(db, user, **kw):
    return await orchestrator.run_orchestration(db, user, BRIEF, lat=G13[0], lng=G13[1], now=NOW, mode="llm", **kw)


@pytest.fixture(autouse=True)
def llm_intent_is_offline(monkeypatch):
    # parse_request would otherwise call parse_intent() -> the real Gemini agent. Use the keyword parser.
    async def parse(text):
        from app_agents.intent_agent_fallback import parse_intent_fallback
        return parse_intent_fallback(text)

    monkeypatch.setattr(orchestrator, "parse_intent", parse)


def scripted_happy_path(tool_msgs):
    steps = [
        ("parse_request", {}),
        ("search_providers", {"radius_km": 8}),
        ("check_availability", {"window": "requested"}),
        ("rank_candidates", {}),
        ("book_appointment", {"option_key": "p1", "slot_index": 0}),
    ]
    n = len(tool_msgs)
    return completion(tool=steps[n]) if n < len(steps) else completion(content="Booked, shukriya!")


async def test_llm_drives_the_tools_to_a_booking(db, customer, providers, monkeypatch):
    seen = install_fake_llm(monkeypatch, scripted_happy_path)
    r = await run_llm(db, customer)

    assert r["planner"] == "llm" and r["status"] == "booked"
    assert r["provider"]["name"] == "Ali AC Services"
    assert (await db.execute(select(Booking))).scalar_one().status == "confirmed"
    assert not any(e["tool"] in ("planner_fallback", "policy_takeover") for e in r["events"])  # no fallback needed

    # the tool schemas reached the model with the arguments we expect
    tools = {t["function"]["name"]: t["function"]["parameters"] for t in seen[0]["tools"]}
    assert set(tools) == {"parse_request", "search_providers", "check_availability", "rank_candidates", "book_appointment", "ask_user"}
    assert "radius_km" in tools["search_providers"]["properties"]
    assert set(tools["book_appointment"]["properties"]) == {"option_key", "slot_index"}


async def test_llm_can_ask_a_clarifying_question(db, customer, providers, monkeypatch):
    install_fake_llm(monkeypatch, lambda t: completion(tool=("ask_user", {"question": "Repair or gas refill?"})) if not t else completion(content="ok"))
    r = await run_llm(db, customer)
    assert r["status"] == "clarify" and r["question"] == "Repair or gas refill?"
    assert (await db.execute(select(Booking))).first() is None


async def test_llm_cannot_book_a_provider_that_was_never_offered(db, customer, providers, monkeypatch):
    def script(tool_msgs):
        seq = [("parse_request", {}), ("search_providers", {"radius_km": 8}), ("check_availability", {"window": "requested"}),
               ("rank_candidates", {}), ("book_appointment", {"option_key": "p99", "slot_index": 0})]
        n = len(tool_msgs)
        return completion(tool=seq[n]) if n < len(seq) else completion(content="done")

    install_fake_llm(monkeypatch, script)
    r = await run_llm(db, customer)
    # the hallucinated key was rejected by the tool, so the policy finished the job properly
    assert r["status"] == "booked" and r["provider"]["name"] == "Ali AC Services"
    assert any(e["tool"] == "policy_takeover" for e in r["events"])


async def test_llm_outage_falls_back_to_policy(db, customer, providers, monkeypatch):
    install_fake_llm(monkeypatch, lambda t: 500)
    r = await run_llm(db, customer)
    assert r["status"] == "booked"
    assert any(e["tool"] == "planner_fallback" for e in r["events"])


async def test_llm_that_stops_early_is_completed_by_policy(db, customer, providers, monkeypatch):
    install_fake_llm(monkeypatch, lambda t: completion(content="Sure, I'll look into it!"))
    r = await run_llm(db, customer)
    assert r["status"] == "booked"
    assert any(e["tool"] == "policy_takeover" for e in r["events"])

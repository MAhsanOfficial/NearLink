"""Agentic entry point: natural-language request in, booked appointment out, with a live decision trace."""
import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app_agents.orchestrator import run_orchestration
from database import async_session, get_db
from models import AgentTrace, User
from routes.auth import get_optional_user

router = APIRouter(prefix="/api/orchestrator", tags=["orchestrator"])


class RunRequest(BaseModel):
    text: str = Field(min_length=2, max_length=1000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    previous_request_id: Optional[str] = None  # answer to a clarification question
    mode: Optional[str] = None  # "llm" | "policy"


@router.post("/run")
async def run(req: RunRequest, user: Optional[User] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    """Run the whole workflow and return the final result (with every trace event)."""
    return await run_orchestration(
        db, user, req.text, lat=req.latitude, lng=req.longitude,
        previous_request_id=req.previous_request_id, mode=req.mode,
    )


@router.post("/stream")
async def stream(req: RunRequest, user: Optional[User] = Depends(get_optional_user)):
    """Same as /run but Server-Sent Events: one `event: step` per agent action, then `event: result`.

    Uses its own DB session because FastAPI may close request-scoped dependencies before a stream finishes.
    """
    user_id = user.id if user else None
    queue: asyncio.Queue = asyncio.Queue()

    async def worker():
        try:
            async with async_session() as db:
                u = await db.get(User, user_id) if user_id else None

                async def emit(event: dict):
                    await queue.put(("step", event))

                result = await run_orchestration(
                    db, u, req.text, lat=req.latitude, lng=req.longitude,
                    previous_request_id=req.previous_request_id, mode=req.mode, emit=emit,
                )
                result.pop("events", None)  # already streamed
                await queue.put(("result", result))
        except Exception as e:  # never leave the client hanging
            await queue.put(("error", {"detail": str(e)}))
        finally:
            await queue.put(None)

    async def gen():
        task = asyncio.create_task(worker())
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                name, payload = item
                yield f"event: {name}\ndata: {json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/runs/{request_id}")
async def replay(request_id: str, db: AsyncSession = Depends(get_db)):
    """Stored trace of a past run (for the admin trace viewer / audit)."""
    rows = (await db.execute(
        select(AgentTrace).where(AgentTrace.request_id == request_id).order_by(AgentTrace.created_at.asc())
    )).scalars().all()
    return [
        {"agent": t.agent_name, "tool": t.action, "input": t.input_data, "output": t.output_data,
         "reasoning": t.reasoning, "duration_ms": t.duration_ms, "ts": str(t.created_at)}
        for t in rows
    ]

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import AgentTrace

router = APIRouter(prefix="/api/traces", tags=["traces"])


@router.get("/")
async def get_all_traces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentTrace).order_by(AgentTrace.created_at.desc()).limit(100)
    )
    traces = result.scalars().all()

    return [
        {
            "id": t.id,
            "request_id": t.request_id,
            "agent_name": t.agent_name,
            "action": t.action,
            "input_data": t.input_data,
            "output_data": t.output_data,
            "reasoning": t.reasoning,
            "duration_ms": t.duration_ms,
            "created_at": str(t.created_at) if t.created_at else None
        }
        for t in traces
    ]


@router.get("/request/{request_id}")
async def get_traces_by_request(request_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentTrace)
        .where(AgentTrace.request_id == request_id)
        .order_by(AgentTrace.created_at.asc())
    )
    traces = result.scalars().all()

    return [
        {
            "id": t.id,
            "request_id": t.request_id,
            "agent_name": t.agent_name,
            "action": t.action,
            "input_data": t.input_data,
            "output_data": t.output_data,
            "reasoning": t.reasoning,
            "duration_ms": t.duration_ms,
            "created_at": str(t.created_at) if t.created_at else None
        }
        for t in traces
    ]

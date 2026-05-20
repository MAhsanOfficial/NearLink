import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import ServiceRequest, AgentTrace, User
from schemas import ServiceRequestCreate
from app_agents.intent_agent import parse_intent
from app_agents.provider_agent import discover_providers
from app_agents.ranking_agent import rank_providers
from routes.auth import get_current_user

router = APIRouter(prefix="/api/request", tags=["requests"])


@router.post("/parse")
async def parse_request(
    req: ServiceRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Run intent agent
    intent_result = await parse_intent(req.raw_text)
    parsed = intent_result["parsed"]

    # Save service request
    request_id = str(uuid.uuid4())
    service_req = ServiceRequest(
        id=request_id,
        user_id=current_user.id,
        raw_text=req.raw_text,
        service_type=parsed.get("service_type", ""),
        location=parsed.get("location", ""),
        time=parsed.get("time", ""),
        urgency=parsed.get("urgency", ""),
        language_detected=parsed.get("language_detected", ""),
        status="parsed",
        created_at=datetime.utcnow()
    )
    db.add(service_req)

    # Save agent trace
    trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=request_id,
        agent_name="IntentAgent",
        action="parse_intent",
        input_data={"raw_text": req.raw_text},
        output_data=parsed,
        reasoning=f"Detected language: {parsed.get('language_detected')}, extracted service: {parsed.get('service_type')}, location: {parsed.get('location')}",
        duration_ms=intent_result["duration_ms"],
        created_at=datetime.utcnow()
    )
    db.add(trace)
    await db.commit()

    return {
        "request_id": request_id,
        "raw_text": req.raw_text,
        "parsed": parsed,
        "status": "parsed",
        "trace": {
            "agent": "IntentAgent",
            "action": "parse_intent",
            "duration_ms": intent_result["duration_ms"]
        }
    }


@router.post("/full-search")
async def full_service_search(
    req: ServiceRequestCreate,
    user_latitude: float = None,
    user_longitude: float = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Complete service request flow:
    1. Parse intent
    2. Find providers
    3. Rank providers
    4. Return top 2-3 with details
    """
    # Step 1: Parse intent
    intent_result = await parse_intent(req.raw_text)
    parsed = intent_result["parsed"]
    
    service_type = parsed.get("service_type", "")
    location = parsed.get("location", "")

    # Save service request
    request_id = str(uuid.uuid4())
    service_req = ServiceRequest(
        id=request_id,
        user_id=current_user.id,
        raw_text=req.raw_text,
        service_type=service_type,
        location=location,
        time=parsed.get("time", ""),
        urgency=parsed.get("urgency", ""),
        language_detected=parsed.get("language_detected", ""),
        status="searching",
        created_at=datetime.utcnow()
    )
    db.add(service_req)

    # Save intent trace
    intent_trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=request_id,
        agent_name="IntentAgent",
        action="parse_intent",
        input_data={"raw_text": req.raw_text},
        output_data=parsed,
        reasoning=f"Detected: {service_type} in {location}",
        duration_ms=intent_result["duration_ms"],
        created_at=datetime.utcnow()
    )
    db.add(intent_trace)

    # Step 2: Discover providers
    discovery = await discover_providers(
        db, service_type, location, user_latitude, user_longitude
    )

    # Save discovery trace
    disc_trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=request_id,
        agent_name="ProviderDiscoveryAgent",
        action="discover_providers",
        input_data={"service_type": service_type, "location": location},
        output_data={"count": discovery["count"]},
        reasoning=f"Found {discovery['count']} registered providers",
        duration_ms=discovery["duration_ms"],
        created_at=datetime.utcnow()
    )
    db.add(disc_trace)

    # Step 3: Rank providers
    ranking = await rank_providers(discovery["providers"], service_type, location)

    # Save ranking trace
    rank_trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=request_id,
        agent_name="RankingAgent",
        action="rank_providers",
        input_data={"provider_count": discovery["count"]},
        output_data=ranking.get("ranked_providers", [])[:3],
        reasoning=ranking.get("recommendation", ""),
        duration_ms=ranking.get("duration_ms", 0),
        created_at=datetime.utcnow()
    )
    db.add(rank_trace)

    # Update request status
    service_req.status = "providers_found"
    await db.commit()

    # Get top 2-3 providers with full details
    top_providers = []
    ranked_list = ranking.get("ranked_providers", [])[:3]
    
    for ranked in ranked_list:
        provider_id = ranked.get("provider_id")
        provider_data = next((p for p in discovery["providers"] if p["id"] == provider_id), None)
        
        if provider_data:
            is_registered = provider_data.get("source") == "registered"
            top_providers.append({
                "rank": ranked.get("rank"),
                "score": ranked.get("score"),
                "reasoning": ranked.get("reasoning"),
                "provider": provider_data,
                "registered_in_platform": is_registered
            })

    reg_count = sum(1 for p in top_providers if p["registered_in_platform"])
    ext_count = len(top_providers) - reg_count
    
    response_message = f"Found {len(top_providers)} service providers ({reg_count} registered, {ext_count} external nearby) for {service_type} in {location}. "
    if top_providers:
        top_p = top_providers[0]
        response_message += f"Top recommendation: {top_p['provider']['name']} "
        response_message += f"({top_p['provider']['rating']}⭐, "
        response_message += f"{top_p['provider']['distance_km']}km away). "
        response_message += f"Phone: {top_p['provider']['phone']}. "
        
        if top_p["registered_in_platform"]:
            response_message += "This provider is registered and fully verified on NearLink."
        else:
            source_lbl = "Google Places" if top_p['provider'].get('source') == 'google_places' else "OpenStreetMap"
            response_message += f"This is a public business listed nearby on {source_lbl}."

    return {
        "request_id": request_id,
        "parsed_intent": parsed,
        "top_providers": top_providers,
        "total_found": discovery["count"],
        "message": response_message,
        "recommendation": ranking.get("recommendation", ""),
        "traces": [
            {"agent": "IntentAgent", "duration_ms": intent_result["duration_ms"]},
            {"agent": "ProviderDiscoveryAgent", "duration_ms": discovery["duration_ms"]},
            {"agent": "RankingAgent", "duration_ms": ranking.get("duration_ms", 0)}
        ]
    }


@router.get("/history")
async def get_request_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ServiceRequest)
        .where(ServiceRequest.user_id == current_user.id)
        .order_by(ServiceRequest.created_at.desc())
    )
    requests = result.scalars().all()

    return [
        {
            "id": r.id,
            "raw_text": r.raw_text,
            "service_type": r.service_type,
            "location": r.location,
            "time": r.time,
            "urgency": r.urgency,
            "language_detected": r.language_detected,
            "status": r.status,
            "created_at": str(r.created_at) if r.created_at else None
        }
        for r in requests
    ]

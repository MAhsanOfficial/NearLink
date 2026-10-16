"""
Unified Provider Search - Challenge 2 Implementation
Searches BOTH registered and external (OSM) providers
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from datetime import datetime

from database import get_db
from models import Provider, ExternalProvider, AgentTrace, User
from app_agents.osm_search_agent import search_external_providers
from app_agents.provider_agent import discover_providers
from routes.auth import get_optional_user

router = APIRouter(prefix="/api/unified", tags=["unified-search"])


@router.post("/search")
async def unified_provider_search(
    service_type: str,
    location: str,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None,
    min_results: int = 3,
    current_user: User = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Challenge 2: Unified Provider Search
    
    1. Search registered providers first
    2. If insufficient results, search OSM
    3. Merge and rank all results
    4. Return unified list with source labels
    """
    start_time = datetime.utcnow()
    
    # User ID for tracing
    user_id = current_user.id if current_user else None
    
    results = {
        "registered_providers": [],
        "external_providers": [],
        "unified_providers": [],
        "sources_used": [],
        "total_results": 0
    }
    
    # Step 1: Search providers using the unified agent
    try:
        discovery_result = await discover_providers(
            db=db,
            service_type=service_type,
            location=location,
            user_lat=user_latitude,
            user_lng=user_longitude
        )
        
        all_providers = discovery_result.get("providers", [])
        
        # Step 2: Rank providers using the RankingAgent (Challenge 2)
        from app_agents.ranking_agent import rank_with_breakdown
        ranking_result = await rank_with_breakdown(
            all_providers, service_type, location
        )
        
        ranked_list = ranking_result.get("ranked_providers", [])
        
        # Merge ranking info back into provider objects
        unified_list = []
        for rp in ranked_list:
            pid = rp.get("provider_id")
            # Find provider in the discovery list
            p_data = next((p for p in all_providers if p.get("id") == pid or p.get("osm_id") == pid or p.get("place_id") == pid), None)
            if p_data:
                p_data["rank"] = rp.get("rank")
                p_data["rank_score"] = rp.get("score")
                p_data["reasoning"] = rp.get("reasoning")
                p_data["score_breakdown"] = rp.get("score_breakdown")
                unified_list.append(p_data)
        
        # If no ranking results, use discovery list as is
        if not unified_list:
            unified_list = all_providers
            for i, p in enumerate(unified_list):
                p["rank"] = i + 1

        results["unified_providers"] = unified_list
        results["total_results"] = len(unified_list)
        results["sources_used"].append("NearLink Multi-Agent Discovery")
        results["sources_used"].append("AI Ranking Agent")
        results["recommendation"] = ranking_result.get("recommendation")
        
        # Separate them for the results object if needed
        results["registered_providers"] = [p for p in unified_list if p.get("source") == "registered"]
        results["external_providers"] = [p for p in unified_list if p.get("source") != "registered"]
        
    except Exception as e:
        print(f"Discovery or Ranking search error: {e}")
        unified_list = []

    results["unified_providers"] = unified_list
    results["total_results"] = len(unified_list)

    
    # Step 4: Save trace
    duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=str(uuid.uuid4()),  # Generate request ID
        agent_name="UnifiedSearchAgent",
        action="unified_search",
        input_data={
            "service_type": service_type,
            "location": location,
            "min_results": min_results
        },
        output_data={
            "registered_count": len(results["registered_providers"]),
            "external_count": len(results["external_providers"]),
            "total_count": results["total_results"],
            "sources_used": results["sources_used"]
        },
        reasoning=f"Found {len(results['registered_providers'])} registered and {len(results['external_providers'])} external providers. Merged and ranked by distance, trust, and availability.",
        duration_ms=duration_ms,
        created_at=datetime.utcnow()
    )
    db.add(trace)
    await db.commit()
    
    return {
        **results,
        "duration_ms": duration_ms,
        "trace_id": trace.id
    }


@router.get("/provider/{provider_id}")
async def get_provider_details(
    provider_id: str,
    source: str,  # "registered" or "osm"
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific provider"""
    
    if source == "registered":
        result = await db.execute(select(Provider).where(Provider.id == provider_id))
        provider = result.scalar_one_or_none()
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        return {
            "id": provider.id,
            "name": provider.name,
            "service_type": provider.service_type,
            "area": provider.area,
            "address": provider.address,
            "latitude": provider.latitude,
            "longitude": provider.longitude,
            "rating": provider.rating,
            "total_reviews": provider.total_reviews,
            "availability": provider.availability,
            "price_range": provider.price_range,
            "phone": provider.phone,
            "description": provider.description,
            "services_offered": provider.services_offered,
            "working_hours": provider.working_hours,
            "verified": provider.verified,
            "source": "registered",
            "source_label": "✅ Registered"
        }
    
    elif source == "osm":
        result = await db.execute(select(ExternalProvider).where(ExternalProvider.id == provider_id))
        provider = result.scalar_one_or_none()
        if not provider:
            raise HTTPException(status_code=404, detail="External provider not found")
        
        return {
            "id": provider.id,
            "osm_id": provider.osm_id,
            "name": provider.name,
            "service_type": provider.service_type,
            "area": provider.area,
            "address": provider.address,
            "latitude": provider.latitude,
            "longitude": provider.longitude,
            "phone": provider.phone,
            "website": provider.website,
            "opening_hours": provider.opening_hours,
            "trust_score": provider.trust_score,
            "source": "osm",
            "source_label": "🗺️ Public OSM",
            "raw_data": provider.raw_data
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid source. Must be 'registered' or 'osm'")

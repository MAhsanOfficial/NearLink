"""
Unified Provider Search V2 - With Google Places API (REAL DATA)
Searches BOTH registered and real external businesses
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from datetime import datetime

from database import get_db
from models import Provider, ExternalProvider, AgentTrace, User
from app_agents.provider_agent import discover_providers
from routes.auth import get_optional_user

router = APIRouter(prefix="/api/unified", tags=["unified-search-v2"])


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
    Unified Provider Search with Google Places API
    
    1. Search registered providers first
    2. If insufficient, search Google Places for REAL businesses
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
    
    # Step 1: Search registered providers
    try:
        registered_result = await discover_providers(
            db=db,
            service_type=service_type,
            location=location
        )
        
        registered_providers = registered_result.get("providers", [])
        results["registered_providers"] = registered_providers
        if registered_providers:
            results["sources_used"].append("Registered Database")
        
        # Add source label to each provider
        for p in registered_providers:
            p["source"] = "registered"
            p["source_label"] = "✅ Registered"
            p["trust_score"] = 1.0
        
    except Exception as e:
        print(f"Registered search error: {e}")
        registered_providers = []
    
    # Step 2: Search Google Places for REAL businesses
    need_external = len(registered_providers) < min_results
    
    if need_external:
        try:
            from app_agents.google_places_agent import search_google_places_providers
            
            external_result = await search_google_places_providers(
                service_type=service_type,
                location=location,
                user_latitude=user_latitude,
                user_longitude=user_longitude
            )
            
            external_providers = external_result.get("providers", [])
            results["external_providers"] = external_providers
            
            if external_providers:
                results["sources_used"].append("Google Places API")
            
            # Add source label
            for p in external_providers:
                p["source"] = "google_places"
                p["source_label"] = "🌍 Real Business"
                p["id"] = p.get("place_id", str(uuid.uuid4()))
            
            # Cache in database
            for ext_p in external_providers[:10]:
                try:
                    existing = await db.execute(
                        select(ExternalProvider).where(
                            ExternalProvider.osm_id == ext_p.get("place_id")
                        )
                    )
                    if not existing.scalar_one_or_none():
                        new_ext = ExternalProvider(
                            id=str(uuid.uuid4()),
                            osm_id=ext_p.get("place_id"),
                            name=ext_p["name"],
                            service_type=ext_p["service_type"],
                            area=ext_p.get("area"),
                            address=ext_p.get("address"),
                            latitude=ext_p.get("latitude"),
                            longitude=ext_p.get("longitude"),
                            phone=ext_p.get("phone"),
                            website=ext_p.get("website"),
                            opening_hours=str(ext_p.get("opening_hours")) if ext_p.get("opening_hours") else None,
                            source="google_places",
                            raw_data=ext_p.get("raw_data", {}),
                            trust_score=ext_p.get("trust_score", 0.5),
                            last_updated=datetime.utcnow(),
                            created_at=datetime.utcnow()
                        )
                        db.add(new_ext)
                except Exception as cache_error:
                    print(f"Cache error: {cache_error}")
            
            try:
                await db.commit()
            except:
                pass
            
        except Exception as e:
            print(f"Google Places search error: {e}")
            external_providers = []
    else:
        external_providers = []
    
    # Step 3: Merge and rank
    all_providers = registered_providers + external_providers
    
    def calculate_rank_score(provider):
        score = 0
        
        # Distance
        distance = provider.get("distance_km") or 10
        if distance <= 2:
            score += 40
        elif distance <= 5:
            score += 30
        elif distance <= 10:
            score += 20
        else:
            score += 10
        
        # Trust score
        trust = provider.get("trust_score", 0.5)
        score += trust * 30
        
        # Availability (registered only)
        if provider.get("source") == "registered":
            if provider.get("availability", True):
                score += 15
        
        # Rating
        if provider.get("source") == "registered":
            rating = provider.get("rating", 0)
            score += (rating / 5.0) * 15
        elif provider.get("rating"):  # Google rating
            rating = provider.get("rating", 0)
            score += (rating / 5.0) * 15
        
        # Phone
        if provider.get("phone"):
            score += 5
        
        return round(score, 2)
    
    # Calculate scores
    for provider in all_providers:
        provider["rank_score"] = calculate_rank_score(provider)
    
    all_providers.sort(key=lambda x: x["rank_score"], reverse=True)
    
    # Add ranks
    for i, provider in enumerate(all_providers):
        provider["rank"] = i + 1
    
    results["unified_providers"] = all_providers
    results["total_results"] = len(all_providers)
    
    # Save trace
    duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=str(uuid.uuid4()),
        agent_name="UnifiedSearchAgent_V2",
        action="unified_search_google_places",
        input_data={
            "service_type": service_type,
            "location": location,
            "min_results": min_results
        },
        output_data={
            "registered_count": len(registered_providers),
            "external_count": len(external_providers),
            "total_count": len(all_providers),
            "sources_used": results["sources_used"]
        },
        reasoning=f"Found {len(registered_providers)} registered and {len(external_providers)} real businesses from Google Places. Merged and ranked by distance, trust, and rating.",
        duration_ms=duration_ms,
        created_at=datetime.utcnow()
    )
    db.add(trace)
    try:
        await db.commit()
    except:
        pass
    
    return {
        **results,
        "duration_ms": duration_ms,
        "trace_id": trace.id
    }

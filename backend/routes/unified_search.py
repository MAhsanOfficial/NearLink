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
from models import Provider, ExternalProvider, AgentTrace
from app_agents.osm_search_agent import search_external_providers
from app_agents.provider_agent import discover_providers
from routes.auth import verify_token

router = APIRouter(prefix="/api/unified", tags=["unified-search"])


@router.post("/search")
async def unified_provider_search(
    service_type: str,
    location: str,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None,
    min_results: int = 3,
    authorization: str = Header(None),
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
    
    # Verify user
    if authorization:
        token = authorization.replace("Bearer ", "")
        user = verify_token(token)
        user_id = user["sub"]
    else:
        user_id = None
    
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
        results["sources_used"].append("Registered Database")
        
        # Add source label to each provider
        for p in registered_providers:
            p["source"] = "registered"
            p["source_label"] = "✅ Registered"
            p["trust_score"] = 1.0  # Registered providers have full trust
        
    except Exception as e:
        print(f"Registered search error: {e}")
        registered_providers = []
    
    # Step 2: Check if we need external search
    need_external = len(registered_providers) < min_results
    
    if need_external:
        # First, check database for cached external providers
        try:
            from app_agents.osm_search_agent import haversine_distance, geocode_location
            
            # Get user coordinates for distance calculation
            if not user_latitude or not user_longitude:
                geo_result = geocode_location(location)
                if geo_result:
                    user_latitude = geo_result["latitude"]
                    user_longitude = geo_result["longitude"]
            
            if user_latitude and user_longitude:
                # Search cached external providers
                ext_result = await db.execute(
                    select(ExternalProvider).where(
                        ExternalProvider.service_type.ilike(f"%{service_type}%")
                    )
                )
                cached_providers = ext_result.scalars().all()
                
                external_providers = []
                for ext_p in cached_providers:
                    if ext_p.latitude and ext_p.longitude:
                        distance = haversine_distance(
                            user_latitude, user_longitude,
                            ext_p.latitude, ext_p.longitude
                        )
                        
                        # Only include if within 10km
                        if distance <= 10:
                            external_providers.append({
                                "id": ext_p.id,
                                "osm_id": ext_p.osm_id,
                                "name": ext_p.name,
                                "service_type": ext_p.service_type,
                                "area": ext_p.area,
                                "address": ext_p.address,
                                "latitude": ext_p.latitude,
                                "longitude": ext_p.longitude,
                                "distance_km": round(distance, 2),
                                "phone": ext_p.phone,
                                "website": ext_p.website,
                                "opening_hours": ext_p.opening_hours,
                                "trust_score": ext_p.trust_score,
                                "raw_data": ext_p.raw_data
                            })
                
                # Sort by distance
                external_providers.sort(key=lambda x: x["distance_km"])
            else:
                external_providers = []
            
            results["external_providers"] = external_providers
            if external_providers:
                results["sources_used"].append("External Providers (Cached)")
            results["external_providers"] = external_providers
            if external_providers:
                results["sources_used"].append("External Providers (Cached)")
            
            # Add source label to each provider
            for p in external_providers:
                p["source"] = "osm"
                p["source_label"] = "🗺️ Public OSM"
            
        except Exception as e:
            print(f"External search error: {e}")
            external_providers = []
    else:
        external_providers = []
    
    # Step 3: Merge and rank all providers
    all_providers = registered_providers + external_providers
    
    # Ranking algorithm
    def calculate_rank_score(provider):
        score = 0
        
        # Distance score (closer = better)
        distance = provider.get("distance_km") or 10  # Default 10km if None
        if distance <= 2:
            score += 40
        elif distance <= 5:
            score += 30
        elif distance <= 10:
            score += 20
        else:
            score += 10
        
        # Trust score (registered > OSM with data > OSM without data)
        trust = provider.get("trust_score", 0.5)
        score += trust * 30
        
        # Availability (registered only)
        if provider.get("source") == "registered":
            if provider.get("availability", True):
                score += 15
        
        # Rating (registered only)
        if provider.get("source") == "registered":
            rating = provider.get("rating", 0)
            score += (rating / 5.0) * 15
        
        # Phone availability
        if provider.get("phone"):
            score += 5
        
        return round(score, 2)
    
    # Calculate scores and sort
    for provider in all_providers:
        provider["rank_score"] = calculate_rank_score(provider)
    
    all_providers.sort(key=lambda x: x["rank_score"], reverse=True)
    
    # Add rank numbers
    for i, provider in enumerate(all_providers):
        provider["rank"] = i + 1
    
    results["unified_providers"] = all_providers
    results["total_results"] = len(all_providers)
    
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
            "registered_count": len(registered_providers),
            "external_count": len(external_providers),
            "total_count": len(all_providers),
            "sources_used": results["sources_used"]
        },
        reasoning=f"Found {len(registered_providers)} registered and {len(external_providers)} external providers. Merged and ranked by distance, trust, and availability.",
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

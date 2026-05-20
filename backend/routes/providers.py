import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import math
import os
import httpx

from database import get_db
from models import Provider, AgentTrace, User
from schemas import ProviderSearchRequest, ProviderRegistration, ProviderUpdate, WalletTopup
from app_agents.provider_agent import discover_providers
from app_agents.ranking_agent import rank_providers
from routes.auth import verify_token, get_current_user

router = APIRouter(prefix="/api/providers", tags=["providers"])

# Google Maps API Key (free tier: 28,000 requests/month)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)."""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return round(R * c, 2)


async def verify_location_with_maps(address: str, latitude: float, longitude: float) -> dict:
    """Verify location using Google Maps Geocoding API."""
    if not GOOGLE_MAPS_API_KEY:
        return {"verified": False, "reason": "Maps API key not configured"}
    
    try:
        async with httpx.AsyncClient() as client:
            # Geocode the address
            geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "address": address,
                "key": GOOGLE_MAPS_API_KEY
            }
            response = await client.get(geocode_url, params=params)
            data = response.json()
            
            if data["status"] == "OK" and len(data["results"]) > 0:
                result = data["results"][0]
                map_lat = result["geometry"]["location"]["lat"]
                map_lng = result["geometry"]["location"]["lng"]
                
                # Calculate distance between provided coords and geocoded coords
                distance = calculate_distance(latitude, longitude, map_lat, map_lng)
                
                # If within 1km, consider verified
                verified = distance < 1.0
                
                return {
                    "verified": verified,
                    "distance_from_geocoded": distance,
                    "geocoded_address": result["formatted_address"],
                    "geocoded_lat": map_lat,
                    "geocoded_lng": map_lng
                }
            else:
                return {"verified": False, "reason": f"Geocoding failed: {data['status']}"}
    except Exception as e:
        return {"verified": False, "reason": f"Error: {str(e)}"}


async def search_nearby_places(latitude: float, longitude: float, service_type: str, radius: int = 5000) -> list:
    """Search for nearby places using Google Maps Places API."""
    if not GOOGLE_MAPS_API_KEY:
        return []
    
    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            params = {
                "location": f"{latitude},{longitude}",
                "radius": radius,
                "keyword": service_type,
                "key": GOOGLE_MAPS_API_KEY
            }
            response = await client.get(url, params=params)
            data = response.json()
            
            if data["status"] == "OK":
                places = []
                for place in data["results"][:5]:  # Top 5 results
                    place_lat = place["geometry"]["location"]["lat"]
                    place_lng = place["geometry"]["location"]["lng"]
                    distance = calculate_distance(latitude, longitude, place_lat, place_lng)
                    
                    places.append({
                        "name": place["name"],
                        "address": place.get("vicinity", ""),
                        "latitude": place_lat,
                        "longitude": place_lng,
                        "distance_km": distance,
                        "rating": place.get("rating", 0),
                        "total_reviews": place.get("user_ratings_total", 0),
                        "place_id": place["place_id"],
                        "types": place.get("types", []),
                        "source": "google_maps"
                    })
                return places
            return []
    except Exception as e:
        print(f"Error searching nearby places: {e}")
        return []


@router.get("/my-wallet")
async def get_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Provider).where(Provider.user_id == current_user.id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    return {
        "wallet_balance": provider.wallet_balance,
        "commission_rate": provider.commission_rate
    }


@router.post("/topup")
async def topup_wallet(
    req: WalletTopup,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Provider).where(Provider.user_id == current_user.id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    provider.wallet_balance += req.amount
    await db.commit()

    return {
        "status": "success",
        "new_balance": provider.wallet_balance
    }


@router.post("/register")
async def register_provider(
    req: ProviderRegistration,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register a new service provider profile."""
    # Check if user is a provider
    if current_user.user_type != "provider":
        raise HTTPException(status_code=403, detail="Only provider accounts can register as service providers")
    
    # Check if provider already exists for this user
    existing = await db.execute(select(Provider).where(Provider.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Provider profile already exists for this user")
    
    # Verify location with maps
    verification = await verify_location_with_maps(req.address, req.latitude, req.longitude)
    
    provider_id = str(uuid.uuid4())
    provider = Provider(
        id=provider_id,
        user_id=current_user.id,
        name=req.name,
        service_type=req.service_type,
        area=req.area,
        address=req.address,
        latitude=req.latitude,
        longitude=req.longitude,
        phone=req.phone,
        description=req.description,
        services_offered=req.services_offered,
        working_hours=req.working_hours,
        price_range=req.price_range,
        rating=0.0,
        total_reviews=0,
        availability=True,
        verified=verification.get("verified", False),
        wallet_balance=500.0, # Rs. 500 Starter Balance
        created_at=datetime.utcnow()
    )
    db.add(provider)
    await db.commit()
    
    return {
        "id": provider_id,
        "message": "Provider registered successfully",
        "verified": verification.get("verified", False),
        "verification_details": verification
    }


@router.get("/my-profile")
async def get_my_provider_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get provider's own profile."""
    result = await db.execute(select(Provider).where(Provider.user_id == current_user.id))
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    return {
        "id": provider.id,
        "name": provider.name,
        "service_type": provider.service_type,
        "area": provider.area,
        "address": provider.address,
        "latitude": provider.latitude,
        "longitude": provider.longitude,
        "phone": provider.phone,
        "description": provider.description,
        "services_offered": provider.services_offered,
        "working_hours": provider.working_hours,
        "price_range": provider.price_range,
        "rating": provider.rating,
        "total_reviews": provider.total_reviews,
        "availability": provider.availability,
        "verified": provider.verified
    }


@router.put("/my-profile")
async def update_my_provider_profile(
    req: ProviderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update provider's own profile."""
    result = await db.execute(select(Provider).where(Provider.user_id == current_user.id))
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    # Update fields
    update_data = req.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(provider, field, value)
    
    # Re-verify location if address or coordinates changed
    if any(k in update_data for k in ["address", "latitude", "longitude"]):
        verification = await verify_location_with_maps(
            provider.address, provider.latitude, provider.longitude
        )
        provider.verified = verification.get("verified", False)
    
    await db.commit()
    
    return {"message": "Provider profile updated successfully"}


@router.post("/search")
async def search_providers(
    req: ProviderSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search for providers with geolocation support."""
    # Search registered providers in database
    result = await discover_providers(db, req.service_type, req.location)
    
    # Calculate distances if user coordinates provided
    if req.user_latitude and req.user_longitude:
        for provider in result["providers"]:
            if provider.get("latitude") and provider.get("longitude"):
                distance = calculate_distance(
                    req.user_latitude, req.user_longitude,
                    provider["latitude"], provider["longitude"]
                )
                provider["distance_km"] = distance

    # Save trace
    trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=None,
        agent_name="ProviderDiscoveryAgent",
        action="discover_providers",
        input_data={"service_type": req.service_type, "location": req.location},
        output_data={"count": result["count"], "providers": [p["name"] for p in result["providers"]]},
        reasoning=f"Found {result['count']} registered providers for {req.service_type} in {req.location}",
        duration_ms=result["duration_ms"],
        created_at=datetime.utcnow()
    )
    db.add(trace)
    await db.commit()

    return result


@router.post("/search-with-maps")
async def search_providers_with_maps(
    req: ProviderSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search for providers combining database and Google Maps results."""
    # 1. Search registered providers in database
    db_result = await discover_providers(db, req.service_type, req.location)
    
    # Calculate distances for registered providers
    if req.user_latitude and req.user_longitude:
        for provider in db_result["providers"]:
            if provider.get("latitude") and provider.get("longitude"):
                distance = calculate_distance(
                    req.user_latitude, req.user_longitude,
                    provider["latitude"], provider["longitude"]
                )
                provider["distance_km"] = distance
                provider["source"] = "registered"
    
    # 2. Search nearby places using Google Maps
    map_results = []
    if req.user_latitude and req.user_longitude:
        map_results = await search_nearby_places(
            req.user_latitude, req.user_longitude, req.service_type
        )
    
    # Sort registered providers by distance
    registered_sorted = sorted(
        db_result["providers"],
        key=lambda x: x.get("distance_km", 999)
    )
    
    # Get top 2-3 registered providers
    top_registered = registered_sorted[:3]
    
    return {
        "registered_providers": top_registered,
        "registered_count": len(db_result["providers"]),
        "nearby_map_results": map_results[:5],
        "message": f"Found {len(top_registered)} registered providers and {len(map_results)} nearby locations from maps"
    }


@router.post("/rank")
async def rank_providers_endpoint(
    req: ProviderSearchRequest,
    request_id: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # First discover providers
    discovery = await discover_providers(db, req.service_type, req.location)

    # Save discovery trace
    disc_trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=request_id,
        agent_name="ProviderDiscoveryAgent",
        action="discover_providers",
        input_data={"service_type": req.service_type, "location": req.location},
        output_data={"count": discovery["count"]},
        reasoning=f"Found {discovery['count']} providers for {req.service_type} in {req.location}",
        duration_ms=discovery["duration_ms"],
        created_at=datetime.utcnow()
    )
    db.add(disc_trace)

    # Then rank them
    ranking = await rank_providers(discovery["providers"], req.service_type, req.location)

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
    await db.commit()

    return {
        "providers": discovery["providers"],
        "ranking": ranking,
        "traces": [
            {"agent": "ProviderDiscoveryAgent", "action": "discover_providers", "duration_ms": discovery["duration_ms"]},
            {"agent": "RankingAgent", "action": "rank_providers", "duration_ms": ranking.get("duration_ms", 0)}
        ]
    }


@router.get("/all")
async def get_all_providers(db: AsyncSession = Depends(get_db)):
    """Get all registered providers."""
    result = await db.execute(select(Provider).order_by(Provider.rating.desc()))
    providers = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "service_type": p.service_type,
            "area": p.area,
            "address": p.address,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "distance_km": p.distance_km,
            "rating": p.rating,
            "total_reviews": p.total_reviews,
            "availability": p.availability,
            "price_range": p.price_range,
            "phone": p.phone,
            "description": p.description,
            "services_offered": p.services_offered,
            "working_hours": p.working_hours,
            "verified": p.verified
        }
        for p in providers
    ]


@router.get("/{provider_id}")
async def get_provider_details(provider_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed information about a specific provider."""
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
        "phone": provider.phone,
        "description": provider.description,
        "services_offered": provider.services_offered,
        "working_hours": provider.working_hours,
        "price_range": provider.price_range,
        "rating": provider.rating,
        "total_reviews": provider.total_reviews,
        "availability": provider.availability,
        "verified": provider.verified
    }

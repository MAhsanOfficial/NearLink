import asyncio
import time
import math
import os
import uuid
import json
from datetime import datetime
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from models import Provider, ExternalProvider


LIVE_SEARCH_TIMEOUT_S = float(os.getenv("LIVE_SEARCH_TIMEOUT_S", "8"))


async def _off_loop(coro_fn, *args, timeout: float = LIVE_SEARCH_TIMEOUT_S, **kwargs):
    """Run a coroutine function whose body makes blocking HTTP calls (requests) in a worker thread, within a time budget.

    Without this, a slow Google/OSM/Nominatim response freezes the whole event loop (every user) and can stall a
    booking for tens of seconds. The registered-provider results are already in hand, so a timeout just means
    'no live results this time'.
    """
    return await asyncio.wait_for(asyncio.to_thread(lambda: asyncio.run(coro_fn(*args, **kwargs))), timeout)


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


async def discover_providers(
    db: AsyncSession,
    service_type: str,
    location: str,
    user_lat: float = None,
    user_lng: float = None
) -> dict:
    """Find providers matching service type and location from registered and external (OSM/Google Places) databases."""
    start = time.time()
    import uuid
    from datetime import datetime
    from models import ExternalProvider
    from app_agents.osm_search_agent import geocode_location, haversine_distance

    service_lower = service_type.lower()
    location_lower = location.lower()

    # Step 1: Resolve user coordinates if not provided
    if not user_lat or not user_lng:
        try:
            geo = await asyncio.wait_for(asyncio.to_thread(geocode_location, location), LIVE_SEARCH_TIMEOUT_S)
            if geo:
                user_lat = geo["latitude"]
                user_lng = geo["longitude"]
        except Exception as e:
            print(f"Error geocoding in discover_providers: {e}")

    provider_list = []
    seen_identifiers = set()  # To avoid duplicates by (name.lower(), phone) or (name.lower(), lat, lon)

    def add_to_list(p_data, source_type):
        name_key = p_data["name"].lower().strip()
        phone_key = p_data.get("phone") or ""
        lat_val = round(p_data.get("latitude") or 0.0, 4)
        lng_val = round(p_data.get("longitude") or 0.0, 4)
        
        # Unique identifier combos
        combo1 = (name_key, phone_key) if phone_key else None
        combo2 = (name_key, lat_val, lng_val)
        
        if (combo1 and combo1 in seen_identifiers) or combo2 in seen_identifiers:
            return False
            
        if combo1:
            seen_identifiers.add(combo1)
        seen_identifiers.add(combo2)
        provider_list.append(p_data)
        return True

    # Step 2: Search registered providers in database
    try:
        # Search for providers matching service type and area
        stmt = select(Provider).where(
            func.lower(Provider.service_type).contains(service_lower),
            func.lower(Provider.area).contains(location_lower),
            Provider.availability == True
        )
        result = await db.execute(stmt)
        registered_providers = result.scalars().all()

        # If no exact match, broaden to just service type
        if not registered_providers:
            stmt = select(Provider).where(
                func.lower(Provider.service_type).contains(service_lower),
                Provider.availability == True
            )
            result = await db.execute(stmt)
            registered_providers = result.scalars().all()

        # If still no match, broaden to just area
        if not registered_providers:
            stmt = select(Provider).where(
                func.lower(Provider.area).contains(location_lower),
                Provider.availability == True
            )
            result = await db.execute(stmt)
            registered_providers = result.scalars().all()

        for p in registered_providers:
            distance = p.distance_km
            if user_lat and user_lng and p.latitude and p.longitude:
                distance = calculate_distance(user_lat, user_lng, p.latitude, p.longitude)
                
            provider_data = {
                "id": p.id,
                "name": p.name,
                "service_type": p.service_type,
                "area": p.area,
                "address": p.address,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "rating": p.rating or 0.0,
                "total_reviews": p.total_reviews or 0,
                "availability": p.availability,
                "price_range": p.price_range or "Medium",
                "phone": p.phone,
                "description": p.description,
                "services_offered": p.services_offered or [p.service_type],
                "working_hours": p.working_hours or "9 AM - 6 PM",
                "verified": p.verified,
                "distance_km": round(distance, 2) if distance is not None else None,
                "source": "registered",
                "source_label": "✅ Registered"
            }
            add_to_list(provider_data, "registered")
    except Exception as e:
        print(f"Error querying registered providers: {e}")

    # Step 3: Fetch cached external providers from database
    try:
        ext_stmt = select(ExternalProvider).where(
            func.lower(ExternalProvider.service_type).contains(service_lower)
        )
        ext_result = await db.execute(ext_stmt)
        cached_external = ext_result.scalars().all()

        for ext in cached_external:
            distance = 999.0
            if user_lat and user_lng and ext.latitude and ext.longitude:
                distance = haversine_distance(user_lat, user_lng, ext.latitude, ext.longitude)

            # Include if distance is within 15km or matching location
            if distance <= 15.0 or (ext.area and location_lower in ext.area.lower()):
                provider_data = {
                    "id": ext.id,
                    "name": ext.name,
                    "service_type": ext.service_type,
                    "area": ext.area or "Karachi",
                    "address": ext.address or ext.area or "Karachi",
                    "latitude": ext.latitude,
                    "longitude": ext.longitude,
                    "rating": 4.0 if ext.source == "google_places" else 3.8,
                    "total_reviews": 8 if ext.source == "google_places" else 4,
                    "availability": True,
                    "price_range": "Medium",
                    "phone": ext.phone or "Not Available",
                    "description": f"External business verified via {ext.source.upper() if ext.source else 'OSM'}.",
                    "services_offered": [ext.service_type],
                    "working_hours": ext.opening_hours or "9 AM - 6 PM",
                    "verified": True,
                    "distance_km": round(distance, 2) if distance != 999.0 else None,
                    "source": ext.source or "osm",
                    "source_label": "🌍 Real Business" if (ext.source or "osm") == "google_places" else "🗺️ Public OSM"
                }
                add_to_list(provider_data, "external_cached")
    except Exception as e:
        print(f"Error querying cached external providers: {e}")

    # Step 4: Always run live search (Google Places/OSM) to fetch the closest real businesses alongside registered ones
    if user_lat and user_lng:
        try:
            # Try Google Places first if configured
            api_key = os.getenv("GOOGLE_PLACES_API_KEY")
            live_providers = []
            source_name = "osm"

            if api_key:
                try:
                    from app_agents.google_places_agent import search_google_places_providers
                    places_res = await _off_loop(
                        search_google_places_providers,
                        service_type=service_type,
                        location=location,
                        user_latitude=user_lat,
                        user_longitude=user_lng
                    )
                    live_providers = places_res.get("providers", [])
                    source_name = "google_places"
                except Exception as g_err:
                    print(f"Live Google Places search error: {g_err}")

            # Fallback to OSM search if Google Places returned nothing or failed
            if not live_providers:
                try:
                    from app_agents.osm_search_agent import search_external_providers
                    osm_res = await _off_loop(
                        search_external_providers,
                        service_type=service_type,
                        location=location,
                        user_latitude=user_lat,
                        user_longitude=user_lng
                    )
                    live_providers = osm_res.get("providers", [])
                    source_name = "osm"
                except Exception as osm_err:
                    print(f"Live OSM search error: {osm_err}")

            # Cache and merge live results
            for lp in live_providers[:10]:
                distance = lp.get("distance_km")
                if distance is None and lp.get("latitude") and lp.get("longitude"):
                    distance = haversine_distance(user_lat, user_lng, lp["latitude"], lp["longitude"])

                provider_data = {
                    "id": lp.get("place_id") or lp.get("osm_id") or str(uuid.uuid4()),
                    "name": lp["name"],
                    "service_type": service_type,
                    "area": lp.get("area") or "Karachi",
                    "address": lp.get("address") or lp.get("area") or "Karachi",
                    "latitude": lp.get("latitude"),
                    "longitude": lp.get("longitude"),
                    "rating": lp.get("rating") or (4.0 if source_name == "google_places" else 3.8),
                    "total_reviews": lp.get("total_reviews") or (8 if source_name == "google_places" else 4),
                    "availability": True,
                    "price_range": "Medium",
                    "phone": lp.get("phone") or "Not Available",
                    "description": f"Live external business found near {location}.",
                    "services_offered": [service_type],
                    "working_hours": lp.get("opening_hours") or "9 AM - 6 PM",
                    "verified": True,
                    "distance_km": round(distance, 2) if distance is not None else None,
                    "source": lp.get("source") or source_name,
                    "source_label": "🌍 Real Business" if source_name == "google_places" else "🗺️ Public OSM"
                }

                # Try saving to DB cache in background
                if add_to_list(provider_data, "live"):
                    try:
                        # Check if already in external DB
                        existing_ext = await db.execute(
                            select(ExternalProvider).where(
                                ExternalProvider.osm_id == (lp.get("place_id") or lp.get("osm_id"))
                            )
                        )
                        if not existing_ext.scalar_one_or_none():
                            new_ext = ExternalProvider(
                                id=str(uuid.uuid4()),
                                osm_id=lp.get("place_id") or lp.get("osm_id"),
                                name=lp["name"],
                                service_type=service_type,
                                area=lp.get("area") or "Karachi",
                                address=lp.get("address"),
                                latitude=lp.get("latitude"),
                                longitude=lp.get("longitude"),
                                phone=lp.get("phone"),
                                website=lp.get("website"),
                                opening_hours=str(lp.get("opening_hours")) if lp.get("opening_hours") else None,
                                source=source_name,
                                raw_data=lp.get("raw_data", {}),
                                trust_score=lp.get("trust_score", 0.5),
                                last_updated=datetime.utcnow(),
                                created_at=datetime.utcnow()
                            )
                            db.add(new_ext)
                            await db.commit()
                    except Exception as cache_err:
                        print(f"Cache background error: {cache_err}")
                        await db.rollback()
        except Exception as live_err:
            print(f"Error performing live provider discovery: {live_err}")

    # Step 5: Sort by distance
    provider_list.sort(key=lambda x: x.get("distance_km") or 999.0)

    duration_ms = int((time.time() - start) * 1000)

    return {
        "providers": provider_list,
        "count": len(provider_list),
        "duration_ms": duration_ms,
        "search_criteria": {"service_type": service_type, "location": location}
    }

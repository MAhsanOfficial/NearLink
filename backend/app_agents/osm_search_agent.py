"""
OSM Search Agent - Searches OpenStreetMap for nearby service providers
Uses Nominatim for geocoding and Overpass API for business search
"""
import time
import requests
from typing import Dict, List, Optional
import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def geocode_location(location: str) -> Optional[Dict]:
    """
    Convert location name to coordinates using Nominatim with resilient city fallbacks
    """
    # Clean up location string
    loc_clean = location.strip()
    
    # 1. Try Nominatim Geocoding
    try:
        url = "https://nominatim.openstreetmap.org/search"
        
        # Avoid duplicate suffix strings
        if not any(c in loc_clean.lower() for c in ["karachi", "islamabad", "lahore", "rawalpindi", "pakistan"]):
            q_str = f"{loc_clean}, Karachi, Pakistan"
        elif not "pakistan" in loc_clean.lower():
            q_str = f"{loc_clean}, Pakistan"
        else:
            q_str = loc_clean

        params = {
            "q": q_str,
            "format": "json",
            "limit": 1
        }
        headers = {
            "User-Agent": "NearLink/1.0"
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        results = response.json()
        if results:
            return {
                "latitude": float(results[0]["lat"]),
                "longitude": float(results[0]["lon"]),
                "display_name": results[0]["display_name"]
            }
    except Exception as e:
        print(f"Geocoding Nominatim failed: {e}")
        
    # 2. Resilient fallback coordinates for Pakistan cities
    city_fallbacks = {
        "islamabad": {"latitude": 33.6844, "longitude": 73.0479, "display_name": "Islamabad, Pakistan"},
        "rawalpindi": {"latitude": 33.5973, "longitude": 73.0479, "display_name": "Rawalpindi, Pakistan"},
        "lahore": {"latitude": 31.5204, "longitude": 74.3587, "display_name": "Lahore, Pakistan"},
        "karachi": {"latitude": 24.8607, "longitude": 67.0011, "display_name": "Karachi, Pakistan"},
    }
    
    loc_lower = loc_clean.lower()
    for city, coords in city_fallbacks.items():
        if city in loc_lower:
            print(f"📍 Resilient Geocoding Fallback for: {city}")
            return coords
            
    # Default fallback to Karachi
    print("📍 Resilient Geocoding Default Fallback to Karachi")
    return city_fallbacks["karachi"]


def search_osm_providers(
    service_type: str,
    latitude: float,
    longitude: float,
    radius_km: float = 5.0
) -> List[Dict]:
    """
    Search OpenStreetMap for nearby businesses using Overpass API
    """
    start_time = time.time()
    
    # Map service types to OSM tags
    service_tag_map = {
        "electrician": ["craft=electrician", "shop=electrical"],
        "plumber": ["craft=plumber", "shop=plumbing"],
        "carpenter": ["craft=carpenter", "shop=carpenter"],
        "painter": ["craft=painter", "shop=paint"],
        "ac technician": ["craft=hvac", "shop=air_conditioning"],
        "mechanic": ["craft=car_repair", "shop=car_repair"],
        "cleaner": ["shop=cleaning", "amenity=cleaning"],
    }
    
    # Get relevant tags
    service_lower = service_type.lower()
    tags = []
    for key, values in service_tag_map.items():
        if key in service_lower:
            tags.extend(values)
    
    # Default to general shop if no specific match
    if not tags:
        tags = ["shop=*", "craft=*"]
    
    # Build Overpass query
    radius_m = int(radius_km * 1000)
    tag_queries = []
    for tag in tags[:3]:  # Limit to 3 tags to avoid timeout
        tag_queries.append(f'node["{tag}"](around:{radius_m},{latitude},{longitude});')
        tag_queries.append(f'way["{tag}"](around:{radius_m},{latitude},{longitude});')
    
    overpass_query = f"""
    [out:json][timeout:25];
    (
      {''.join(tag_queries)}
    );
    out body;
    >;
    out skel qt;
    """
    
    try:
        url = "https://overpass-api.de/api/interpreter"
        response = requests.post(url, data=overpass_query, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        providers = []
        
        for element in data.get("elements", []):
            tags_data = element.get("tags", {})
            
            # Skip if no name
            if "name" not in tags_data:
                continue
            
            # Get coordinates
            if element["type"] == "node":
                lat = element["lat"]
                lon = element["lon"]
            elif element["type"] == "way" and "center" in element:
                lat = element["center"]["lat"]
                lon = element["center"]["lon"]
            else:
                continue
            
            # Calculate distance
            distance = haversine_distance(latitude, longitude, lat, lon)
            
            # Extract phone number
            phone = tags_data.get("phone") or tags_data.get("contact:phone") or None
            
            # Extract address
            addr_parts = []
            if "addr:housenumber" in tags_data:
                addr_parts.append(tags_data["addr:housenumber"])
            if "addr:street" in tags_data:
                addr_parts.append(tags_data["addr:street"])
            if "addr:suburb" in tags_data:
                addr_parts.append(tags_data["addr:suburb"])
            
            address = ", ".join(addr_parts) if addr_parts else None
            
            # Calculate trust score based on data completeness
            trust_score = 0.3  # Base score
            if phone:
                trust_score += 0.2
            if address:
                trust_score += 0.2
            if "opening_hours" in tags_data:
                trust_score += 0.15
            if "website" in tags_data:
                trust_score += 0.15
            
            provider = {
                "osm_id": f"{element['type']}/{element['id']}",
                "name": tags_data["name"],
                "service_type": service_type,
                "area": tags_data.get("addr:suburb") or tags_data.get("addr:city") or "Karachi",
                "address": address,
                "latitude": lat,
                "longitude": lon,
                "distance_km": round(distance, 2),
                "phone": phone,
                "website": tags_data.get("website") or tags_data.get("contact:website"),
                "opening_hours": tags_data.get("opening_hours"),
                "source": "osm",
                "trust_score": round(trust_score, 2),
                "raw_data": tags_data
            }
            
            providers.append(provider)
        
        # Sort by distance
        providers.sort(key=lambda x: x["distance_km"])
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            "providers": providers[:10],  # Return top 10
            "total_found": len(providers),
            "search_radius_km": radius_km,
            "duration_ms": duration_ms
        }
        
    except Exception as e:
        print(f"OSM search error: {e}")
        return {
            "providers": [],
            "total_found": 0,
            "error": str(e),
            "duration_ms": int((time.time() - start_time) * 1000)
        }


async def search_external_providers(
    service_type: str,
    location: str,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None
) -> Dict:
    """
    Main function to search external providers
    1. Geocode location if coordinates not provided
    2. Search OSM for nearby businesses
    3. Return normalized results
    """
    start_time = time.time()
    
    # Step 1: Get coordinates
    if not user_latitude or not user_longitude:
        geo_result = geocode_location(location)
        if not geo_result:
            return {
                "providers": [],
                "error": "Could not geocode location",
                "duration_ms": int((time.time() - start_time) * 1000)
            }
        user_latitude = geo_result["latitude"]
        user_longitude = geo_result["longitude"]
    
    # Step 2: Search OSM
    osm_results = search_osm_providers(
        service_type=service_type,
        latitude=user_latitude,
        longitude=user_longitude,
        radius_km=5.0
    )
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    return {
        "providers": osm_results.get("providers", []),
        "total_found": osm_results.get("total_found", 0),
        "coordinates": {
            "latitude": user_latitude,
            "longitude": user_longitude
        },
        "source": "OpenStreetMap",
        "duration_ms": duration_ms
    }

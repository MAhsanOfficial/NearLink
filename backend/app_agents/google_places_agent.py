"""
Google Places API Agent - Search REAL businesses
Uses Google Places API to find actual service providers
"""
import os
import requests
import time
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


def geocode_location_google(location: str, api_key: str) -> Optional[Dict]:
    """
    Convert location name to coordinates using Google Geocoding API
    """
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": f"{location}, Karachi, Pakistan",
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data.get("status") == "OK" and data.get("results"):
            result = data["results"][0]
            location_data = result["geometry"]["location"]
            return {
                "latitude": location_data["lat"],
                "longitude": location_data["lng"],
                "formatted_address": result["formatted_address"]
            }
        return None
    except Exception as e:
        print(f"Google Geocoding error: {e}")
        return None


def search_google_places(
    service_type: str,
    latitude: float,
    longitude: float,
    api_key: str,
    radius_m: int = 5000
) -> List[Dict]:
    """
    Search Google Places for nearby businesses
    """
    start_time = time.time()
    
    # Map service types to Google Places types/keywords
    service_keyword_map = {
        "electrician": "electrician",
        "plumber": "plumber",
        "carpenter": "carpenter",
        "painter": "painter",
        "ac technician": "air conditioning contractor",
        "mechanic": "car repair",
        "cleaner": "cleaning service",
    }
    
    # Get search keyword
    service_lower = service_type.lower()
    keyword = service_keyword_map.get(service_lower, service_type)
    
    try:
        # Google Places Nearby Search
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{latitude},{longitude}",
            "radius": radius_m,
            "keyword": keyword,
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            print(f"Google Places API error: {data.get('status')}")
            return {
                "providers": [],
                "total_found": 0,
                "error": f"Google Places API error: {data.get('status')}",
                "duration_ms": int((time.time() - start_time) * 1000)
            }
        
        providers = []
        
        for place in data.get("results", []):
            place_lat = place["geometry"]["location"]["lat"]
            place_lon = place["geometry"]["location"]["lng"]
            
            # Calculate distance
            distance = haversine_distance(latitude, longitude, place_lat, place_lon)
            
            # Get place details for phone number
            place_id = place.get("place_id")
            phone = None
            website = None
            opening_hours = None
            
            # Optional: Get detailed info (costs extra API call)
            # Uncommented to fetch real phone numbers and business details
            if place_id:
                details = get_place_details(place_id, api_key)
                if details:
                    phone = details.get("formatted_phone_number")
                    website = details.get("website")
                    opening_hours = details.get("opening_hours", {}).get("weekday_text")
            
            # Calculate trust score based on available data
            trust_score = 0.5  # Base score
            if place.get("rating"):
                trust_score += 0.2
            if place.get("user_ratings_total", 0) > 10:
                trust_score += 0.15
            if place.get("opening_hours"):
                trust_score += 0.1
            if phone:
                trust_score += 0.05
            
            trust_score = min(trust_score, 1.0)
            
            provider = {
                "place_id": place_id,
                "name": place.get("name"),
                "service_type": service_type,
                "area": place.get("vicinity", "").split(",")[0] if place.get("vicinity") else "Karachi",
                "address": place.get("vicinity"),
                "latitude": place_lat,
                "longitude": place_lon,
                "distance_km": round(distance, 2),
                "phone": phone,
                "website": website,
                "opening_hours": opening_hours,
                "rating": place.get("rating"),
                "total_reviews": place.get("user_ratings_total", 0),
                "is_open": place.get("opening_hours", {}).get("open_now"),
                "source": "google_places",
                "trust_score": round(trust_score, 2),
                "raw_data": {
                    "place_id": place_id,
                    "types": place.get("types", []),
                    "price_level": place.get("price_level"),
                    "photos": len(place.get("photos", []))
                }
            }
            
            providers.append(provider)
        
        # Sort by distance
        providers.sort(key=lambda x: x["distance_km"])
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            "providers": providers[:15],  # Return top 15
            "total_found": len(providers),
            "search_radius_km": radius_m / 1000,
            "duration_ms": duration_ms,
            "api_used": "Google Places API"
        }
        
    except Exception as e:
        print(f"Google Places search error: {e}")
        return {
            "providers": [],
            "total_found": 0,
            "error": str(e),
            "duration_ms": int((time.time() - start_time) * 1000)
        }


def get_place_details(place_id: str, api_key: str) -> Optional[Dict]:
    """
    Get detailed information about a place (costs extra API call)
    """
    try:
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "formatted_phone_number,website,opening_hours",
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", {})
        return None
    except Exception as e:
        print(f"Place details error: {e}")
        return None


async def search_google_places_providers(
    service_type: str,
    location: str,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None
) -> Dict:
    """
    Main function to search Google Places for real businesses
    """
    start_time = time.time()
    
    # Get API key from environment
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        return {
            "providers": [],
            "error": "Google Places API key not configured",
            "duration_ms": 0
        }
    
    # Step 1: Get coordinates
    if not user_latitude or not user_longitude:
        geo_result = geocode_location_google(location, api_key)
        if not geo_result:
            return {
                "providers": [],
                "error": "Could not geocode location",
                "duration_ms": int((time.time() - start_time) * 1000)
            }
        user_latitude = geo_result["latitude"]
        user_longitude = geo_result["longitude"]
    
    # Step 2: Search Google Places
    places_results = search_google_places(
        service_type=service_type,
        latitude=user_latitude,
        longitude=user_longitude,
        api_key=api_key,
        radius_m=5000  # 5km radius
    )
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    return {
        "providers": places_results.get("providers", []),
        "total_found": places_results.get("total_found", 0),
        "coordinates": {
            "latitude": user_latitude,
            "longitude": user_longitude
        },
        "source": "Google Places API (Real Businesses)",
        "duration_ms": duration_ms
    }

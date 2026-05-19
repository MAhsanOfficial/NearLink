"""
Test Google Places API Integration
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_api_key():
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    
    print("🧪 Testing Google Places API Setup\n")
    print("=" * 60)
    
    if not api_key:
        print("❌ GOOGLE_PLACES_API_KEY not found in .env file")
        print("\n📝 Setup Instructions:")
        print("1. Go to: https://console.cloud.google.com/")
        print("2. Create project or select existing")
        print("3. Enable 'Places API' and 'Geocoding API'")
        print("4. Create API key in 'Credentials'")
        print("5. Add to backend/.env:")
        print("   GOOGLE_PLACES_API_KEY=YOUR_KEY_HERE")
        print("\n💡 Free tier: 28,000 requests/month")
        print("=" * 60)
        return False
    
    print(f"✅ API Key found: {api_key[:20]}...")
    print("\n🔍 Testing API...")
    
    # Test geocoding
    import requests
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": "Gulshan-e-Iqbal, Karachi, Pakistan",
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get("status") == "OK":
            print("✅ Geocoding API: Working!")
            location = data["results"][0]["geometry"]["location"]
            print(f"   Gulshan coordinates: {location['lat']}, {location['lng']}")
        elif data.get("status") == "REQUEST_DENIED":
            print("❌ Geocoding API: Access denied")
            print("   Please enable 'Geocoding API' in Google Cloud Console")
            return False
        else:
            print(f"⚠️ Geocoding API: {data.get('status')}")
            return False
        
        # Test Places API
        print("\n🔍 Testing Places API...")
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{location['lat']},{location['lng']}",
            "radius": 5000,
            "keyword": "electrician",
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=15)
        data = response.json()
        
        if data.get("status") == "OK":
            results = data.get("results", [])
            print(f"✅ Places API: Working!")
            print(f"   Found {len(results)} businesses near Gulshan")
            
            if results:
                print("\n📋 Sample Results:")
                for i, place in enumerate(results[:3], 1):
                    print(f"\n   {i}. {place.get('name')}")
                    print(f"      Address: {place.get('vicinity')}")
                    print(f"      Rating: {place.get('rating', 'N/A')}/5")
                    print(f"      Reviews: {place.get('user_ratings_total', 0)}")
        elif data.get("status") == "REQUEST_DENIED":
            print("❌ Places API: Access denied")
            print("   Please enable 'Places API' in Google Cloud Console")
            return False
        elif data.get("status") == "ZERO_RESULTS":
            print("⚠️ Places API: No results found")
            print("   API is working but no businesses found in this area")
        else:
            print(f"⚠️ Places API: {data.get('status')}")
            return False
        
        print("\n" + "=" * 60)
        print("✅ Google Places API is configured correctly!")
        print("🚀 Ready to search REAL businesses!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing API: {e}")
        return False

if __name__ == "__main__":
    test_api_key()

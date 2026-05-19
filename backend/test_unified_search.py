"""
Test Challenge 2: Unified Provider Search
Tests both registered and OSM provider search
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_unified_search():
    print("🧪 Testing Challenge 2: Unified Provider Search\n")
    
    # Test 1: Search with registered providers available
    print("=" * 60)
    print("TEST 1: Search for Electrician in Shah Latif Town")
    print("=" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/unified/search",
        params={
            "service_type": "Electrician",
            "location": "Shah Latif Town",
            "min_results": 3
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Search successful!")
        print(f"📊 Results:")
        print(f"   - Registered providers: {len(data['registered_providers'])}")
        print(f"   - External (OSM) providers: {len(data['external_providers'])}")
        print(f"   - Total unified results: {data['total_results']}")
        print(f"   - Sources used: {', '.join(data['sources_used'])}")
        print(f"   - Duration: {data['duration_ms']}ms")
        
        print(f"\n🎯 Top 3 Providers:")
        for i, provider in enumerate(data['unified_providers'][:3], 1):
            print(f"\n   #{i} - {provider['name']}")
            print(f"      Source: {provider['source_label']}")
            print(f"      Service: {provider['service_type']}")
            print(f"      Area: {provider.get('area', 'N/A')}")
            print(f"      Distance: {provider.get('distance_km', 'N/A')} km")
            print(f"      Phone: {provider.get('phone', 'Not available')}")
            print(f"      Trust Score: {provider.get('trust_score', 'N/A')}")
            print(f"      Rank Score: {provider.get('rank_score', 'N/A')}")
    else:
        print(f"❌ Search failed: {response.status_code}")
        print(response.text)
    
    # Test 2: Search for service with few registered providers
    print("\n\n" + "=" * 60)
    print("TEST 2: Search for AC Technician in Gulshan-e-Iqbal")
    print("(Should trigger OSM fallback)")
    print("=" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/unified/search",
        params={
            "service_type": "AC Technician",
            "location": "Gulshan-e-Iqbal",
            "min_results": 5
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Search successful!")
        print(f"📊 Results:")
        print(f"   - Registered providers: {len(data['registered_providers'])}")
        print(f"   - External (OSM) providers: {len(data['external_providers'])}")
        print(f"   - Total unified results: {data['total_results']}")
        print(f"   - Sources used: {', '.join(data['sources_used'])}")
        
        if data['external_providers']:
            print(f"\n🗺️ OSM Providers Found:")
            for provider in data['external_providers'][:3]:
                print(f"   - {provider['name']}")
                print(f"     Address: {provider.get('address', 'N/A')}")
                print(f"     Distance: {provider.get('distance_km')} km")
                print(f"     Phone: {provider.get('phone', 'Not available')}")
    else:
        print(f"❌ Search failed: {response.status_code}")
        print(response.text)
    
    # Test 3: Search in area with no registered providers
    print("\n\n" + "=" * 60)
    print("TEST 3: Search for Plumber in Clifton")
    print("(Should rely heavily on OSM)")
    print("=" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/unified/search",
        params={
            "service_type": "Plumber",
            "location": "Clifton, Karachi",
            "min_results": 3
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Search successful!")
        print(f"📊 Total results: {data['total_results']}")
        print(f"   Sources: {', '.join(data['sources_used'])}")
        
        print(f"\n📋 All Providers (Ranked):")
        for provider in data['unified_providers'][:5]:
            print(f"\n   {provider['rank']}. {provider['name']} {provider['source_label']}")
            print(f"      Distance: {provider.get('distance_km')} km")
            print(f"      Rank Score: {provider.get('rank_score')}")
    else:
        print(f"❌ Search failed: {response.status_code}")
        print(response.text)
    
    print("\n\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_unified_search()

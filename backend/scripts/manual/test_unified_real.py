import requests

print("🧪 Testing Unified Search with REAL Google Places Data\n")
print("=" * 70)

# Test with coordinates (Gulshan area)
response = requests.post(
    "http://localhost:8000/api/unified/search",
    params={
        "service_type": "Electrician",
        "location": "Gulshan-e-Iqbal",
        "user_latitude": 24.917218,
        "user_longitude": 67.0923866,
        "min_results": 5
    }
)

print(f"Status: {response.status_code}\n")

if response.status_code == 200:
    data = response.json()
    
    print("📊 RESULTS:")
    print(f"   ✅ Registered: {len(data['registered_providers'])}")
    print(f"   🌍 Google Places: {len(data['external_providers'])}")
    print(f"   📈 Total: {data['total_results']}")
    print(f"   ⏱️ Duration: {data['duration_ms']}ms")
    print(f"\n📍 Sources: {', '.join(data['sources_used'])}")
    
    print("\n" + "=" * 70)
    print("🎯 TOP 5 PROVIDERS (REAL DATA!):")
    print("=" * 70)
    
    for i, p in enumerate(data['unified_providers'][:5], 1):
        print(f"\n#{i} - {p['name']} {p['source_label']}")
        print(f"    📍 Area: {p.get('area', 'N/A')}")
        print(f"    📏 Distance: {p.get('distance_km', 'N/A')} km")
        print(f"    📞 Phone: {p.get('phone', 'Not available')}")
        
        if p.get('rating'):
            print(f"    ⭐ Rating: {p['rating']}/5")
        if p.get('total_reviews'):
            print(f"    💬 Reviews: {p['total_reviews']}")
        
        print(f"    🎯 Score: {p.get('rank_score', 'N/A')}")
        print(f"    🔒 Trust: {int(p.get('trust_score', 0) * 100)}%")
        
        if p.get('address'):
            print(f"    🏠 Address: {p['address']}")
    
    print("\n" + "=" * 70)
    print("✅ SUCCESS! Real businesses from Google Places!")
    print("=" * 70)
    
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)

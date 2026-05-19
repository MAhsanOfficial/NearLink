import requests

print("🧪 Direct Google Places API Test\n")
print("=" * 70)

# Force Google Places search by setting min_results high
response = requests.post(
    "http://localhost:8000/api/unified/search",
    params={
        "service_type": "Electrician",
        "location": "Gulshan-e-Iqbal, Karachi",
        "user_latitude": 24.917218,
        "user_longitude": 67.0923866,
        "min_results": 10  # Force Google Places search
    }
)

print(f"Status: {response.status_code}\n")

if response.status_code == 200:
    data = response.json()
    
    print("📊 RESULTS:")
    print(f"   ✅ Registered: {len(data['registered_providers'])}")
    print(f"   🌍 Google Places: {len(data['external_providers'])}")
    print(f"   📈 Total: {data['total_results']}")
    print(f"\n📍 Sources Used:")
    for source in data['sources_used']:
        print(f"   - {source}")
    
    if data['external_providers']:
        print("\n" + "=" * 70)
        print("🌍 REAL BUSINESSES FROM GOOGLE PLACES:")
        print("=" * 70)
        
        for i, p in enumerate(data['external_providers'][:5], 1):
            print(f"\n{i}. {p['name']}")
            print(f"   📍 {p.get('address', 'N/A')}")
            print(f"   📏 {p.get('distance_km', 'N/A')} km away")
            print(f"   📞 {p.get('phone', 'Not available')}")
            if p.get('rating'):
                print(f"   ⭐ {p['rating']}/5 ({p.get('total_reviews', 0)} reviews)")
            print(f"   🔒 Trust: {int(p.get('trust_score', 0) * 100)}%")
        
        print("\n" + "=" * 70)
        print("✅ SUCCESS! Got REAL data from Google Places API!")
        print("=" * 70)
    else:
        print("\n⚠️ No external providers found")
        print("Check if Google Places API is enabled")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)

import requests

# Test with coordinates (faster)
response = requests.post(
    "http://localhost:8000/api/unified/search",
    params={
        "service_type": "Electrician",
        "location": "Gulshan",
        "user_latitude": 24.9145,
        "user_longitude": 67.0924,
        "min_results": 3
    }
)

print("Status:", response.status_code)
if response.status_code == 200:
    data = response.json()
    print(f"\n✅ Results:")
    print(f"   Registered: {len(data['registered_providers'])}")
    print(f"   External: {len(data['external_providers'])}")
    print(f"   Total: {data['total_results']}")
    print(f"   Sources: {data['sources_used']}")
    
    print(f"\n🎯 Top Providers:")
    for p in data['unified_providers'][:5]:
        print(f"   {p['rank']}. {p['name']} {p['source_label']}")
        print(f"      Distance: {p['distance_km']}km, Score: {p['rank_score']}")
else:
    print("Error:", response.text)

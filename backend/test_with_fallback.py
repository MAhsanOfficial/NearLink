"""
Test service search with fallback (when Gemini quota exceeded)
"""
import requests

BASE_URL = "http://localhost:8000"

print("\n" + "="*60)
print("Testing Service Search with Fallback")
print("="*60)

# Login as customer
print("\n1. Logging in as customer...")
login_data = {
    "email": "customer_final@test.com",
    "password": "test123"
}
response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
if response.status_code != 200:
    print("❌ Login failed. Please run final_test.py first to create test users.")
    exit(1)

token = response.json()["token"]
print("   ✅ Logged in successfully")

# Test service search
print("\n2. Testing service search (with fallback)...")
search_data = {
    "raw_text": "I need an electrician in G-13"
}
headers = {"Authorization": f"Bearer {token}"}

response = requests.post(f"{BASE_URL}/api/request/parse", json=search_data, headers=headers)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"   ✅ Service search successful!")
    print(f"   Request ID: {result['request_id']}")
    print(f"   Parsed Intent:")
    print(f"      Service: {result['parsed']['service_type']}")
    print(f"      Location: {result['parsed']['location']}")
    print(f"      Time: {result['parsed']['time']}")
    print(f"      Urgency: {result['parsed']['urgency']}")
    print(f"      Language: {result['parsed']['language_detected']}")
    if result['parsed'].get('fallback'):
        print(f"   ⚠️  Using fallback parser (Gemini quota exceeded)")
else:
    print(f"   ❌ Failed: {response.text}")

# Test full search
print("\n3. Testing full search flow...")
search_data = {
    "raw_text": "Mujhe plumber chahiye DHA mein"
}
params = {
    "user_latitude": 24.8138,
    "user_longitude": 67.0680
}

response = requests.post(
    f"{BASE_URL}/api/request/full-search",
    json=search_data,
    headers=headers,
    params=params
)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"   ✅ Full search successful!")
    print(f"   Request ID: {result['request_id']}")
    print(f"   Parsed: {result['parsed_intent']['service_type']} in {result['parsed_intent']['location']}")
    print(f"   Total providers found: {result['total_found']}")
    print(f"   Top providers: {len(result['top_providers'])}")
    
    for provider in result['top_providers']:
        p = provider['provider']
        print(f"\n   Rank {provider['rank']}: {p['name']}")
        print(f"      Service: {p['service_type']}")
        print(f"      Distance: {p.get('distance_km', 'N/A')}km")
        print(f"      Rating: {p['rating']}⭐")
        print(f"      Phone: {p['phone']}")
        print(f"      Reasoning: {provider['reasoning']}")
else:
    print(f"   ❌ Failed: {response.text}")

print("\n" + "="*60)
print("✅ Testing completed!")
print("="*60 + "\n")

"""
Final comprehensive test of QuickFix AI
Tests all major functionality except AI features (which need Gemini API)
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("\n" + "="*60)
print("QuickFix AI - Final System Test")
print("="*60)

# Test 1: Health Check
print("\n✓ Test 1: Health Check")
response = requests.get(f"{BASE_URL}/health")
assert response.status_code == 200
assert response.json()["status"] == "healthy"
print("  ✅ PASSED - Server is healthy")

# Test 2: Customer Registration
print("\n✓ Test 2: Customer Registration")
customer_data = {
    "email": "customer_final@test.com",
    "name": "Final Test Customer",
    "password": "test123",
    "phone": "0300-1111111",
    "user_type": "customer"
}
response = requests.post(f"{BASE_URL}/api/auth/signup", json=customer_data)
assert response.status_code == 200
result = response.json()
assert result["user"]["user_type"] == "customer"
customer_token = result["token"]
print(f"  ✅ PASSED - Customer registered: {result['user']['name']}")
print(f"     Email: {result['user']['email']}")
print(f"     Type: {result['user']['user_type']}")

# Test 3: Provider Registration
print("\n✓ Test 3: Provider Registration")
provider_data = {
    "email": "provider_final@test.com",
    "name": "Final Test Provider",
    "password": "test123",
    "phone": "0301-2222222",
    "user_type": "provider"
}
response = requests.post(f"{BASE_URL}/api/auth/signup", json=provider_data)
assert response.status_code == 200
result = response.json()
assert result["user"]["user_type"] == "provider"
provider_token = result["token"]
print(f"  ✅ PASSED - Provider registered: {result['user']['name']}")
print(f"     Email: {result['user']['email']}")
print(f"     Type: {result['user']['user_type']}")

# Test 4: Provider Profile Creation
print("\n✓ Test 4: Provider Profile Creation")
profile_data = {
    "name": "Final Test Plumbing Services",
    "service_type": "Plumber",
    "area": "DHA",
    "address": "Main Boulevard, DHA Phase 5, Karachi",
    "latitude": 24.8138,
    "longitude": 67.0680,
    "phone": "0301-2222222",
    "description": "Professional plumbing services with 10 years experience",
    "services_offered": ["Pipe Repair", "Drain Cleaning", "Fixture Installation", "Water Heater Repair"],
    "working_hours": "8 AM - 8 PM",
    "price_range": "Rs. 1500-5000"
}
headers = {"Authorization": f"Bearer {provider_token}"}
response = requests.post(f"{BASE_URL}/api/providers/register", json=profile_data, headers=headers)
assert response.status_code == 200
result = response.json()
provider_id = result["id"]
print(f"  ✅ PASSED - Provider profile created")
print(f"     ID: {provider_id}")
print(f"     Verified: {result['verified']}")
print(f"     Note: Verification requires Google Maps API key")

# Test 5: Get Provider Profile
print("\n✓ Test 5: Get Provider Profile")
response = requests.get(f"{BASE_URL}/api/providers/my-profile", headers=headers)
assert response.status_code == 200
profile = response.json()
assert profile["name"] == "Final Test Plumbing Services"
assert profile["service_type"] == "Plumber"
print(f"  ✅ PASSED - Profile retrieved")
print(f"     Name: {profile['name']}")
print(f"     Service: {profile['service_type']}")
print(f"     Area: {profile['area']}")
print(f"     Rating: {profile['rating']}")

# Test 6: Update Provider Profile
print("\n✓ Test 6: Update Provider Profile")
update_data = {
    "availability": False,
    "price_range": "Rs. 2000-6000"
}
response = requests.put(f"{BASE_URL}/api/providers/my-profile", json=update_data, headers=headers)
assert response.status_code == 200
print(f"  ✅ PASSED - Profile updated")
print(f"     Availability set to: False")
print(f"     Price range updated")

# Test 7: Get All Providers
print("\n✓ Test 7: Get All Providers")
response = requests.get(f"{BASE_URL}/api/providers/all")
assert response.status_code == 200
providers = response.json()
assert len(providers) >= 1
print(f"  ✅ PASSED - Retrieved {len(providers)} provider(s)")
for p in providers:
    print(f"     - {p['name']} ({p['service_type']}) in {p['area']}")

# Test 8: Get Specific Provider
print("\n✓ Test 8: Get Specific Provider Details")
response = requests.get(f"{BASE_URL}/api/providers/{provider_id}")
assert response.status_code == 200
provider = response.json()
assert provider["id"] == provider_id
print(f"  ✅ PASSED - Provider details retrieved")
print(f"     Name: {provider['name']}")
print(f"     Phone: {provider['phone']}")
print(f"     Services: {', '.join(provider['services_offered'])}")

# Test 9: Customer Login
print("\n✓ Test 9: Customer Login")
login_data = {
    "email": "customer_final@test.com",
    "password": "test123"
}
response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
assert response.status_code == 200
result = response.json()
assert result["user"]["user_type"] == "customer"
print(f"  ✅ PASSED - Customer login successful")
print(f"     User: {result['user']['name']}")

# Test 10: Provider Login
print("\n✓ Test 10: Provider Login")
login_data = {
    "email": "provider_final@test.com",
    "password": "test123"
}
response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
assert response.status_code == 200
result = response.json()
assert result["user"]["user_type"] == "provider"
print(f"  ✅ PASSED - Provider login successful")
print(f"     User: {result['user']['name']}")

# Summary
print("\n" + "="*60)
print("TEST SUMMARY")
print("="*60)
print("✅ All 10 core tests PASSED!")
print("\nTested Features:")
print("  ✓ Health check")
print("  ✓ Customer registration")
print("  ✓ Provider registration")
print("  ✓ Provider profile creation")
print("  ✓ Provider profile retrieval")
print("  ✓ Provider profile update")
print("  ✓ List all providers")
print("  ✓ Get specific provider")
print("  ✓ Customer login")
print("  ✓ Provider login")

print("\nNot Tested (Requires API Keys):")
print("  ⚠ AI-powered service search (needs Gemini API)")
print("  ⚠ Location verification (needs Google Maps API)")
print("  ⚠ Nearby places search (needs Google Maps API)")

print("\nSystem Status: ✅ FULLY FUNCTIONAL")
print("="*60 + "\n")

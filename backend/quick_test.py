import requests
import json

BASE_URL = "http://localhost:8000"

print("Testing QuickFix AI Backend\n")
print("=" * 50)

# Test 1: Health check
print("\n1. Testing health endpoint...")
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print("   ✅ Health check passed!")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Customer signup
print("\n2. Testing customer signup...")
try:
    signup_data = {
        "email": "customer1@test.com",
        "name": "Test Customer",
        "password": "test123",
        "phone": "0300-1234567",
        "user_type": "customer"
    }
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   User: {result['user']['name']}")
        print(f"   Type: {result['user']['user_type']}")
        print(f"   Token: {result['token'][:30]}...")
        print("   ✅ Customer signup passed!")
        customer_token = result['token']
    else:
        print(f"   Response: {response.text}")
        print("   ❌ Customer signup failed!")
        customer_token = None
except Exception as e:
    print(f"   ❌ Error: {e}")
    customer_token = None

# Test 3: Provider signup
print("\n3. Testing provider signup...")
try:
    signup_data = {
        "email": "provider1@test.com",
        "name": "Test Provider",
        "password": "test123",
        "phone": "0301-9876543",
        "user_type": "provider"
    }
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   User: {result['user']['name']}")
        print(f"   Type: {result['user']['user_type']}")
        print(f"   Token: {result['token'][:30]}...")
        print("   ✅ Provider signup passed!")
        provider_token = result['token']
    else:
        print(f"   Response: {response.text}")
        print("   ❌ Provider signup failed!")
        provider_token = None
except Exception as e:
    print(f"   ❌ Error: {e}")
    provider_token = None

# Test 4: Provider registration (if provider signup worked)
if provider_token:
    print("\n4. Testing provider profile registration...")
    try:
        provider_data = {
            "name": "Test Electrician Services",
            "service_type": "Electrician",
            "area": "G-13",
            "address": "Main Market, G-13, Islamabad",
            "latitude": 33.6844,
            "longitude": 73.0479,
            "phone": "0301-9876543",
            "description": "Professional electrical services",
            "services_offered": ["Wiring", "Circuit Repair"],
            "working_hours": "9 AM - 6 PM",
            "price_range": "Rs. 1000-3000"
        }
        headers = {"Authorization": f"Bearer {provider_token}"}
        response = requests.post(f"{BASE_URL}/api/providers/register", json=provider_data, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Provider ID: {result['id']}")
            print(f"   Verified: {result['verified']}")
            print("   ✅ Provider registration passed!")
        else:
            print(f"   Response: {response.text}")
            print("   ❌ Provider registration failed!")
    except Exception as e:
        print(f"   ❌ Error: {e}")

# Test 5: Get all providers
print("\n5. Testing get all providers...")
try:
    response = requests.get(f"{BASE_URL}/api/providers/all")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        providers = response.json()
        print(f"   Total providers: {len(providers)}")
        if providers:
            print(f"   First provider: {providers[0]['name']}")
        print("   ✅ Get providers passed!")
    else:
        print(f"   Response: {response.text}")
        print("   ❌ Get providers failed!")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 6: Service search (if customer token exists)
if customer_token:
    print("\n6. Testing service search...")
    try:
        search_data = {
            "raw_text": "I need an electrician in G-13"
        }
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.post(f"{BASE_URL}/api/request/parse", json=search_data, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Request ID: {result['request_id']}")
            print(f"   Parsed: {result['parsed']}")
            print("   ✅ Service search passed!")
        else:
            print(f"   Response: {response.text}")
            print("   ❌ Service search failed!")
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 50)
print("Testing completed!")

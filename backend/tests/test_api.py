"""
Test script for QuickFix AI API endpoints
Run: python test_api.py
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_provider_registration():
    """Test complete provider registration flow"""
    print("\n=== Testing Provider Registration ===\n")
    
    # 1. Register provider user
    print("1. Registering provider user...")
    signup_data = {
        "email": "testprovider@example.com",
        "name": "Test Provider",
        "password": "test123",
        "phone": "0300-1234567",
        "user_type": "provider"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    if response.status_code == 200:
        result = response.json()
        token = result["token"]
        print(f"✅ User registered: {result['user']['name']}")
        print(f"   Token: {token[:20]}...")
    else:
        print(f"❌ Registration failed: {response.text}")
        return
    
    # 2. Create provider profile
    print("\n2. Creating provider profile...")
    provider_data = {
        "name": "Test Electrician Services",
        "service_type": "Electrician",
        "area": "G-13",
        "address": "Main Market, G-13, Islamabad",
        "latitude": 33.6844,
        "longitude": 73.0479,
        "phone": "0300-1234567",
        "description": "Professional electrical services",
        "services_offered": ["Wiring", "Circuit Repair", "Appliance Installation"],
        "working_hours": "9 AM - 6 PM",
        "price_range": "Rs. 1000-3000"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/providers/register", json=provider_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Provider registered: {result['id']}")
        print(f"   Verified: {result['verified']}")
        if result.get('verification_details'):
            print(f"   Verification: {json.dumps(result['verification_details'], indent=2)}")
    else:
        print(f"❌ Provider registration failed: {response.text}")
        return
    
    # 3. Get provider profile
    print("\n3. Fetching provider profile...")
    response = requests.get(f"{BASE_URL}/api/providers/my-profile", headers=headers)
    
    if response.status_code == 200:
        profile = response.json()
        print(f"✅ Profile retrieved:")
        print(f"   Name: {profile['name']}")
        print(f"   Service: {profile['service_type']}")
        print(f"   Area: {profile['area']}")
        print(f"   Rating: {profile['rating']}")
        print(f"   Verified: {profile['verified']}")
    else:
        print(f"❌ Failed to get profile: {response.text}")


def test_customer_search():
    """Test customer service search flow"""
    print("\n=== Testing Customer Service Search ===\n")
    
    # 1. Register customer user
    print("1. Registering customer user...")
    signup_data = {
        "email": "testcustomer@example.com",
        "name": "Test Customer",
        "password": "test123",
        "phone": "0301-9876543",
        "user_type": "customer"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    if response.status_code == 200:
        result = response.json()
        token = result["token"]
        print(f"✅ Customer registered: {result['user']['name']}")
    else:
        print(f"❌ Registration failed: {response.text}")
        return
    
    # 2. Search for service
    print("\n2. Searching for electrician...")
    search_data = {
        "raw_text": "I need an electrician in G-13"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "user_latitude": 33.6844,
        "user_longitude": 73.0479
    }
    
    response = requests.post(
        f"{BASE_URL}/api/request/full-search",
        json=search_data,
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Search completed:")
        print(f"   Request ID: {result['request_id']}")
        print(f"   Parsed Intent: {json.dumps(result['parsed_intent'], indent=2)}")
        print(f"   Total Found: {result['total_found']}")
        print(f"\n   Top Providers:")
        for provider in result['top_providers']:
            p = provider['provider']
            print(f"   - Rank {provider['rank']}: {p['name']}")
            print(f"     Distance: {p['distance_km']}km")
            print(f"     Rating: {p['rating']}⭐")
            print(f"     Phone: {p['phone']}")
            print(f"     Verified: {p['verified']}")
            print(f"     Reasoning: {provider['reasoning']}\n")
    else:
        print(f"❌ Search failed: {response.text}")


def test_maps_search():
    """Test search with maps integration"""
    print("\n=== Testing Maps Integration ===\n")
    
    # Login as customer
    login_data = {
        "email": "testcustomer@example.com",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Login failed. Run test_customer_search first.")
        return
    
    token = response.json()["token"]
    
    # Search with maps
    print("Searching with maps integration...")
    search_data = {
        "service_type": "Electrician",
        "location": "G-13",
        "user_latitude": 33.6844,
        "user_longitude": 73.0479
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/providers/search-with-maps",
        json=search_data,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Maps search completed:")
        print(f"   Registered Providers: {result['registered_count']}")
        print(f"   Nearby Map Results: {len(result['nearby_map_results'])}")
        print(f"\n   Message: {result['message']}")
        
        if result['registered_providers']:
            print(f"\n   Top Registered Providers:")
            for p in result['registered_providers']:
                print(f"   - {p['name']} ({p['distance_km']}km, {p['rating']}⭐)")
        
        if result['nearby_map_results']:
            print(f"\n   Nearby from Maps:")
            for p in result['nearby_map_results']:
                print(f"   - {p['name']} ({p['distance_km']}km, {p['rating']}⭐)")
    else:
        print(f"❌ Maps search failed: {response.text}")


if __name__ == "__main__":
    print("QuickFix AI - API Testing")
    print("=" * 50)
    
    try:
        # Test provider flow
        test_provider_registration()
        
        # Test customer flow
        test_customer_search()
        
        # Test maps integration
        test_maps_search()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API server.")
        print("   Make sure the backend is running: uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

import requests
import json

# Test customer signup with location
signup_data = {
    "name": "Test Customer",
    "email": f"testcustomer{__import__('random').randint(1000,9999)}@example.com",
    "password": "password123",
    "phone": "0300-1234567",
    "user_type": "customer",
    "area": "Shah Latif Town",
    "address": "House 123, Street 5, Shah Latif Town, Karachi",
    "latitude": 24.9056,
    "longitude": 67.0822
}

print("🧪 Testing customer signup with location...")
print(f"📧 Email: {signup_data['email']}")
print(f"📍 Location: {signup_data['area']}")

response = requests.post("http://localhost:8000/api/auth/signup", json=signup_data)

if response.status_code == 200:
    result = response.json()
    print("\n✅ Signup successful!")
    print(f"👤 User ID: {result['user']['id']}")
    print(f"📧 Email: {result['user']['email']}")
    print(f"🔑 Token: {result['token'][:50]}...")
    print("\n✅ Customer location saved successfully!")
else:
    print(f"\n❌ Signup failed: {response.status_code}")
    print(response.text)

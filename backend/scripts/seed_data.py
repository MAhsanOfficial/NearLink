"""
Seed data for NearLink - Includes Users and Providers.
Password for all seeded accounts: 12345678
"""
import asyncio
import uuid
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import delete
from database import async_session, init_db
from models import User, Provider, Booking, ServiceRequest, Notification, AgentTrace

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD_HASH = pwd_context.hash("12345678")

# Default Customer Accounts
CUSTOMERS = [
    {
        "email": "customer@nearlink.com",
        "name": "Okasha Customer",
        "phone": "0300-1112233",
        "user_type": "customer",
        "area": "G-13",
        "address": "House 123, Street 4, G-13/2, Islamabad",
        "latitude": 33.6844,
        "longitude": 73.0479
    },
    {
        "email": "user@test.com",
        "name": "Test User",
        "phone": "0311-5556677",
        "user_type": "customer",
        "area": "F-10",
        "address": "Apartment 5, Silver Oaks, F-10, Islamabad",
        "latitude": 33.6939,
        "longitude": 73.0036
    }
]

# Default Provider Accounts & Their Profiles
PROVIDERS = [
    {
        "user": {
            "email": "ahmed@nearlink.com",
            "name": "Ahmed Ali",
            "phone": "0300-1234567",
            "user_type": "provider",
            "area": "G-13",
            "address": "Street 5, G-13/1, Islamabad",
            "latitude": 33.6844,
            "longitude": 73.0479
        },
        "profile": {
            "name": "Ahmed AC Services",
            "service_type": "AC Repair",
            "area": "G-13",
            "address": "Street 5, G-13/1, Islamabad",
            "latitude": 33.6844,
            "longitude": 73.0479,
            "distance_km": 1.2,
            "rating": 4.8,
            "total_reviews": 45,
            "availability": True,
            "price_range": "Rs. 2000-5000",
            "phone": "0300-1234567",
            "description": "Professional AC repair and maintenance",
            "services_offered": ["AC Installation", "AC Repair", "AC Maintenance"],
            "working_hours": "9 AM - 7 PM",
            "verified": True
        }
    },
    {
        "user": {
            "email": "kamran@nearlink.com",
            "name": "Kamran AC",
            "phone": "0300-9998887",
            "user_type": "provider",
            "area": "G-13",
            "address": "G-13 Markaz, Islamabad",
            "latitude": 33.6855,
            "longitude": 73.0490
        },
        "profile": {
            "name": "Kamran Cool Tech",
            "service_type": "AC Repair",
            "area": "G-13",
            "address": "G-13 Markaz, Islamabad",
            "latitude": 33.6855,
            "longitude": 73.0490,
            "distance_km": 0.5,
            "rating": 4.9,
            "total_reviews": 12,
            "availability": True,
            "price_range": "Rs. 1500-4000",
            "phone": "0300-9998887",
            "description": "Fast and reliable AC services in G-13",
            "services_offered": ["AC Gas Refill", "AC Cleaning"],
            "working_hours": "10 AM - 10 PM",
            "verified": True
        }
    },
    {
        "user": {
            "email": "usman@nearlink.com",
            "name": "Usman Khan",
            "phone": "0302-3456789",
            "user_type": "provider",
            "area": "G-13",
            "address": "Main Market, G-13, Islamabad",
            "latitude": 33.6850,
            "longitude": 73.0485
        },
        "profile": {
            "name": "Usman Electricals",
            "service_type": "Electrician",
            "area": "G-13",
            "address": "Main Market, G-13, Islamabad",
            "latitude": 33.6850,
            "longitude": 73.0485,
            "distance_km": 0.8,
            "rating": 4.6,
            "total_reviews": 32,
            "availability": True,
            "price_range": "Rs. 1000-3000",
            "phone": "0302-3456789",
            "description": "Licensed electrician for all electrical work",
            "services_offered": ["Wiring", "Circuit Repair", "Appliance Installation"],
            "working_hours": "8 AM - 8 PM",
            "verified": True
        }
    },
    {
        "user": {
            "email": "tariq@nearlink.com",
            "name": "Tariq Mahmood",
            "phone": "0303-4567890",
            "user_type": "provider",
            "area": "G-13",
            "address": "G-13/2, Islamabad",
            "latitude": 33.6838,
            "longitude": 73.0472
        },
        "profile": {
            "name": "Tariq Plumbing Works",
            "service_type": "Plumber",
            "area": "G-13",
            "address": "G-13/2, Islamabad",
            "latitude": 33.6838,
            "longitude": 73.0472,
            "distance_km": 1.5,
            "rating": 4.4,
            "total_reviews": 28,
            "availability": True,
            "price_range": "Rs. 1500-4500",
            "phone": "0303-4567890",
            "description": "Expert plumbing services",
            "services_offered": ["Pipe Repair", "Drain Cleaning", "Fixture Installation"],
            "working_hours": "7 AM - 6 PM",
            "verified": True
        }
    },
    {
        "user": {
            "email": "muneeb@nearlink.com",
            "name": "Muneeb Khan",
            "phone": "0312-1122334",
            "user_type": "provider",
            "area": "F-11",
            "address": "Markaz F-11, Islamabad",
            "latitude": 33.6934,
            "longitude": 72.9861
        },
        "profile": {
            "name": "Muneeb Carpentry",
            "service_type": "Carpenter",
            "area": "F-11",
            "address": "Markaz F-11, Islamabad",
            "latitude": 33.6934,
            "longitude": 72.9861,
            "distance_km": 4.2,
            "rating": 4.9,
            "total_reviews": 15,
            "availability": True,
            "price_range": "Rs. 3000-8000",
            "phone": "0312-1122334",
            "description": "Custom furniture and repair works",
            "services_offered": ["Furniture Repair", "Door Polishing", "Cabinet Making"],
            "working_hours": "10 AM - 9 PM",
            "verified": True
        }
    },
    {
        "user": {
            "email": "shazia@nearlink.com",
            "name": "Shazia Bibi",
            "phone": "0333-9988776",
            "user_type": "provider",
            "area": "I-8",
            "address": "I-8/4, Islamabad",
            "latitude": 33.6701,
            "longitude": 73.0751
        },
        "profile": {
            "name": "Sparkle Cleaners",
            "service_type": "Cleaner",
            "area": "I-8",
            "address": "I-8/4, Islamabad",
            "latitude": 33.6701,
            "longitude": 73.0751,
            "distance_km": 8.5,
            "rating": 4.7,
            "total_reviews": 60,
            "availability": True,
            "price_range": "Rs. 1000-2500",
            "phone": "0333-9988776",
            "description": "Professional home and office cleaning",
            "services_offered": ["Deep Cleaning", "Sofa Cleaning", "Kitchen Sanitization"],
            "working_hours": "8 AM - 5 PM",
            "verified": True
        }
    }
]

async def seed():
    """Seed test users and providers"""
    print("🚀 Starting NearLink Seeding...")
    await init_db()
    
    async with async_session() as session:
        # 0. Clear Existing Data (in correct order for FKs)
        print("🧹 Cleaning up old data...")
        await session.execute(delete(AgentTrace))
        await session.execute(delete(Notification))
        await session.execute(delete(Booking))
        await session.execute(delete(ServiceRequest))
        await session.execute(delete(Provider))
        await session.execute(delete(User))
        await session.commit()
        
    async with async_session() as session:
        # 1. Seed Customers
        for c_data in CUSTOMERS:
            user = User(
                id=str(uuid.uuid4()),
                password_hash=DEFAULT_PASSWORD_HASH,
                created_at=datetime.utcnow(),
                **c_data
            )
            session.add(user)
            print(f"👤 Added Customer: {c_data['email']}")

        # 2. Seed Providers (User Account + Profile)
        for p_data in PROVIDERS:
            user_id = str(uuid.uuid4())
            user = User(
                id=user_id,
                password_hash=DEFAULT_PASSWORD_HASH,
                created_at=datetime.utcnow(),
                **p_data["user"]
            )
            session.add(user)
            await session.flush() # Ensure user is in DB before adding profile
            
            profile = Provider(
                id=str(uuid.uuid4()),
                user_id=user_id,
                created_at=datetime.utcnow(),
                **p_data["profile"]
            )
            session.add(profile)
            print(f"🔧 Added Provider: {p_data['user']['email']} (Profile: {p_data['profile']['name']})")

        await session.commit()
        print("\n✅ Seeding complete!")
        print("🔑 Password for all accounts: 12345678")
        print("\nTest Logins:")
        print("  Customer: customer@nearlink.com")
        print("  Provider: ahmed@nearlink.com")

if __name__ == "__main__":
    asyncio.run(seed())

"""
DEPRECATED: Mock seed data for testing only.

In production, providers register themselves through the /api/providers/register endpoint.
This file is kept only for development/testing purposes.

To use real data:
1. Register as a provider user (user_type="provider")
2. Create provider profile via POST /api/providers/register
3. Providers can manage their profile via /api/providers/my-profile

For testing, you can still run this script to populate sample data.
"""
import asyncio
import uuid
from database import async_session, init_db
from models import Provider

# Sample test data - DO NOT USE IN PRODUCTION
PROVIDERS = [
    # G-13 Area
    {"name": "Ahmed AC Services", "service_type": "AC Repair", "area": "G-13", "address": "Street 5, G-13/1, Islamabad", "latitude": 33.6844, "longitude": 73.0479, "distance_km": 1.2, "rating": 4.8, "total_reviews": 45, "availability": True, "price_range": "Rs. 2000-5000", "phone": "0300-1234567", "description": "Professional AC repair and maintenance", "services_offered": ["AC Installation", "AC Repair", "AC Maintenance"], "working_hours": "9 AM - 7 PM", "verified": False},
    {"name": "Usman Electricals", "service_type": "Electrician", "area": "G-13", "address": "Main Market, G-13, Islamabad", "latitude": 33.6850, "longitude": 73.0485, "distance_km": 0.8, "rating": 4.6, "total_reviews": 32, "availability": True, "price_range": "Rs. 1000-3000", "phone": "0302-3456789", "description": "Licensed electrician for all electrical work", "services_offered": ["Wiring", "Circuit Repair", "Appliance Installation"], "working_hours": "8 AM - 8 PM", "verified": False},
    {"name": "Tariq Plumbing Works", "service_type": "Plumber", "area": "G-13", "address": "G-13/2, Islamabad", "latitude": 33.6838, "longitude": 73.0472, "distance_km": 1.5, "rating": 4.4, "total_reviews": 28, "availability": True, "price_range": "Rs. 1500-4500", "phone": "0303-4567890", "description": "Expert plumbing services", "services_offered": ["Pipe Repair", "Drain Cleaning", "Fixture Installation"], "working_hours": "7 AM - 6 PM", "verified": False},
]


async def seed():
    """Seed test data - FOR DEVELOPMENT ONLY"""
    await init_db()
    async with async_session() as session:
        for p in PROVIDERS:
            provider = Provider(id=str(uuid.uuid4()), **p)
            session.add(provider)
        await session.commit()
        print(f"✅ Seeded {len(PROVIDERS)} TEST providers successfully!")
        print("⚠️  WARNING: This is test data. In production, use provider registration API.")


if __name__ == "__main__":
    asyncio.run(seed())

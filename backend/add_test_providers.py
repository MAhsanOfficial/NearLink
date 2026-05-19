"""
Add test providers to database
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, init_db
from models import Provider, User
import uuid
from datetime import datetime

async def add_test_providers():
    """Add test providers for testing"""
    
    await init_db()
    
    async for db in get_db():
        # Create test user for provider
        test_user = User(
            id=str(uuid.uuid4()),
            name="Test Provider User",
            email="testprovider@example.com",
            password="hashed_password",
            phone="0300-0000000",
            user_type="provider",
            created_at=datetime.utcnow()
        )
        db.add(test_user)
        await db.commit()
        
        # Test providers data
        test_providers = [
            {
                "name": "Ahmed Electricals",
                "service_type": "Electrician",
                "area": "Shah Latif Town",
                "address": "Main Road, Shah Latif Town, Karachi",
                "latitude": 24.9056,
                "longitude": 67.0822,
                "phone": "0321-1234567",
                "description": "Professional electrical services with 10 years experience",
                "services_offered": ["Wiring", "Circuit Repair", "Appliance Installation"],
                "working_hours": "9 AM - 6 PM",
                "price_range": "Rs. 1000-3000",
                "rating": 4.5,
                "total_reviews": 45
            },
            {
                "name": "Karachi Plumbing Services",
                "service_type": "Plumber",
                "area": "Shah Latif Town",
                "address": "Block 5, Shah Latif Town, Karachi",
                "latitude": 24.9066,
                "longitude": 67.0832,
                "phone": "0322-2345678",
                "description": "Expert plumbing solutions for all your needs",
                "services_offered": ["Pipe Repair", "Leak Fixing", "Drain Cleaning"],
                "working_hours": "8 AM - 8 PM",
                "price_range": "Rs. 800-2500",
                "rating": 4.7,
                "total_reviews": 67
            },
            {
                "name": "Cool Air AC Services",
                "service_type": "AC Repair",
                "area": "Gulshan",
                "address": "Gulshan-e-Iqbal, Block 13, Karachi",
                "latitude": 24.9207,
                "longitude": 67.0925,
                "phone": "0323-3456789",
                "description": "AC repair and maintenance specialists",
                "services_offered": ["AC Repair", "AC Installation", "AC Maintenance"],
                "working_hours": "9 AM - 7 PM",
                "price_range": "Rs. 1500-4000",
                "rating": 4.3,
                "total_reviews": 34
            },
            {
                "name": "Master Carpenter",
                "service_type": "Carpenter",
                "area": "DHA",
                "address": "DHA Phase 5, Karachi",
                "latitude": 24.8138,
                "longitude": 67.0680,
                "phone": "0324-4567890",
                "description": "Custom furniture and carpentry work",
                "services_offered": ["Furniture Making", "Door Repair", "Cabinet Installation"],
                "working_hours": "10 AM - 6 PM",
                "price_range": "Rs. 2000-5000",
                "rating": 4.6,
                "total_reviews": 28
            },
            {
                "name": "Quick Plumber Karachi",
                "service_type": "Plumber",
                "area": "Gulshan",
                "address": "Gulshan-e-Iqbal, Block 10, Karachi",
                "latitude": 24.9156,
                "longitude": 67.0878,
                "phone": "0325-5678901",
                "description": "24/7 emergency plumbing services",
                "services_offered": ["Emergency Repairs", "Pipe Installation", "Water Tank Cleaning"],
                "working_hours": "24/7",
                "price_range": "Rs. 1000-3500",
                "rating": 4.4,
                "total_reviews": 52
            }
        ]
        
        print("Adding test providers...")
        
        for provider_data in test_providers:
            provider = Provider(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                name=provider_data["name"],
                service_type=provider_data["service_type"],
                area=provider_data["area"],
                address=provider_data["address"],
                latitude=provider_data["latitude"],
                longitude=provider_data["longitude"],
                phone=provider_data["phone"],
                description=provider_data["description"],
                services_offered=provider_data["services_offered"],
                working_hours=provider_data["working_hours"],
                price_range=provider_data["price_range"],
                rating=provider_data["rating"],
                total_reviews=provider_data["total_reviews"],
                availability=True,
                verified=True,
                created_at=datetime.utcnow()
            )
            db.add(provider)
            print(f"✅ Added: {provider_data['name']} ({provider_data['service_type']})")
        
        await db.commit()
        print("\n✅ All test providers added successfully!")
        print("\nTest providers:")
        for p in test_providers:
            print(f"  - {p['name']} ({p['service_type']}) in {p['area']}")
        
        break

if __name__ == "__main__":
    asyncio.run(add_test_providers())

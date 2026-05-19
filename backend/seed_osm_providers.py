"""
Seed Mock OSM Providers - For Demo/Testing
Since OSM data is limited in Pakistan, we'll add mock external providers
"""
import asyncio
import uuid
from datetime import datetime
from database import async_session
from models import ExternalProvider

async def seed_osm_providers():
    print("🌍 Seeding Mock OSM Providers...\n")
    
    mock_providers = [
        # Gulshan-e-Iqbal Area
        {
            "osm_id": "node/123456789",
            "name": "City Electrical Works",
            "service_type": "Electrician",
            "area": "Gulshan-e-Iqbal",
            "address": "Block 13-D, Main University Road, Gulshan-e-Iqbal",
            "latitude": 24.9145,
            "longitude": 67.0924,
            "phone": "021-34982345",
            "website": None,
            "opening_hours": "9 AM - 8 PM",
            "trust_score": 0.7,
            "raw_data": {"shop": "electrical", "name": "City Electrical Works"}
        },
        {
            "osm_id": "node/123456790",
            "name": "Gulshan Plumbing Services",
            "service_type": "Plumber",
            "area": "Gulshan-e-Iqbal",
            "address": "Block 10, Gulshan-e-Iqbal",
            "latitude": 24.9200,
            "longitude": 67.0950,
            "phone": "0300-2345678",
            "website": None,
            "opening_hours": "24/7",
            "trust_score": 0.6,
            "raw_data": {"craft": "plumber", "name": "Gulshan Plumbing Services"}
        },
        {
            "osm_id": "node/123456791",
            "name": "Cool Air AC Repair",
            "service_type": "AC Technician",
            "area": "Gulshan-e-Iqbal",
            "address": "Block 7, Near Maskan Chowrangi",
            "latitude": 24.9180,
            "longitude": 67.0880,
            "phone": "021-34567890",
            "website": "www.coolair.pk",
            "opening_hours": "8 AM - 10 PM",
            "trust_score": 0.8,
            "raw_data": {"craft": "hvac", "name": "Cool Air AC Repair"}
        },
        
        # DHA Area
        {
            "osm_id": "node/123456792",
            "name": "DHA Electricals & Electronics",
            "service_type": "Electrician",
            "area": "DHA Phase 5",
            "address": "Commercial Area, DHA Phase 5",
            "latitude": 24.8100,
            "longitude": 67.0600,
            "phone": "021-35840123",
            "website": None,
            "opening_hours": "10 AM - 9 PM",
            "trust_score": 0.75,
            "raw_data": {"shop": "electrical", "name": "DHA Electricals"}
        },
        {
            "osm_id": "node/123456793",
            "name": "Premium Plumbing DHA",
            "service_type": "Plumber",
            "area": "DHA Phase 6",
            "address": "Khayaban-e-Sehar, DHA Phase 6",
            "latitude": 24.8050,
            "longitude": 67.0650,
            "phone": "0321-2345678",
            "website": None,
            "opening_hours": "9 AM - 7 PM",
            "trust_score": 0.65,
            "raw_data": {"craft": "plumber", "name": "Premium Plumbing"}
        },
        
        # Clifton Area
        {
            "osm_id": "node/123456794",
            "name": "Clifton Electrical Services",
            "service_type": "Electrician",
            "area": "Clifton",
            "address": "Block 2, Clifton",
            "latitude": 24.8138,
            "longitude": 67.0299,
            "phone": "021-35872345",
            "website": None,
            "opening_hours": "9 AM - 6 PM",
            "trust_score": 0.7,
            "raw_data": {"shop": "electrical", "name": "Clifton Electrical"}
        },
        {
            "osm_id": "node/123456795",
            "name": "Sea View Plumbers",
            "service_type": "Plumber",
            "area": "Clifton",
            "address": "Near Do Darya, Clifton",
            "latitude": 24.8100,
            "longitude": 67.0250,
            "phone": None,
            "website": None,
            "opening_hours": None,
            "trust_score": 0.4,
            "raw_data": {"craft": "plumber", "name": "Sea View Plumbers"}
        },
        
        # North Nazimabad
        {
            "osm_id": "node/123456796",
            "name": "Nazimabad Electrical Shop",
            "service_type": "Electrician",
            "area": "North Nazimabad",
            "address": "Block L, North Nazimabad",
            "latitude": 24.9300,
            "longitude": 67.0400,
            "phone": "021-36720123",
            "website": None,
            "opening_hours": "9 AM - 9 PM",
            "trust_score": 0.65,
            "raw_data": {"shop": "electrical", "name": "Nazimabad Electrical"}
        },
        {
            "osm_id": "node/123456797",
            "name": "Quick Fix Plumbing",
            "service_type": "Plumber",
            "area": "North Nazimabad",
            "address": "Block N, North Nazimabad",
            "latitude": 24.9350,
            "longitude": 67.0450,
            "phone": "0300-3456789",
            "website": None,
            "opening_hours": "24/7",
            "trust_score": 0.7,
            "raw_data": {"craft": "plumber", "name": "Quick Fix Plumbing"}
        },
        
        # Malir Area
        {
            "osm_id": "node/123456798",
            "name": "Malir Electricals",
            "service_type": "Electrician",
            "area": "Malir",
            "address": "Main Malir Road",
            "latitude": 24.8900,
            "longitude": 67.2000,
            "phone": "021-34450123",
            "website": None,
            "opening_hours": "8 AM - 8 PM",
            "trust_score": 0.6,
            "raw_data": {"shop": "electrical", "name": "Malir Electricals"}
        },
        
        # Korangi Area
        {
            "osm_id": "node/123456799",
            "name": "Korangi AC Services",
            "service_type": "AC Technician",
            "area": "Korangi",
            "address": "Korangi Industrial Area",
            "latitude": 24.8500,
            "longitude": 67.1100,
            "phone": "021-35070123",
            "website": None,
            "opening_hours": "9 AM - 7 PM",
            "trust_score": 0.65,
            "raw_data": {"craft": "hvac", "name": "Korangi AC Services"}
        },
        
        # Saddar Area
        {
            "osm_id": "node/123456800",
            "name": "Saddar Electrical Mart",
            "service_type": "Electrician",
            "area": "Saddar",
            "address": "Empress Market, Saddar",
            "latitude": 24.8607,
            "longitude": 67.0099,
            "phone": "021-32720456",
            "website": None,
            "opening_hours": "10 AM - 10 PM",
            "trust_score": 0.75,
            "raw_data": {"shop": "electrical", "name": "Saddar Electrical"}
        },
        
        # Carpenter Services
        {
            "osm_id": "node/123456801",
            "name": "Master Carpenter Works",
            "service_type": "Carpenter",
            "area": "Gulshan-e-Iqbal",
            "address": "Block 15, Gulshan-e-Iqbal",
            "latitude": 24.9170,
            "longitude": 67.0900,
            "phone": "0333-2345678",
            "website": None,
            "opening_hours": "9 AM - 6 PM",
            "trust_score": 0.7,
            "raw_data": {"craft": "carpenter", "name": "Master Carpenter"}
        },
        
        # Painter Services
        {
            "osm_id": "node/123456802",
            "name": "Rainbow Painters",
            "service_type": "Painter",
            "area": "DHA Phase 5",
            "address": "Commercial Area, DHA",
            "latitude": 24.8120,
            "longitude": 67.0620,
            "phone": "0321-3456789",
            "website": None,
            "opening_hours": "8 AM - 6 PM",
            "trust_score": 0.65,
            "raw_data": {"craft": "painter", "name": "Rainbow Painters"}
        },
        
        # Mechanic Services
        {
            "osm_id": "node/123456803",
            "name": "Auto Mechanic Center",
            "service_type": "Mechanic",
            "area": "Gulshan-e-Iqbal",
            "address": "Block 11, Near Petrol Pump",
            "latitude": 24.9190,
            "longitude": 67.0930,
            "phone": "021-34982567",
            "website": None,
            "opening_hours": "9 AM - 8 PM",
            "trust_score": 0.7,
            "raw_data": {"craft": "car_repair", "name": "Auto Mechanic"}
        }
    ]
    
    async with async_session() as db:
        added_count = 0
        for provider_data in mock_providers:
            # Check if already exists
            from sqlalchemy import select
            result = await db.execute(
                select(ExternalProvider).where(
                    ExternalProvider.osm_id == provider_data["osm_id"]
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                provider = ExternalProvider(
                    id=str(uuid.uuid4()),
                    osm_id=provider_data["osm_id"],
                    name=provider_data["name"],
                    service_type=provider_data["service_type"],
                    area=provider_data["area"],
                    address=provider_data["address"],
                    latitude=provider_data["latitude"],
                    longitude=provider_data["longitude"],
                    phone=provider_data["phone"],
                    website=provider_data["website"],
                    opening_hours=provider_data["opening_hours"],
                    source="osm_mock",
                    raw_data=provider_data["raw_data"],
                    trust_score=provider_data["trust_score"],
                    last_updated=datetime.utcnow(),
                    created_at=datetime.utcnow()
                )
                db.add(provider)
                added_count += 1
                print(f"✅ Added: {provider_data['name']} ({provider_data['area']})")
        
        await db.commit()
        print(f"\n🎉 Successfully added {added_count} mock OSM providers!")
        print(f"📊 Total providers in database: {len(mock_providers)}")
        print("\nAreas covered:")
        print("  - Gulshan-e-Iqbal")
        print("  - DHA Phase 5 & 6")
        print("  - Clifton")
        print("  - North Nazimabad")
        print("  - Malir")
        print("  - Korangi")
        print("  - Saddar")

if __name__ == "__main__":
    asyncio.run(seed_osm_providers())

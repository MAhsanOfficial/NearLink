import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    print("Creating external_providers table...")
    
    async with engine.begin() as conn:
        # Create external_providers table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS external_providers (
                id VARCHAR PRIMARY KEY,
                osm_id VARCHAR UNIQUE,
                name VARCHAR NOT NULL,
                service_type VARCHAR NOT NULL,
                area VARCHAR,
                address TEXT,
                latitude FLOAT,
                longitude FLOAT,
                distance_km FLOAT,
                phone VARCHAR,
                website VARCHAR,
                opening_hours VARCHAR,
                source VARCHAR DEFAULT 'osm',
                raw_data JSON,
                trust_score FLOAT DEFAULT 0.5,
                last_updated TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        print("✅ external_providers table created successfully!")
        print("\nThis table will store:")
        print("  - OpenStreetMap businesses")
        print("  - Public service providers")
        print("  - Unregistered providers from external sources")

asyncio.run(migrate())

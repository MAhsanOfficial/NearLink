"""
Database migration script to update schema with new columns
"""
import asyncio
from database import engine, Base
from models import User, Provider, ServiceRequest, Booking, Notification, AgentTrace

async def migrate():
    print("Starting database migration...")
    print("⚠️  This will DROP all existing tables and recreate them!")
    print("⚠️  All data will be lost!")
    
    response = input("\nAre you sure you want to continue? (yes/no): ")
    if response.lower() != "yes":
        print("Migration cancelled.")
        return
    
    try:
        # Drop all tables
        print("\n1. Dropping existing tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        print("   ✅ Tables dropped")
        
        # Create all tables with new schema
        print("\n2. Creating tables with new schema...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("   ✅ Tables created")
        
        print("\n✅ Migration completed successfully!")
        print("\nNew schema includes:")
        print("  - users.user_type (customer/provider)")
        print("  - providers.user_id (link to users)")
        print("  - providers.address, latitude, longitude")
        print("  - providers.description, services_offered, working_hours")
        print("  - providers.total_reviews, verified")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(migrate())

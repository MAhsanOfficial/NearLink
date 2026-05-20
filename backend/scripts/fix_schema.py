"""
Non-interactive script to fix database schema by dropping and recreating tables.
"""
import asyncio
from database import engine, Base
from models import User, Provider, ServiceRequest, Booking, Notification, AgentTrace

async def fix_schema():
    print("Starting database schema fix...")
    
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
        
        print("\n✅ Schema fix completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Schema fix failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_schema())

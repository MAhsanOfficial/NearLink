import asyncio
from database import init_db, async_session
from models import User, Provider
from sqlalchemy import select

async def test_db():
    print("Testing database connection...")
    
    try:
        # Initialize database
        await init_db()
        print("✅ Database initialized")
        
        # Test query
        async with async_session() as session:
            result = await session.execute(select(User))
            users = result.scalars().all()
            print(f"✅ Query successful. Found {len(users)} users")
            
            result = await session.execute(select(Provider))
            providers = result.scalars().all()
            print(f"✅ Query successful. Found {len(providers)} providers")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_db())

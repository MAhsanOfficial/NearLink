import asyncio
from sqlalchemy import select
from database import async_session
from models import User

async def verify_location():
    async with async_session() as db:
        # Get the last customer
        result = await db.execute(
            select(User)
            .where(User.user_type == "customer")
            .order_by(User.created_at.desc())
            .limit(1)
        )
        customer = result.scalar_one_or_none()
        
        if customer:
            print("✅ Latest customer found:")
            print(f"   Name: {customer.name}")
            print(f"   Email: {customer.email}")
            print(f"   Area: {customer.area}")
            print(f"   Address: {customer.address}")
            print(f"   Latitude: {customer.latitude}")
            print(f"   Longitude: {customer.longitude}")
            
            if customer.area and customer.address:
                print("\n✅ Location data saved successfully!")
            else:
                print("\n⚠️ Location data is missing")
        else:
            print("❌ No customers found")

asyncio.run(verify_location())

import asyncio
from sqlalchemy import select
from database import async_session
from models import Booking, Provider, User, ServiceRequest
import uuid
from datetime import datetime

async def test_provider_bookings():
    async with async_session() as db:
        # Get first provider
        result = await db.execute(select(Provider).limit(1))
        provider = result.scalar_one_or_none()
        
        if not provider:
            print("❌ No provider found. Please register a provider first.")
            return
        
        print(f"✅ Found provider: {provider.name} (ID: {provider.id})")
        
        # Get first customer
        customer_result = await db.execute(
            select(User).where(User.user_type == "customer").limit(1)
        )
        customer = customer_result.scalar_one_or_none()
        
        if not customer:
            print("❌ No customer found. Please register a customer first.")
            return
        
        print(f"✅ Found customer: {customer.name} (ID: {customer.id})")
        
        # Create a test service request
        request_id = str(uuid.uuid4())
        service_request = ServiceRequest(
            id=request_id,
            user_id=customer.id,
            raw_text="Test booking - Mujhe plumber chahiye",
            service_type="Plumber",
            location="Shah Latif Town",
            time="ASAP",
            urgency="high",
            language_detected="urdu",
            status="pending",
            created_at=datetime.utcnow()
        )
        db.add(service_request)
        await db.commit()  # Commit request first
        
        # Create a test booking
        booking_id = str(uuid.uuid4())
        booking = Booking(
            id=booking_id,
            request_id=request_id,
            user_id=customer.id,
            provider_id=provider.id,
            status="confirmed",
            scheduled_time="ASAP",
            notes="Test booking for provider dashboard",
            price=provider.price_range,
            created_at=datetime.utcnow()
        )
        db.add(booking)
        await db.commit()
        
        print(f"\n✅ Test booking created!")
        print(f"   Booking ID: {booking_id}")
        print(f"   Provider: {provider.name}")
        print(f"   Customer: {customer.name}")
        print(f"   Service: Plumber")
        print(f"   Status: confirmed")
        
        # Now check all bookings for this provider
        bookings_result = await db.execute(
            select(Booking).where(Booking.provider_id == provider.id)
        )
        all_bookings = bookings_result.scalars().all()
        
        print(f"\n📊 Total bookings for {provider.name}: {len(all_bookings)}")
        print("\nNow login as provider and check dashboard!")

asyncio.run(test_provider_bookings())

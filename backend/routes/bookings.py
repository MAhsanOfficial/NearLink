import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Booking, Provider, AgentTrace, ServiceRequest
from schemas import BookingCreate
from app_agents.booking_agent import create_booking
from routes.auth import verify_token

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("/create")
async def create_booking_endpoint(
    req: BookingCreate,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    user_id = user["sub"]

    # Get provider details
    result = await db.execute(select(Provider).where(Provider.id == req.provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        # Check ExternalProvider table
        from models import ExternalProvider
        ext_result = await db.execute(select(ExternalProvider).where(ExternalProvider.id == req.provider_id))
        ext_provider = ext_result.scalar_one_or_none()
        
        if ext_provider:
            # Create a registered Provider entry for this external provider to satisfy foreign keys
            provider = Provider(
                id=ext_provider.id,
                name=ext_provider.name,
                service_type=ext_provider.service_type,
                area=ext_provider.area or "Karachi",
                address=ext_provider.address,
                latitude=ext_provider.latitude,
                longitude=ext_provider.longitude,
                phone=ext_provider.phone or "Not Available",
                description=f"Public business imported from {ext_provider.source.upper() if ext_provider.source else 'OSM'}.",
                price_range="Medium",
                rating=round((ext_provider.trust_score or 0.7) * 5.0, 1),
                total_reviews=5,
                availability=True,
                verified=True,
                created_at=datetime.utcnow()
            )
            db.add(provider)
            await db.flush()
        else:
            raise HTTPException(status_code=404, detail="Provider not found")

    # Create booking via agent
    booking_result = await create_booking(
        db=db,
        request_id=req.request_id,
        user_id=user_id,
        provider_id=req.provider_id,
        provider_name=provider.name,
        service_type=provider.service_type,
        scheduled_time=req.scheduled_time,
        notes=req.notes or "",
        price=provider.price_range or ""
    )

    # Save trace
    trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=req.request_id,
        agent_name="BookingAgent",
        action="create_booking",
        input_data={
            "provider": provider.name,
            "scheduled_time": req.scheduled_time
        },
        output_data={
            "booking_id": booking_result["booking"]["id"],
            "notifications_count": len(booking_result["notifications"])
        },
        reasoning=f"Booking confirmed with {provider.name}. Scheduled {len(booking_result['notifications'])} follow-up notifications.",
        duration_ms=booking_result["duration_ms"],
        created_at=datetime.utcnow()
    )
    db.add(trace)
    await db.commit()

    return {
        **booking_result,
        "trace": {
            "agent": "BookingAgent",
            "action": "create_booking",
            "duration_ms": booking_result["duration_ms"]
        }
    }


@router.get("/history")
async def get_booking_history(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    user_id = user["sub"]

    result = await db.execute(
        select(Booking).where(Booking.user_id == user_id).order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()

    booking_list = []
    for b in bookings:
        # Get provider info
        prov_result = await db.execute(select(Provider).where(Provider.id == b.provider_id))
        provider = prov_result.scalar_one_or_none()

        booking_list.append({
            "id": b.id,
            "request_id": b.request_id,
            "provider_id": b.provider_id,
            "provider_name": provider.name if provider else "Unknown",
            "service_type": provider.service_type if provider else "Unknown",
            "status": b.status,
            "scheduled_time": b.scheduled_time,
            "notes": b.notes,
            "price": b.price,
            "created_at": str(b.created_at) if b.created_at else None
        })

    return booking_list


@router.get("/provider/my-bookings")
async def get_provider_bookings(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all bookings for the logged-in provider"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    user_id = user["sub"]

    # Get provider profile
    prov_result = await db.execute(select(Provider).where(Provider.user_id == user_id))
    provider = prov_result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Get all bookings for this provider
    result = await db.execute(
        select(Booking)
        .where(Booking.provider_id == provider.id)
        .order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()

    booking_list = []
    for b in bookings:
        # Get service request info
        req_result = await db.execute(select(ServiceRequest).where(ServiceRequest.id == b.request_id))
        service_req = req_result.scalar_one_or_none()

        booking_list.append({
            "id": b.id,
            "request_id": b.request_id,
            "customer_request": service_req.raw_text if service_req else "N/A",
            "service_type": service_req.service_type if service_req else "Unknown",
            "location": service_req.location if service_req else "Unknown",
            "status": b.status,
            "scheduled_time": b.scheduled_time,
            "notes": b.notes,
            "price": b.price,
            "created_at": str(b.created_at) if b.created_at else None
        })

    return {
        "total_bookings": len(booking_list),
        "bookings": booking_list
    }


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    verify_token(token)

    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()

    return {
        "id": booking.id,
        "request_id": booking.request_id,
        "provider_id": booking.provider_id,
        "provider_name": provider.name if provider else "Unknown",
        "service_type": provider.service_type if provider else "Unknown",
        "status": booking.status,
        "scheduled_time": booking.scheduled_time,
        "notes": booking.notes,
        "price": booking.price,
        "created_at": str(booking.created_at) if booking.created_at else None
    }

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Booking, Provider, AgentTrace, ServiceRequest, User
from schemas import BookingCreate, BookingStatusUpdate, RatingCreate
from app_agents.booking_agent import create_booking, ensure_registered_provider
from app_agents.followup_agent import handle_cancellation
from app_agents.slots import SlotConflict
from app_agents.time_resolver import resolve_time
from datetime import timedelta
from routes.auth import verify_token, get_current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("/{booking_id}/sos")
async def trigger_sos(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger an emergency SOS alert for a booking."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Verify authorization
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    
    if current_user.id != booking.user_id and (not provider or current_user.id != provider.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to trigger SOS for this booking")

    booking.safety_alert_triggered = True
    
    # Log trace for security response
    trace = AgentTrace(
        id=str(uuid.uuid4()),
        request_id=booking.request_id,
        agent_name="SafetyAgent",
        action="sos_alert",
        input_data={"user_id": current_user.id, "role": current_user.user_type},
        output_data={"status": "alert_broadcasted", "priority": "high"},
        reasoning=f"SOS triggered by user {current_user.id} during booking {booking_id}. Emergency services alerted.",
        duration_ms=0,
        created_at=datetime.utcnow()
    )
    db.add(trace)
    await db.commit()

    return {"status": "alert_sent", "message": "Emergency services and admins have been notified."}


@router.post("/{booking_id}/upload-work")
async def upload_work_proof(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mock endpoint to upload proof of work (photo/receipt)."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only the provider assigned to the booking can upload proof
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    
    if not provider or current_user.id != provider.user_id:
        raise HTTPException(status_code=403, detail="Only the assigned provider can upload work proof")

    # Simulate an image URL
    booking.completion_image_url = f"https://nearlink.storage/proofs/{booking_id}_completed.jpg"
    await db.commit()

    return {
        "status": "success", 
        "image_url": booking.completion_image_url,
        "message": "Proof of work uploaded successfully."
    }


@router.patch("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    req: BookingStatusUpdate,
    authorization: str = Header(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update booking status (confirmed -> in_progress -> completed)"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Get provider for financial checks
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Verify authorization (Customer or the Provider assigned to the booking)
    if current_user.id != booking.user_id and current_user.id != provider.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")

    if req.status == "in_progress":
        # ... (keep existing verification logic)
        # 1. Enforce Minimum Balance Rule (Provider must have > 0 to pickup)
        if provider.wallet_balance < 0:
            raise HTTPException(
                status_code=403, 
                detail="Insufficient wallet balance. Please top-up to accept new jobs."
            )
        
        # 2. AI Negotiation Verification
        if not req.negotiated_amount:
            raise HTTPException(
                status_code=400,
                detail="Negotiated amount is required to pickup the job."
            )
        
        # Fetch chat history for AI
        from routes.chat import get_chat_history
        chat_history = await get_chat_history(booking_id, current_user, db)
        
        from app_agents.negotiation_agent import verify_negotiation
        verification = await verify_negotiation(chat_history, req.negotiated_amount)
        
        if not verification.get("verified"):
            # Include the suggested amount in the error detail if available
            error_data = {
                "detail": f"Negotiation Verification Failed: {verification.get('reasoning')}",
                "suggested_amount": verification.get("agreed_amount")
            }
            raise HTTPException(
                status_code=400,
                detail=error_data
            )
        
        # Save verified price to booking
        booking.final_price = req.negotiated_amount
        
        # Save verification trace
        v_trace = AgentTrace(
            id=str(uuid.uuid4()),
            request_id=booking.request_id,
            agent_name="NegotiationAgent",
            action="verify_deal",
            input_data={"claimed_amount": req.negotiated_amount},
            output_data=verification,
            reasoning=verification.get("reasoning"),
            duration_ms=verification.get("duration_ms", 0),
            created_at=datetime.utcnow()
        )
        db.add(v_trace)

        # Sync with notifications
        from models import Notification
        notif_result = await db.execute(
            select(Notification).where(
                Notification.booking_id == booking_id,
                Notification.type == "provider_assigned"
            )
        )
        notif = notif_result.scalar_one_or_none()
        if notif:
            notif.sent = True
            notif.scheduled_for = datetime.utcnow()

    elif req.status == "completed":
        # Check who is completing
        is_customer = current_user.id == booking.user_id
        
        # 2. Commission Logic
        f_price = booking.final_price or 0.0
        # ... (keep fallback price parsing)
        if f_price == 0.0:
            try:
                import re
                nums = re.findall(r'\d+', str(booking.price))
                if nums:
                    f_price = float(nums[0])
            except:
                f_price = 100.0
        
        if not booking.is_paid:
            commission = round(f_price * (provider.commission_rate or 0.10), 2)
            provider.wallet_balance -= commission
            booking.commission_amount = commission
            booking.final_price = f_price
            booking.is_paid = True
            
            # Phase 8: Trust Penalty if Customer Force-Completed
            if is_customer:
                booking.force_completed = True
                provider.trust_score = max(0.0, (provider.trust_score or 1.0) - 0.05)
                provider.auto_complete_count = (provider.auto_complete_count or 0) + 1
                
                # Log penalty trace
                p_trace = AgentTrace(
                    id=str(uuid.uuid4()),
                    request_id=booking.request_id,
                    agent_name="FraudDetectionAgent",
                    action="penalize_provider",
                    input_data={"booking_id": booking_id, "trigger": "customer_force_complete"},
                    output_data={"new_trust_score": provider.trust_score},
                    reasoning=f"Provider failed to mark job as complete. Customer forced completion. Deducting 0.05 from Trust Score.",
                    duration_ms=0,
                    created_at=datetime.utcnow()
                )
                db.add(p_trace)

            # Save financial trace
            trace = AgentTrace(
                id=str(uuid.uuid4()),
                request_id=booking.request_id,
                agent_name="FinancialAgent",
                action="deduct_commission",
                input_data={"final_price": f_price, "rate": provider.commission_rate, "forced": is_customer},
                output_data={"commission": commission, "new_balance": provider.wallet_balance},
                reasoning=f"Deducted {commission} commission for booking {booking_id}.",
                duration_ms=0,
                created_at=datetime.utcnow()
            )
            db.add(trace)

        # Sync with notifications
        from models import Notification
        notif_result = await db.execute(
            select(Notification).where(
                Notification.booking_id == booking_id,
                Notification.type == "completion"
            )
        )
        notif = notif_result.scalar_one_or_none()
        if notif:
            notif.sent = True
            notif.scheduled_for = datetime.utcnow()

    booking.status = req.status
    await db.commit()

    return {"status": "success", "new_status": req.status}


@router.post("/{booking_id}/rate")
async def rate_provider(
    booking_id: str,
    req: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Rate a provider after booking completion"""
    # 1. Verify booking exists and belongs to the user
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if current_user.id != booking.user_id:
        raise HTTPException(status_code=403, detail="Only the customer who made the booking can rate it")
    
    if getattr(booking, "is_rated", False):
        raise HTTPException(status_code=400, detail="This booking has already been rated")
    
    if booking.status != "completed" and booking.status != "confirmed":
        # Allow rating if it was confirmed too, for simplicity in demo
        pass

    # 2. Get provider
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # 3. Update aggregate rating
    # Current formula: (old_avg * old_count + new_rating) / (old_count + 1)
    old_rating = provider.rating or 0.0
    old_count = provider.total_reviews or 0
    
    new_count = old_count + 1
    new_rating = round(((old_rating * old_count) + req.rating) / new_count, 1)
    
    provider.rating = new_rating
    provider.total_reviews = new_count
    
    # 4. Mark booking as rated
    booking.is_rated = True
    
    await db.commit()

    return {
        "status": "success",
        "new_average_rating": new_rating,
        "total_reviews": new_count
    }


@router.post("/create")
async def create_booking_endpoint(
    req: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get provider (creating a proxy Provider row for external businesses to satisfy foreign keys)
    provider = await ensure_registered_provider(db, req.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # If the time can be understood, reserve a real slot so the provider cannot be double-booked
    window = resolve_time(req.scheduled_time)
    scheduled_at = None
    if window["resolved"] and not window["is_asap"]:
        scheduled_at = window["preferred_utc"]
        if scheduled_at < datetime.utcnow() + timedelta(minutes=30):
            scheduled_at = None

    try:
        booking_result = await create_booking(
            db=db,
            request_id=req.request_id,
            user_id=current_user.id,
            provider_id=provider.id,
            provider_name=provider.name,
            service_type=provider.service_type,
            scheduled_time=req.scheduled_time,
            notes=req.notes or "",
            price=provider.price_range or "",
            scheduled_at=scheduled_at,
        )
    except SlotConflict:
        raise HTTPException(status_code=409, detail="That time is already booked for this provider. Please pick another time.")

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


@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a booking. If the provider cancels, the FollowUpAgent automatically rebooks the customer."""
    booking = (await db.execute(select(Booking).where(Booking.id == booking_id))).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    provider = (await db.execute(select(Provider).where(Provider.id == booking.provider_id))).scalar_one_or_none()
    if current_user.id == booking.user_id:
        by = "customer"
    elif provider and provider.user_id == current_user.id:
        by = "provider"
    else:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    result = await handle_cancellation(db, booking_id, by)
    if result["status"] == "invalid_state":
        raise HTTPException(status_code=400, detail=result["detail"])
    orch = result.pop("orchestration", None)
    if orch:
        result["new_booking"] = orch.get("booking")
        result["events"] = orch.get("events", [])
    return result


@router.post("/{booking_id}/simulate-provider-cancel")
async def simulate_provider_cancel(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Demo hook: the customer plays 'the provider cancels' to show the FollowUpAgent's automatic rebooking.
    Disabled when DEMO_MODE=off."""
    if os.getenv("DEMO_MODE", "on").lower() == "off":
        raise HTTPException(status_code=404, detail="Not found")
    booking = (await db.execute(select(Booking).where(Booking.id == booking_id))).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    result = await handle_cancellation(db, booking_id, "provider")
    if result["status"] == "invalid_state":
        raise HTTPException(status_code=400, detail=result["detail"])
    orch = result.pop("orchestration", None)
    if orch:
        result["new_booking"] = orch.get("booking")
        result["provider"] = orch.get("provider")
        result["scheduled_at"] = orch.get("scheduled_at")
        result["events"] = orch.get("events", [])
    return result


@router.get("/history")
async def get_booking_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Booking).where(Booking.user_id == current_user.id).order_by(Booking.created_at.desc())
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
            "is_rated": getattr(b, "is_rated", False),
            "created_at": str(b.created_at) if b.created_at else None
        })

    return booking_list


@router.get("/provider/my-bookings")
async def get_provider_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all bookings for the logged-in provider"""
    # Get provider profile
    prov_result = await db.execute(select(Provider).where(Provider.user_id == current_user.id))
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

        # Get customer info
        cust_result = await db.execute(select(User).where(User.id == b.user_id))
        customer = cust_result.scalar_one_or_none()

        booking_list.append({
            "id": b.id,
            "request_id": b.request_id,
            "customer_name": customer.name if customer else "Unknown",
            "customer_phone": customer.phone if customer else "N/A",
            "customer_request": service_req.raw_text if service_req else "N/A",
            "service_type": service_req.service_type if service_req else "Unknown",
            "location": service_req.location if service_req else "Unknown",
            "status": b.status,
            "scheduled_time": b.scheduled_time,
            "notes": b.notes,
            "price": b.price,
            "is_rated": getattr(b, "is_rated", False),
            "created_at": str(b.created_at) if b.created_at else None
        })

    return {
        "total_bookings": len(booking_list),
        "bookings": booking_list
    }


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Verify authorization
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    
    is_admin = current_user.user_type == "admin"
    is_customer = current_user.id == booking.user_id
    is_provider = provider and current_user.id == provider.user_id

    if not (is_admin or is_customer or is_provider):
        raise HTTPException(status_code=403, detail="Not authorized to access this booking")

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
        "final_price": booking.final_price,
        "commission_amount": booking.commission_amount,
        "is_paid": booking.is_paid,
        "is_rated": getattr(booking, "is_rated", False),
        "completion_image_url": booking.completion_image_url,
        "force_completed": booking.force_completed,
        "safety_alert_triggered": booking.safety_alert_triggered,
        "created_at": str(booking.created_at) if booking.created_at else None
    }

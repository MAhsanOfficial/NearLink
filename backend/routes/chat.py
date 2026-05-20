import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Booking, Message, User, Provider
from schemas import MessageCreate, MessageOut
from routes.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/send/{booking_id}")
async def send_message(
    booking_id: str,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message or price offer in a booking chat"""
    # Verify booking exists
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Verify user is part of the booking (customer or provider)
    # Get provider profile to check user_id
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    
    if current_user.id != booking.user_id and (not provider or current_user.id != provider.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    message = Message(
        id=str(uuid.uuid4()),
        booking_id=booking_id,
        sender_id=current_user.id,
        content=req.content,
        message_type=req.message_type or "text",
        offer_amount=req.offer_amount,
        is_accepted=False,
        created_at=datetime.utcnow()
    )
    db.add(message)
    await db.commit()

    return {"status": "success", "message_id": message.id}


@router.get("/{booking_id}")
async def get_chat_history(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all messages for a specific booking"""
    # Verify booking exists
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Verify user is part of the booking
    prov_result = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = prov_result.scalar_one_or_none()
    
    is_admin = current_user.user_type == "admin"
    is_customer = current_user.id == booking.user_id
    is_provider = provider and current_user.id == provider.user_id

    if not (is_admin or is_customer or is_provider):
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    msg_result = await db.execute(
        select(Message).where(Message.booking_id == booking_id).order_by(Message.created_at.asc())
    )
    messages = msg_result.scalars().all()

    # Map sender names
    history = []
    for m in messages:
        sender_res = await db.execute(select(User).where(User.id == m.sender_id))
        sender = sender_res.scalar_one_or_none()
        
        history.append({
            "id": m.id,
            "booking_id": m.booking_id,
            "sender_id": m.sender_id,
            "sender_name": sender.name if sender else "Unknown",
            "content": m.content,
            "message_type": m.message_type,
            "offer_amount": m.offer_amount,
            "is_accepted": m.is_accepted,
            "created_at": str(m.created_at)
        })

    return history


@router.post("/offer/{message_id}/accept")
async def accept_offer(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept a price offer (Customer only)"""
    # Get the message
    result = await db.execute(select(Message).where(Message.id == message_id))
    message = result.scalar_one_or_none()
    if not message or message.message_type != "offer":
        raise HTTPException(status_code=404, detail="Offer not found")

    # Get the booking
    book_result = await db.execute(select(Booking).where(Booking.id == message.booking_id))
    booking = book_result.scalar_one_or_none()
    
    # Verify user is the customer for this booking
    if current_user.id != booking.user_id:
        raise HTTPException(status_code=403, detail="Only the customer can accept an offer")

    # Update message and booking
    message.is_accepted = True
    booking.final_price = message.offer_amount
    
    await db.commit()

    return {
        "status": "success", 
        "final_price": booking.final_price,
        "message": "Offer accepted and price finalized."
    }

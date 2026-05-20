from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# --- Auth ---
class SignupRequest(BaseModel):
    email: str
    name: str
    password: str
    phone: Optional[str] = None
    user_type: Optional[str] = "customer"  # "customer" or "provider"
    # Customer location fields (optional during signup)
    area: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# --- Service Request ---
class ServiceRequestCreate(BaseModel):
    raw_text: str


class ParsedIntent(BaseModel):
    service_type: str
    location: str
    time: str
    urgency: str
    language_detected: str


class ServiceRequestResponse(BaseModel):
    id: str
    raw_text: str
    parsed: ParsedIntent
    status: str
    created_at: Optional[str] = None


# --- Provider ---
class ProviderRegistration(BaseModel):
    name: str
    service_type: str
    area: str
    address: str
    latitude: float
    longitude: float
    phone: str
    description: Optional[str] = ""
    services_offered: Optional[List[str]] = []
    working_hours: Optional[str] = "9 AM - 6 PM"
    price_range: Optional[str] = "$$"


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    service_type: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    services_offered: Optional[List[str]] = None
    working_hours: Optional[str] = None
    price_range: Optional[str] = None
    availability: Optional[bool] = None


class ProviderOut(BaseModel):
    id: str
    name: str
    service_type: str
    area: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    rating: float
    total_reviews: Optional[int] = 0
    availability: bool
    price_range: str
    phone: str
    description: Optional[str] = None
    services_offered: Optional[List[str]] = []
    working_hours: Optional[str] = None
    verified: Optional[bool] = False
    wallet_balance: Optional[float] = 0.0
    commission_rate: Optional[float] = 0.10
    trust_score: Optional[float] = 1.0
    auto_complete_count: Optional[int] = 0


class ProviderSearchRequest(BaseModel):
    service_type: str
    location: str
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None


class RankedProvider(BaseModel):
    provider: ProviderOut
    rank: int
    score: float
    reasoning: str


class RankingResponse(BaseModel):
    ranked_providers: List[RankedProvider]
    recommendation: str


# --- Booking ---
class BookingCreate(BaseModel):
    request_id: str
    provider_id: str
    scheduled_time: str
    notes: Optional[str] = ""


class BookingStatusUpdate(BaseModel):
    status: str
    negotiated_amount: Optional[float] = None


class RatingCreate(BaseModel):
    rating: float
    review: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    request_id: str
    provider_id: str
    provider_name: Optional[str] = None
    service_type: Optional[str] = None
    status: str
    scheduled_time: str
    notes: Optional[str] = None
    price: Optional[str] = None
    final_price: Optional[float] = 0.0
    commission_amount: Optional[float] = 0.0
    is_paid: Optional[bool] = False
    is_rated: Optional[bool] = False
    completion_image_url: Optional[str] = None
    force_completed: Optional[bool] = False
    safety_alert_triggered: Optional[bool] = False
    created_at: Optional[str] = None


# --- Chat & Messaging ---
class MessageCreate(BaseModel):
    content: str
    message_type: Optional[str] = "text"
    offer_amount: Optional[float] = None


class MessageOut(BaseModel):
    id: str
    booking_id: str
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    message_type: str
    offer_amount: Optional[float] = None
    is_accepted: bool
    created_at: str


class WalletTopup(BaseModel):
    amount: float


# --- Notification ---
class NotificationOut(BaseModel):
    id: str
    booking_id: str
    type: str
    message: str
    scheduled_for: Optional[str] = None
    sent: bool
    created_at: Optional[str] = None


# --- Agent Trace ---
class TraceOut(BaseModel):
    id: str
    request_id: Optional[str] = None
    agent_name: str
    action: str
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    reasoning: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: Optional[str] = None

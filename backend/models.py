import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Integer, JSON
from database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    phone = Column(String)
    user_type = Column(String, default="customer")  # "customer" or "provider"
    # Customer location fields
    area = Column(String)  # Customer's area/locality
    address = Column(Text)  # Customer's full address
    latitude = Column(Float)  # Customer's GPS coordinates
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Provider(Base):
    __tablename__ = "providers"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Link to user account
    name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    area = Column(String, nullable=False)
    address = Column(Text)  # Full address
    latitude = Column(Float)  # GPS coordinates
    longitude = Column(Float)
    distance_km = Column(Float)  # Calculated dynamically
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    availability = Column(Boolean, default=True)
    price_range = Column(String)
    phone = Column(String, nullable=False)
    description = Column(Text)  # Provider bio/description
    services_offered = Column(JSON)  # List of specific services
    working_hours = Column(String)  # e.g., "9 AM - 6 PM"
    verified = Column(Boolean, default=False)  # Location verified via map
    # Financial fields
    wallet_balance = Column(Float, default=0.0)
    commission_rate = Column(Float, default=0.10) # 10% default commission
    # Trust & Performance
    trust_score = Column(Float, default=1.0)
    auto_complete_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExternalProvider(Base):
    """Providers from OpenStreetMap / public sources"""
    __tablename__ = "external_providers"
    id = Column(String, primary_key=True, default=gen_id)
    osm_id = Column(String, unique=True)  # OpenStreetMap ID
    name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    area = Column(String)
    address = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    distance_km = Column(Float)  # Calculated dynamically
    phone = Column(String)
    website = Column(String)
    opening_hours = Column(String)
    source = Column(String, default="osm")  # osm, google_places, etc.
    raw_data = Column(JSON)  # Store original OSM data
    trust_score = Column(Float, default=0.5)  # 0-1 score based on data completeness
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"))
    raw_text = Column(Text, nullable=False)
    service_type = Column(String)
    location = Column(String)
    time = Column(String)
    urgency = Column(String)
    language_detected = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(String, primary_key=True, default=gen_id)
    request_id = Column(String, ForeignKey("service_requests.id"))
    user_id = Column(String, ForeignKey("users.id"))
    provider_id = Column(String, ForeignKey("providers.id"))
    status = Column(String, default="confirmed")
    scheduled_time = Column(String)
    notes = Column(Text)
    price = Column(String) # This is the price range/estimated price from search
    # Financial fields
    final_price = Column(Float, default=0.0) # Negotiated price
    commission_amount = Column(Float, default=0.0)
    is_paid = Column(Boolean, default=False) # True if commission is deducted
    is_rated = Column(Boolean, default=False)
    # Phase 8: Trust & Safety
    completion_image_url = Column(String)
    force_completed = Column(Boolean, default=False)
    safety_alert_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=gen_id)
    booking_id = Column(String, ForeignKey("bookings.id"))
    sender_id = Column(String, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # "text" or "offer"
    offer_amount = Column(Float, nullable=True)
    is_accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=gen_id)
    booking_id = Column(String, ForeignKey("bookings.id"))
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String)
    message = Column(Text)
    scheduled_for = Column(DateTime)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentTrace(Base):
    __tablename__ = "agent_traces"
    id = Column(String, primary_key=True, default=gen_id)
    request_id = Column(String)
    agent_name = Column(String)
    action = Column(String)
    input_data = Column(JSON)
    output_data = Column(JSON)
    reasoning = Column(Text)
    duration_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

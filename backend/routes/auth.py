import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import jwt

from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "quickfix-ai-secret-key-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


def create_token(user_id: str, email: str, name: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate user_type
    if req.user_type not in ["customer", "provider"]:
        raise HTTPException(status_code=400, detail="Invalid user_type. Must be 'customer' or 'provider'")

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=req.email,
        name=req.name,
        password_hash=pwd_context.hash(req.password),
        phone=req.phone,
        user_type=req.user_type,
        area=req.area,
        address=req.address,
        latitude=req.latitude,
        longitude=req.longitude,
        created_at=datetime.utcnow()
    )
    db.add(user)
    await db.commit()

    token = create_token(user_id, req.email, req.name)
    return AuthResponse(
        token=token,
        user={
            "id": user_id,
            "email": req.email,
            "name": req.name,
            "phone": req.phone,
            "user_type": req.user_type
        }
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.email, user.name)
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "user_type": user.user_type
        }
    )


@router.get("/me")
async def get_me(token: str, db: AsyncSession = Depends(get_db)):
    payload = verify_token(token)
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "user_type": user.user_type
    }

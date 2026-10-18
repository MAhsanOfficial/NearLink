import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import jwt

from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    # No hardcoded fallback: a known default secret would let anyone forge tokens.
    import secrets as _secrets
    JWT_SECRET = _secrets.token_urlsafe(48)
    print("WARNING: JWT_SECRET is not set; using a random per-process secret (tokens reset on restart). Set JWT_SECRET in .env.")
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


async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists. Please log in again.")
    
    return user


async def get_optional_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    if not authorization:
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
            
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception:
        return None


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate user_type
    if req.user_type not in ["customer", "provider"]:
        raise HTTPException(status_code=400, detail="Invalid user_type. Must be 'customer' or 'provider'")

    # Bcrypt has a 72-byte limit; truncate password if needed
    password_to_hash = req.password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=req.email,
        name=req.name,
        password_hash=pwd_context.hash(password_to_hash),
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
    # Specialized Admin Login Logic from Environment
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@nearlink.com")
    ADMIN_PASS = os.getenv("ADMIN_PASSWORD")
    
    # Bcrypt has a 72-byte limit; truncate password if needed
    password_to_check = req.password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    
    if ADMIN_PASS and req.email == ADMIN_EMAIL and req.password == ADMIN_PASS:
        # Check if admin user exists in DB, if not create it
        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            admin_pass_truncated = ADMIN_PASS.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            admin_user = User(
                id=str(uuid.uuid4()),
                email=ADMIN_EMAIL,
                name="System Administrator",
                password_hash=pwd_context.hash(admin_pass_truncated),
                user_type="admin",
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
        elif admin_user.user_type != "admin":
            admin_user.user_type = "admin"
            await db.commit()
            await db.refresh(admin_user)
            
        token = create_token(admin_user.id, admin_user.email, admin_user.name)
        return AuthResponse(
            token=token,
            user={
                "id": admin_user.id,
                "email": admin_user.email,
                "name": admin_user.name,
                "phone": admin_user.phone,
                "user_type": "admin"
            }
        )

    # Standard User Login
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(password_to_check, user.password_hash):
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

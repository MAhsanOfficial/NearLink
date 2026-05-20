import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import init_db
from routes.auth import router as auth_router
from routes.requests import router as requests_router
from routes.providers import router as providers_router
from routes.bookings import router as bookings_router
from routes.followup import router as followup_router
from routes.traces import router as traces_router
from routes.unified_search import router as unified_router
from routes.unified_search_v2 import router as unified_v2_router  # Google Places
from routes.chat import router as chat_router
from routes.admin import router as admin_router
from routes.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    await init_db()
    print("✅ Database initialized")
    yield
    print("👋 Shutting down")


app = FastAPI(
    title="NearLink",
    description="AI Service Orchestrator for the Informal Economy",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow frontend and mobile to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost",         # Capacitor Android
        "capacitor://localhost",   # Capacitor iOS
        "https://near-link-frontend.vercel.app",
        "https://near-link-frontend-git-main-mahsanofficials-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register routes
app.include_router(auth_router)
app.include_router(requests_router)
app.include_router(providers_router)
app.include_router(bookings_router)
app.include_router(followup_router)
app.include_router(traces_router)
app.include_router(unified_router)  # Challenge 2: Unified Search
app.include_router(unified_v2_router)  # Challenge 2: Google Places (REAL DATA)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(health_router)


@app.get("/")
async def root():
    return {
        "app": "NearLink",
        "version": "1.0.0",
        "status": "running",
        "description": "AI Service Orchestrator for the Informal Economy",
        "cors_enabled": True,
        "allowed_origins": [
            "http://localhost:3000",
            "https://near-link-frontend.vercel.app"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting NearLink Backend...")
    print("📍 Server: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("✅ CORS enabled for: http://localhost:3000")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

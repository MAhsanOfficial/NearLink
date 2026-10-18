import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Status messages use emoji; a redirected Windows stdout (cp1252) would otherwise crash startup with UnicodeEncodeError.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

from database import init_db
from routes.auth import router as auth_router
from routes.requests import router as requests_router
from routes.providers import router as providers_router
from routes.bookings import router as bookings_router
from routes.followup import router as followup_router
from routes.traces import router as traces_router
from routes.unified_search import router as unified_router
from routes.admin import router as admin_router  # Admin dashboard
from routes.orchestrator import router as orchestrator_router
from routes.whatsapp import router as whatsapp_router
from app_agents.followup_agent import start_scheduler, stop_scheduler
from routes.chat import router as chat_router
from routes.guide import router as guide_router
from routes.health import router as health_router
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError


# Vercel serverless compatibility: disable lifespan events
IS_VERCEL = os.getenv("VERCEL", "0") == "1"

if not IS_VERCEL:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup: initialize database tables
        try:
            await init_db()
            print("✅ Database initialized")
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
        if start_scheduler():
            print("⏰ FollowUpAgent scheduler started (every 30s)")
        yield
        stop_scheduler()
        print("👋 Shutting down")

    app = FastAPI(
        title="NearLink",
        description="AI Service Orchestrator for the Informal Economy",
        version="1.0.0",
        lifespan=lifespan
    )
else:
    # Vercel serverless mode: no lifespan, tables created on-demand
    app = FastAPI(
        title="NearLink",
        description="AI Service Orchestrator for the Informal Economy",
        version="1.0.0"
    )


@app.exception_handler(InterfaceError)
@app.exception_handler(OperationalError)
async def db_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database connection error. This is common on serverless cold starts. Please refresh the page.", "error": str(exc)},
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
        *[o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()],
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
app.include_router(admin_router)  # Admin dashboard
app.include_router(chat_router)
app.include_router(guide_router)
app.include_router(orchestrator_router)  # Agentic workflow (planner + tools + live trace)
app.include_router(whatsapp_router)  # WhatsApp voice/text channel
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

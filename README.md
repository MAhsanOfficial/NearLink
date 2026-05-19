# ⚡ NearLink: AI Service Orchestrator for the Informal Economy

> **🏆 Submission for Google Antigravity Hackathon**
>
> *Bridging the gap between the informal economy and digital convenience through high-fidelity AI Agent Orchestration.*

---

## 🌌 Overview

**NearLink** is a next-generation AI platform designed to empower the informal economy (plumbers, electricians, technicians) by connecting them with customers through a seamless, natural language interface. 

Built with the **Antigravity** philosophy, NearLink removes the "gravity" of complex apps, allowing users to simply speak or type their needs in **Urdu, Roman Urdu, or English**. Our multi-agent system handles the rest—parsing intent, discovering local providers (via OSM and Google Places), ranking them by proximity and trust, and managing the entire booking lifecycle.

## 🏗️ Architecture

NearLink follows a **Modular Agentic Architecture**, where a central orchestrator delegates tasks to specialized sub-agents.

```mermaid
graph TD
    User((User)) -->|Natural Language| IntentAgent[🧠 Intent Agent]
    IntentAgent -->|Parsed Data| Discovery[🔍 Discovery Layer]
    
    subgraph Discovery Agents
        OSM[🌍 OSM Search Agent]
        GP[📍 Google Places Agent]
        Internal[💾 Internal Provider Agent]
    end
    
    Discovery --> OSM
    Discovery --> GP
    Discovery --> Internal
    
    OSM --> Ranking[⭐ Ranking Agent]
    GP --> Ranking
    Internal --> Ranking
    
    Ranking -->|Top Matches| User
    User -->|One-Tap Book| Booking[📅 Booking Agent]
    Booking -->|Automation| FollowUp[🔔 Follow-up Agent]
    
    subgraph Observability
        Trace[🕵️ Antigravity Trace]
    end
    
    IntentAgent -.-> Trace
    Discovery -.-> Trace
    Ranking -.-> Trace
```

### 🛠️ Tech Stack
- **Frontend:** Next.js 16 (App Router), Framer Motion, GSAP, CSS Variables.
- **Backend:** FastAPI (Python), SQLAlchemy Async.
- **AI/LLM:** Google Gemini 2.5 Flash (via OpenAI-compatible endpoint).
- **Data:** SQLite (Local-first), OpenStreetMap Overpass API, Google Places API (Real-world).
- **Auth:** JWT (JSON Web Tokens) with Secure HTTP-only storage.

---

## 🤖 AI Agent Swarm

NearLink is powered by 6 specialized agents:

1.  **🧠 Intent Agent:** Uses Gemini 2.5 Flash to detect language (Urdu/Roman/English) and extract `service`, `location`, `time`, and `urgency` from raw text.
2.  **🌍 OSM Search Agent:** Queries the OpenStreetMap Overpass API to find local businesses and workshops in the user's vicinity.
3.  **📍 Google Places Agent:** Integrates with the Google Places API to provide high-fidelity, real-world data including ratings and photos.
4.  **💾 Internal Provider Agent:** Manages the database of verified NearLink partners and handles their availability.
5.  **⭐ Ranking Agent:** An intelligent sorter that weights providers based on Haversine distance, trust scores, and historical ratings.
6.  **📅 Booking Agent:** Validates time slots and orchestrates the state transition from "Request" to "Confirmed Booking".
7.  **🔔 Follow-up Agent:** Simulates proactive communication, providing status updates and reminders to both parties.

---

## 🕵️ Antigravity Trace (AI Transparency)

One of NearLink's core features is the **Antigravity Trace**. Inspired by the need for transparency in AI, every agentic decision is logged with its:
- **Reasoning:** Why a specific provider was ranked #1.
- **Input/Output Data:** The raw JSON data exchanged between agents.
- **Duration:** Latency metrics for performance auditing.

*Administrators can view these traces in real-time to debug the "black box" of AI orchestration.*

---

## 📂 Project Structure

### 📦 Backend (`/backend`)
- **`app_agents/`**: AI Agent logic (Intent, Search, Ranking, etc.)
- **`routes/`**: FastAPI API endpoints
- **`scripts/`**: Utility scripts for data seeding and migrations
- **`tests/`**: Automated test suite and simulations
- **`main.py`**: Entry point for the FastAPI application
- **`models.py`**: SQLAlchemy database models
- **`schemas.py`**: Pydantic data validation schemas
- **`database.py`**: Database configuration and session management

### 🎨 Frontend (`/frontend`)
- **`src/app/`**: Next.js pages and layouts
- **`src/components/`**: Reusable UI components
- **`src/context/`**: React Context for global state (Auth)
- **`src/lib/`**: API wrappers and utility functions

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key
- Google Maps/Places API Key (Optional for real data)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Configure `.env`:**
```env
# Local PostgreSQL (Preferred)
DATABASE_URL=postgresql+asyncpg://nearlink_user:nearlink_pass@localhost:5432/nearlink

# Fallback/SQLite (Not recommended for production)
# DATABASE_URL=sqlite+aiosqlite:///./nearlink.db

GEMINI_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
JWT_SECRET=your_jwt_secret
```

**Seed Data:**
```bash
# Run from the backend directory
python -m scripts.seed_data          # Mock users & providers
python -m scripts.seed_osm_providers  # Real OSM data for Islamabad/Rawalpindi
```

**Run Tests:**
```bash
python -m tests.test_api
python -m tests.complete_test
```

**Run Server:**
```bash
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🌍 Real-World Impact

NearLink is designed for the **Informal Economy** of Pakistan and similar regions. By supporting **Roman Urdu** (e.g., *"Mujhe AC wala chahiye G-13 me"*), we lower the barrier to entry for users who may find traditional English-only apps intimidating.

- **For Providers:** Digital visibility without complex social media management.
- **For Customers:** Instant trust through AI-verified ranking and discovery.

---

## 📜 License
MIT License - Built with ❤️ for the **Google Antigravity Hackathon 2026**.

# Workplan Log: NearLink (QuickFix AI)

This document outlines the high-level engineering roadmap and milestones established to design, develop, and integrate the AI-driven Local Service Orchestrator for the informal economy.

## 🏁 Milestones & Project Phases

### Phase 1: Foundation & Database Architecture (Completed)
- Designed a dual-role relational database schema using **PostgreSQL** (via Neon) and **SQLAlchemy**.
- Created distinct schemas for standard customers and local service providers.
- Established primary key relationships, unique constraints, and status tracking for bookings.

### Phase 2: Agent Framework & Geolocation Engine (Completed)
- Integrated **Google Geocoding API** and **Nominatim (OpenStreetMap)** to resolve free-form Pakistani location names (like "Defence Phase 2, Karachi" or "Gulshan") into high-precision GPS coordinates.
- Developed the mathematical **Haversine Distance Formula** block to calculate exact proximities in kilometers.
- Created `google_places_agent.py` to seamlessly query live local businesses (like plumbers, electricians) via Google Places API within a customizable 5.0km radius.
- Constructed a database caching mechanism to prevent duplicate external API hits and optimize costs.

### Phase 3: AI Orchestration & Rebranding (Completed)
- Constructed the multi-agent workflow powered by **Google Gemini**:
  - **IntentAgent**: Parses natural language requests (including Urdu/Roman Urdu code-switching) to extract coordinates, locations, and service types.
  - **RankingAgent**: Computes a multi-dimensional suitability score based on proximity, rating, total reviews, and availability.
- Transitioned product branding smoothly from **QuickFix AI** to **NearLink** across landing pages, forms, and system agents.

### Phase 4: Production Polish & Resiliency (Completed)
- Resolved critical edge-cases such as the missing standard library imports (`os`, `datetime`), and alphanumeric LLM ID typo mismatches using temporary short-keys.
- Documented system performance and finalized verification logs for judges.

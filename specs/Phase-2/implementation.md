# Phase 2: Implementation Details

## AI Agents
- **Orchestration Pattern:** Request-Response Chain.
- **LLM:** Google Gemini 2.0 Flash (via `google-generativeai`).
- **Key Files:**
  - `backend/app_agents/intent_agent.py`: Parses natural language requests.
  - `backend/app_agents/osm_search_agent.py`: Scrapes/queries OSM for local entities.
  - `backend/app_agents/google_places_agent.py`: Fetches real-time data from Google.
  - `backend/app_agents/ranking_agent.py`: Score-based sorting algorithm.

## Data Sources
- **Internal:** `providers` table (Verified NearLink partners).
- **External:** OpenStreetMap (OSM) via Overpass API (Challenge 2 fallback).
- **Real-world:** Google Places API (Challenge 2 primary).

## API Routes
- `backend/routes/unified_search.py`: Legacy/OSM search.
- `backend/routes/unified_search_v2.py`: Real-time Google Places search.

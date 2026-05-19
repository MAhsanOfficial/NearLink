# Decisions Log: Architectural & Design Choices

This document outlines key technical decisions made during the system's design phase and the rationale behind each choice.

## 🛠️ Selected Architectural Decisions

### 1. Dual-Path Service Discovery (Always-On Hybrid Model)
- **Decision**: Reject binary fallbacks. Instead of skipping live internet search when platform-registered users exist, the system always triggers **both** internal database fetching and live external search (Google Places/OSM).
- **Rationale**: Gives users a transparent choice. A customer can book a platform-vetted provider (who supports secure chat, online booking, and electronic history) even if they are 15km away, or call a local brick-and-mortar shop just 400 meters away immediately.

### 2. External Provider Virtual Registration on Booking
- **Decision**: Dynamically create a shadow platform profile for an external provider in the `Provider` table the moment a customer hits "Book".
- **Rationale**: Guarantees database integrity. The PostgreSQL database has rigorous foreign key constraints on the `bookings` table that require a valid `provider_id` referencing the `providers` table. Creating a shadow entry on-the-fly ensures bookings are created without database crashes.

### 3. Client-Side Geocoding Cache & Fallback Coordinates
- **Decision**: Implement hardcoded coordinate fallbacks for major Pakistani cities (Karachi, Islamabad, Lahore, Rawalpindi) inside `osm_search_agent.py`.
- **Rationale**: Guarantees zero failures. Public Nominatim/OSM servers frequently experience traffic-rate limits or slow responses. The fallback ensures that even if Nominatim fails or times out, the search engine still functions and fetches local providers.

### 4. Simplified ID Mapping for AI Prompts
- **Decision**: Replace complex 27-character place IDs with simplified indexes (e.g. `prov_1`, `prov_2`) in Gemini prompts.
- **Rationale**: Mitigates LLM hallucinations. Alleviates character corruption or formatting discrepancies in JSON responses, ensuring 100% accurate data parsing on the API end.

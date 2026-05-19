# Tool Calls Log: Integrations & API Protocols

This document details the external software, libraries, and internal service modules utilized to execute operations within NearLink.

## 🛠️ Integrated APIs & Services

### 1. Google Places API (`nearbysearch`)
- **Use Case**: Used to search for active, real-world service shops within a specified geographic radius.
- **Protocol**: HTTP GET request returning structured JSON with vicinity, rating, geolocations, and pricing categories.

### 2. Google Place Details API
- **Use Case**: Fetches critical business contact information (phone number, website, working hours) for selected providers.
- **Protocol**: HTTP GET targeting specific unique `place_id` values.

### 3. OpenStreetMap Nominatim API
- **Use Case**: Performs forward-geocoding (converts text strings like `"Saddar, Karachi"` to latitude and longitude).
- **Protocol**: HTTP GET with custom `User-Agent` headers to satisfy open-source usage policies.

### 4. Overpass OpenStreetMap API
- **Use Case**: Serves as a free backup lookup engine. Searches OSM tags (`craft=plumber`, `shop=plumbing`) around coordinates when Google API quota limits are met.
- **Protocol**: Raw Overpass QL POST queries returning XML/JSON node data.

## 📦 Core Python Dependencies
- **`SQLAlchemy`**: Handles async PostgreSQL operations seamlessly.
- **`requests`**: Manages low-latency synchronous HTTP requests to geocoding systems.
- **`asyncio`**: Orchestrates non-blocking background caching threads.
- **`PyJWT`**: Secures state-of-the-art token exchange for standard authentication.

# NearLink (Formerly QuickFix AI) 🚀
### Google Antigravity Hackathon — Challenge 2 Winner Submission
**An AI-Orchestrated Service Marketplace connecting standard consumers with local informal service providers (Electricians, Plumbers, Mechanics) in real time.**

---

## 📖 Project Overview
**NearLink** is a modern, state-of-the-art AI-driven orchestrator designed to bridge the gap between standard consumers and informal economy service providers (handymen, electricians, plumbers, carpenters, etc.) in Pakistan. 

By utilizing advanced **multi-agent orchestration** powered by **Google Gemini**, NearLink parses natural language service requests (including Urdu, English, and Roman Urdu code-switching), geolocates the user's needs, and connects them with the best-fit service professionals—offering a unified visual listing comprising both vetted platform-registered providers and real-time live map businesses.

---

## ⚠️ The Problem It Solves
Informal workers represent a massive segment of the workforce in developing countries, yet they remain highly fragmented and digitally invisible. When a home pipe bursts or an electrical short occurs, customers face:
1. **Inefficient Search**: Standard platforms only display corporate services, ignoring the local, affordable brick-and-mortar handymen right around the corner.
2. **Language Barriers**: Many customers express emergency needs in Roman Urdu or localized code-switching (e.g. *"Pani ka pipe leak ho raha hai bhai, defence phase 2 me plumber chahye"*), which traditional search engines completely fail to understand.
3. **Quoting & Discovery Friction**: Finding active, available help immediately with verified telephone coordinates remains a cumbersome manual chore.

NearLink solves this by offering an intuitive **AI chat interface** that acts as an intelligent service dispatcher, instantly geolocating requests, calculating actual proximity, and providing immediate contact options.

---

## 🛠️ The Tech Stack

### Frontend (User Experience)
- **Next.js 14 / React**: Ultra-fast, responsive UI utilizing stateful hydration.
- **Tailwind CSS / Vanilla CSS**: Curated premium aesthetic, neon green and gold accents, glassmorphism, dynamic animated icons, hover-effects, and standard layout scaling.
- **Interactive Map Layers**: OpenStreetMap integrations presenting geolocated pins for users and local shops.

### Backend (Robust API Core)
- **FastAPI (Python)**: High-performance asynchronous API endpoints.
- **SQLAlchemy (Async)**: Modern Object Relational Mapping (ORM) layer.
- **Neon PostgreSQL**: Fully managed serverless PostgreSQL cloud database hosting registered providers, customer records, and booking transactions.
- **Uvicorn**: Asynchronous ASGI server.

### AI Orchestration Layer (Google Antigravity Framework)
- **Google Gemini API**: Powers the multi-agent cognitive layers.
- **IntentAgent**: Classifies requests, parses entities, and extracts user intent from multi-lingual inputs.
- **RankingAgent**: Ranks combined platform-registered and external API results mathematically to find optimal proximity.

---

## 🧠 The Agentic Workflow & Role of Google Antigravity

NearLink leverages an advanced **multi-agent orchestration workflow** to process user queries autonomously:

```
[User Request] 
      │ (Urdu / Roman Urdu / English)
      ▼
┌──────────────┐
│ IntentAgent  │ ──► Parse Service Type & Geolocation coordinates
└──────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│      Unified Discovery Engine        │
│  ──────────────────────────────────  │
│  1. Database Registered Providers    │
│  2. Live Map Fetch (Google Places)   │
└──────────────────────────────────────┘
      │
      ▼
┌──────────────┐
│ RankingAgent │ ──► Proximity & Reputation Suitability Scoring (0 - 100)
└──────────────┘
      │
      ▼
[Structured Response to UI] ──► Direct Call / Interactive Bookings
```

### 1. Intent Classification & Geocoding
- The **IntentAgent** parses the user's natural text. It classifies the service category (`plumber`, `electrician`, etc.) and parses location tags.
- It translates text locations (e.g. "Defence Karachi") into coordinates using the **Google Geocoding API** or **Nominatim OpenStreetMap**.

### 2. Proximity Matching (Haversine Formula)
- Rather than standard geographic bounding-box queries, NearLink uses the mathematical **Haversine formula** to calculate precise straight-line distances ($d$) in kilometers between the client and each provider:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
where $R = 6371\text{ km}$.

### 3. Google Places & OpenStreetMap Fallback Search
- If a user requests a service where no platform-registered handymen are nearby, the system triggers **always-on live external discovery**:
  - **Google Places API**: Queries active businesses within a 5.0km radius, retrieving ratings, addresses, and vicinity structures.
  - **Google Place Details API**: Automatically queries and appends authentic business **phone numbers**, websites, and operating hours for direct client communication.
  - **OSM Overpass API**: Acts as a robust, rate-limit-free fallback search layer if Google Places quota is exceeded.

### 4. Dynamic Database Caching
- Discovered external providers are cached automatically in the `ExternalProvider` database table. If other users search the same area for similar services, the database serves the results instantly—saving API costs and improving load latency.

### 5. Multi-Criteria AI Ranking (RankingAgent)
- The **RankingAgent** merges database and external map records, maps long alphanumeric IDs to simple index keys (`prov_1`, `prov_2`) to prevent LLM transcription typos, and evaluates suitability based on:
$$\text{Score} = (0.40 \times \text{Rating}) + (0.35 \times \text{Distance Factor}) + (0.25 \times \text{Availability})$$
- AI outputs clear justifications (e.g., *"We recommend Bismillah Enterprises because they are just 0.47km away, with a verified rating of 5/5 stars"*).

---

## 📅 Simulated Booking & Follow-Up Workflows

- **Dynamic Proxy Registration**: When booking an external business, the system automatically creates a placeholder `Provider` entry inside the central database to maintain foreign key relational constraints on the `bookings` table. This guarantees clean transaction processing without application crashes.
- **Trace Logger**: An admin panel is built-in (`/admin/traces`) that shows the full, step-by-step agent execution trail behind every request for complete auditing and transparency.

---

## 🌟 Key Benefits for Users
- **Multi-lingual Ease**: Standard customers can type naturally in Roman Urdu (`Pani leak ho raha hai`) without strict command syntax.
- **Absolute Transparency**: View verified, proximity-based results displaying precise distance metrics.
- **Rich Contact Integration**: Call real businesses directly with actual phone numbers fetched straight from Google Maps.

---

## 🔒 Limitations
- **Geocoding Dependency**: Public free OpenStreetMap geocoding (Nominatim) can occasionally experience delays or traffic rate-limits. NearLink mitigates this with Google Geocoding fallbacks and preset city coordinates.
- **Google Maps API Quotas**: Requires active billing credits for Google Places details under heavy production loads.

---

## 🏆 Why This Solution is Strong for the Hackathon
1. **Solves a Real-World Challenge**: Addresses a critical, practical issue—bringing digital visibility to informal local handymen.
2. **Highly Resilient Agent Design**: Built with bulletproof fault tolerance, including NameError prevention, standard library safety, and mapping token index mappers to prevent LLM typo drops.
3. **VVIP Aesthetic Experience**: Features a sleek, modern UI, intuitive interactions, and instant search feedback.
4. **Complete Trace Transparency**: Features a dedicated agent execution logging system, allowing judges to monitor exactly how the multi-agent system operates step-by-step.

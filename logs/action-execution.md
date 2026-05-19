# Action Execution Log: Query Walkthrough

This document presents a step-by-step trace of how a search request moves through the system during active runtime operations.

## 🏃 Run Trace: "Plumber in DHA Karachi"

### Step 1: Client Input Received
- **Action**: User types query `Plumber DHA Phase 2` on the NearLink interface.
- **Route Triggered**: POST `/api/providers/rank`
- **Controller**: `routes/providers.py`

### Step 2: Location Processing
- **Action**: `provider_agent.py` calls `geocode_location` in `osm_search_agent.py`.
- **Result**: `"defence phase 2"` is geocoded to latitude `24.8311` and longitude `67.0722`.

### Step 3: Dual-Source Fetching
- **Registered Providers**: System queries local Postgres. Finds one plumber, `Ali` in Quaidabad ($d = 18.05\text{ km}$).
- **External Providers**: Centered on `24.8311, 67.0722`, system hits Google Places API.
  - Discovers **10 active shops** nearby (e.g. *Bismillah Enterprises*, *ForiFix*).
  - Automatically fetches details for phone numbers.
  - Background task saves newly found external providers in database cache.

### Step 4: Normalization & Indexing
- **Action**: The 11 total entries are merged. All place IDs are mapped to short keys `prov_1` through `prov_11`.
- **Result**: Prepares prompt structure without passing long alphanumeric strings.

### Step 5: Gemini Scoring & Response Delivery
- **Action**: Gemini evaluates proximity, ratings, and reviews to output ranked JSON.
- **Final Result**: The short-keys are restored to real IDs and presented to the UI. The nearest external choice (Bismillah Enterprises, 0.47 km away) is ranked #1.

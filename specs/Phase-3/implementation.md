# Phase 3: Implementation Details

## Frontend Pages
- `frontend/src/app/unified-search/page.js`: The "Antigravity" search experience.
- `frontend/src/app/providers/page.js`: AI-ranked results list.
- `frontend/src/app/provider/setup/page.js`: Onboarding for informal workers.
- `frontend/src/app/dashboard/page.js`: Unified customer control center.
- `frontend/src/app/provider/dashboard/page.js`: Provider-specific workflow management.

## Backend Agents & Logic
- `backend/app_agents/booking_agent.py`: Automates the scheduling process.
- `backend/routes/bookings.py`: CRUD for bookings and status updates.
- `backend/routes/requests.py`: Handles initial NLP request storage and parsing.

## Key Features
- **Map Integration:** Visualizing provider proximity.
- **Dynamic Slots:** Simple time-slot selection for informal services.
- **Verified Badge:** Logic for providers who have completed profile verification.

# Phase 1: Implementation Details

## Backend
- **Framework:** FastAPI
- **Database:** SQLite (SQLAlchemy ORM)
- **Security:** Passlib (bcrypt) for hashing, PyJWT for tokens.
- **Directory Structure:**
  - `app_agents/`: Specialized AI agents.
  - `routes/`: Modular API routing.
  - `scripts/`: Data management scripts.
  - `tests/`: Quality assurance suite.
- **Key Files:**
  - `backend/main.py`: App configuration and router registration.
  - `backend/models.py`: Core data structures.
  - `backend/database.py`: DB engine and session management.
  - `backend/routes/auth.py`: Logic for registration and login.

## Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Vanilla CSS + CSS Variables for theming.
- **Animations:** Framer Motion, GSAP.
- **State Management:** React Context API for Authentication.
- **Key Files:**
  - `frontend/src/app/layout.js`: Global styles and context providers.
  - `frontend/src/app/page.js`: High-fidelity landing page.
  - `frontend/src/context/AuthContext.js`: Session handling.

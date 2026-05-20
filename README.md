# NearLink 🚀
### Google Antigravity Hackathon — Challenge 2 Winner Submission
**An AI-Orchestrated Service Marketplace connecting standard consumers with local informal service providers (Electricians, Plumbers, Mechanics) in real time.**

---

## 📖 Project Overview
**NearLink** is a state-of-the-art AI-driven orchestrator designed to bridge the gap between standard consumers and informal economy service providers (handymen, electricians, plumbers, carpenters, etc.) in emerging markets like Pakistan.

By utilizing advanced **multi-agent orchestration** powered by **Google Gemini**, NearLink parses natural language service requests (including Urdu, English, and Roman Urdu code-switching), geolocates the user's needs, and connects them with the best-fit service professionals. It offers a unified ecosystem comprising vetted platform providers, real-time live map discovery, and a secure transaction layer.

---

## 🌟 The Startup Vision: Why NearLink?
NearLink isn't just a directory; it's a **self-sustaining digital economy** for the informal workforce.

### 🛠️ Problems Solved
1. **The Visibility Gap**: Informal workers (the backbone of the economy) are digitally invisible. NearLink makes them discoverable via AI.
2. **Pricing Friction**: Traditional platforms have rigid pricing. NearLink allows natural chat-based negotiation, verified by AI.
3. **Safety & Trust**: Finding a stranger from the street for home repair is risky. NearLink adds a layer of SOS safety and verified reviews.
4. **Language Barriers**: Most search engines fail at Roman Urdu (e.g., *"AC check karwana hai"*). NearLink's LLM core understands localized intent perfectly.

### 💰 Earning System & Cost-Effectiveness
- **Automated Monetization**: The system operates on a **Prepaid Commission Model**. Providers maintain a digital wallet; for every successful booking, a platform fee (e.g., 10%) is automatically calculated and settled.
- **Wallet Restricted Access**: If a provider's balance goes negative, their visibility is restricted, ensuring platform sustainability.
- **Low Overhead**: Built on serverless architecture (Neon PostgreSQL) and scalable AI (Google Gemini), the system requires zero "heavy" infrastructure, making it highly cost-effective for a lean startup.

---

## 🚀 Advanced Features

### 💬 AI-Orchestrated Chat & Negotiation
- **Real-time Messaging**: Secure communication channel between customers and providers.
- **Negotiation Verification Agent**: A specialized Gemini-powered agent that monitors chat history to identify and verify agreed-upon prices, preventing off-platform settlement fraud.

### 💳 Provider Wallet System
- **Financial Dashboard**: Providers can track earnings, view commission rates, and top up their balance via a sleek interface.
- **Dynamic Commissioning**: Automated fee deduction upon job completion.

### 🆘 SOS Safety System
- **Emergency Trigger**: A one-tap "SOS" button available during active bookings.
- **Admin Alerting**: Instantly notifies the Command Center if a safety issue arises, providing the provider and customer details for immediate intervention.

### 🛡️ Admin Command Center
- **System Stats**: Real-time monitoring of total commissions (paid/pending), total bookings, and user growth.
- **SOS Management**: A dedicated interface for admins to resolve safety alerts.
- **Trace Logger**: Full transparency into every agentic decision made by the system.

### 🤖 AI Follow-up & Trust
- **Automated Nudges**: The system detects inactive bookings and nudges users to confirm completion.
- **Trust Scores**: Providers earn reputation based on verified work, not just manual ratings.

---

## 🛠️ The Tech Stack

### Frontend (User Experience)
- **Next.js 14 / React**: Ultra-fast, responsive UI utilizing stateful hydration.
- **Tailwind CSS / Vanilla CSS**: Premium "Cyber-Gold" aesthetic with glassmorphism and motion effects.
- **Capacitor**: Cross-platform bridge for Android/iOS deployment.

### Backend (Robust API Core)
- **FastAPI (Python)**: High-performance asynchronous API.
- **SQLAlchemy (Async)**: Modern ORM with Neon PostgreSQL integration.
- **Neon DB**: Serverless PostgreSQL for instant scalability.

### AI Orchestration (Google Antigravity)
- **Google Gemini API**: Powers the multi-agent cognitive layers.
- **Multi-Agent Architecture**:
  - **IntentAgent**: Parses multi-lingual intent.
  - **RankingAgent**: Mathematical proximity & suitability scoring.
  - **NegotiationAgent**: Verifies price agreements in chat.
  - **BookingAgent**: Manages life-cycles and follow-ups.

---

## 🧠 The Agentic Workflow

```
[User Request] 
      │ (Urdu / Roman Urdu / English)
      ▼
┌──────────────┐
│ IntentAgent  │ ──► Parse Service Type & Geolocation
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
│ RankingAgent │ ──► Proximity & Reputation Scoring
└──────────────┘
      │
      ▼
[Negotiation]  ──► [NegotiationAgent] Verifies Agreed Price
      │
      ▼
[Completion]   ──► [BookingAgent] Trigger Wallet Deduction
```

---

## 🏁 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
# Set .env with GOOGLE_API_KEY and DATABASE_URL
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🏆 Hackathon Strength
NearLink stands out by combining **practical utility** for the informal sector with **cutting-edge AI safety**. It is a ready-to-scale startup idea that uses Google's AI not just for chat, but for **economic verification and human safety**.

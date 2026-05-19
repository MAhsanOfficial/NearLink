# QuickFix AI - AI Service Orchestrator for the Informal Economy

> 🏆 Built for Challenge 2: AI Service Orchestrator for the Informal Economy

A comprehensive platform connecting customers with local service providers (plumbers, electricians, AC repair, etc.). Features dual user registration, AI-powered service matching, geolocation-based search, and Google Maps integration for location verification.

## 🌟 Key Features

### Dual User System
- **Customers**: Search and book local services
- **Service Providers**: Register, manage profile, and receive bookings

### Smart Service Matching
- 🤖 AI-powered intent parsing (Urdu, Roman Urdu, English)
- 📍 Geolocation-based provider search
- 🗺️ Google Maps integration for verification
- 📊 Intelligent provider ranking
- ✅ Location verification system

### Provider Features
- Self-registration with profile management
- Location verification via Google Maps
- Dashboard for managing availability
- Service offerings customization
- Real-time booking notifications

### Customer Features
- Natural language service requests
- Top 2-3 nearest provider recommendations
- Provider verification status
- Distance and rating-based ranking
- Direct contact information

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js    │────▶│    FastAPI        │────▶│  Neon PostgreSQL │
│   Frontend   │◀────│    Backend        │◀────│    Database      │
└──────────────┘     └────────┬─────────┘     └─────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  AI Agents + Maps   │
                   │                     │
                   │  ┌─IntentAgent────┐ │
                   │  ├─ProviderAgent──┤ │
                   │  ├─RankingAgent───┤ │
                   │  ├─BookingAgent───┤ │
                   │  └─Google Maps────┘ │
                   └─────────────────────┘
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Get Google Maps API Key (Free):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable Geocoding API and Places API
4. Create credentials (API Key)
5. Free tier: 40,000 geocoding + 28,000 places requests/month

### 3. Run Backend

```bash
# Initialize database
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register (customer or provider)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Provider Management
- `POST /api/providers/register` - Register provider profile
- `GET /api/providers/my-profile` - Get my profile
- `PUT /api/providers/my-profile` - Update my profile
- `GET /api/providers/all` - List all providers
- `GET /api/providers/{id}` - Get provider details

### Service Search
- `POST /api/request/full-search` - Complete search with AI + ranking
- `POST /api/providers/search-with-maps` - Search with Maps integration
- `POST /api/providers/search` - Basic provider search

### Bookings
- `POST /api/bookings/create` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/{id}` - Get booking details

## 🤖 AI Agents

| Agent | Role |
|-------|------|
| **IntentAgent** | Parses Urdu/Roman Urdu/English requests, extracts service type, location, time, urgency |
| **ProviderDiscoveryAgent** | Searches database for matching providers with geolocation support |
| **RankingAgent** | AI-powered ranking by distance, rating, availability with reasoning |
| **BookingAgent** | Creates bookings and schedules follow-up notifications |

## 🗺️ Google Maps Integration

### Features
1. **Location Verification**: Verifies provider addresses during registration
2. **Nearby Search**: Finds nearby businesses matching service type
3. **Distance Calculation**: Accurate distance using Haversine formula
4. **Geocoding**: Converts addresses to coordinates

### Usage Example
```python
# Automatic verification during provider registration
verification = await verify_location_with_maps(
    address="G-13, Islamabad",
    latitude=33.6844,
    longitude=73.0479
)
# Returns: {"verified": True, "distance_from_geocoded": 0.15}
```

## 📊 Database Schema

### Users
- `user_type`: "customer" or "provider"
- Email, name, password, phone

### Providers
- Linked to user account (`user_id`)
- Location data (address, lat, lng)
- Services offered (JSON array)
- Rating and reviews
- Verification status
- Working hours, price range

### Service Requests
- User requests with parsed intent
- Service type, location, urgency
- Language detection

### Bookings
- Links requests to providers
- Status tracking
- Scheduled time

## 🔄 Workflow

### Customer Journey
1. Register as customer
2. Submit service request: "Mujhe electrician chahiye G-13 mein"
3. System parses intent (AI)
4. Finds nearest providers (geolocation)
5. Ranks by distance + rating (AI)
6. Shows top 2-3 with contact details
7. Customer books service

### Provider Journey
1. Register as provider
2. Create profile with location
3. System verifies location (Google Maps)
4. Manage availability and services
5. Receive booking notifications
6. Complete jobs and get ratings

## 🧪 Testing

### Test Provider Registration
```bash
# 1. Register provider user
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@test.com","name":"Test Provider","password":"test123","user_type":"provider"}'

# 2. Create provider profile
curl -X POST http://localhost:8000/api/providers/register \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test Electrician","service_type":"Electrician","area":"G-13","address":"G-13, Islamabad","latitude":33.6844,"longitude":73.0479,"phone":"0300-1234567"}'
```

### Test Service Search
```bash
# 1. Register customer
curl -X POST http://localhost:8000/api/auth/signup \
  -d '{"email":"customer@test.com","name":"Test Customer","password":"test123","user_type":"customer"}'

# 2. Search for service
curl -X POST "http://localhost:8000/api/request/full-search?user_latitude=33.6844&user_longitude=73.0479" \
  -H "Authorization: Bearer <token>" \
  -d '{"raw_text":"I need an electrician in G-13"}'
```

## ⚡ Tech Stack

- **Frontend**: Next.js 15, Framer Motion, Glassmorphism UI
- **Backend**: FastAPI, SQLAlchemy Async, JWT Auth
- **AI**: OpenAI Agents SDK + Gemini 2.0 Flash
- **Database**: Neon PostgreSQL (Serverless)
- **Maps**: Google Maps API (Geocoding + Places)
- **Geolocation**: Haversine distance calculation

## 📖 Documentation

- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Detailed API docs and workflows
- [API Reference](IMPLEMENTATION_GUIDE.md#api-endpoints) - Complete endpoint documentation

## 🔐 Security

- JWT-based authentication
- Password hashing (bcrypt)
- API key protection
- Input validation
- Rate limiting ready

## 🚧 Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure Google Maps API key
- [ ] Set up database backups
- [ ] Implement rate limiting
- [ ] Add monitoring/logging
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Add API key restrictions (Google Maps)

## 📝 License

MIT License - Built for Google Antigravity Hackathon

# NearLink - AI-Powered Local Services Marketplace

## 🎯 Project Overview

**NearLink** is a comprehensive AI-powered platform that connects customers with local service providers (plumbers, electricians, carpenters, etc.) in Pakistan's informal economy. The application uses advanced multi-agent AI architecture to intelligently match service requests with the best available providers.

## 🌟 Key Features

### For Customers
- **Natural Language Search**: Request services in Urdu, Roman Urdu, or English
- **AI-Powered Matching**: Intelligent provider ranking based on proximity, ratings, and availability
- **Unified Search**: Access both registered providers and real external businesses from Google Places
- **Real-Time Chat**: Negotiate prices directly with providers
- **Booking Management**: Track service requests and bookings
- **Safety Features**: SOS alert system for emergencies

### For Service Providers
- **Professional Dashboard**: Manage bookings and availability
- **Wallet System**: Track earnings and commissions
- **Direct Customer Communication**: Chat and negotiate prices
- **Profile Management**: Showcase services, ratings, and reviews
- **Real-Time Notifications**: Get instant alerts for new bookings

## 🤖 Multi-Agent AI Architecture

### 1. Intent Agent (`IntentAgent`)
- Parses multi-lingual queries (Urdu/Roman Urdu/English)
- Extracts service type, location, timing, and urgency
- Fallback system for keyword-based parsing

### 2. Discovery Agent (`DiscoveryAgent`)
- Geocoding with Nominatim API
- Searches registered providers in PostgreSQL
- Queries Google Places API for external businesses
- OSM Overpass API as backup
- Retrieves real phone numbers and addresses

### 3. Ranking Agent (`RankingAgent`)
- Calculates proximity using Haversine formula
- Evaluates ratings and availability
- Generates AI-powered recommendations in Urdu/English
- ID mapping to prevent LLM hallucinations

### 4. Booking Agent (`BookingAgent`)
- Handles booking confirmations
- Automatic proxy registration for external providers
- Status tracking and notifications
- Payment processing

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.2.6 (React)
- **Styling**: Custom CSS (Careem-style design)
- **State Management**: React Context API
- **Routing**: Next.js App Router
- **UI Philosophy**: Clean, minimal, mobile-first

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon)
- **AI/ML**: Google Gemini 1.5 Flash
- **APIs**: 
  - Google Places API (business discovery)
  - Google Maps Geocoding API
  - OSM Nominatim API (backup geocoding)
  - OSM Overpass API (backup business search)

### Infrastructure
- **Hosting**: Local development (ready for cloud deployment)
- **Database**: Neon PostgreSQL (Serverless)
- **Environment**: Windows/Cross-platform

## 📊 Database Schema

### Core Tables
- **users**: Customer and provider authentication
- **providers**: Service provider profiles with ratings
- **service_requests**: Customer service requests
- **bookings**: Confirmed bookings with status tracking
- **external_providers**: Cached Google Places businesses
- **chat_messages**: Real-time negotiation chat
- **agent_traces**: AI decision logging for debugging

## 🎨 Design System

### Careem-Style UI
- **Primary Color**: #00b140 (Careem Green)
- **Background**: #f5f5f5 (Light gray)
- **Cards**: White (#ffffff) with subtle shadows
- **Typography**: Inter font family
- **Principles**: Simple, fast, mobile-first, clean

### Component Library
- Clean card components
- Primary/Secondary buttons
- Badge system (success, warning, info)
- Input fields with focus states
- Loading spinners
- Responsive grids

## 🚀 Key Workflows

### Customer Journey
1. Open app → Natural language service request
2. AI parses intent → Extracts service type and location
3. Discovery agent finds providers (DB + Google Places)
4. Ranking agent sorts by relevance
5. Customer views top matches with AI recommendations
6. Customer books provider → Chat opens
7. Negotiate price → Confirm booking
8. Service completed → Payment processed

### Provider Journey
1. Sign up → Complete profile setup
2. Set availability and service areas
3. Receive booking notifications
4. Chat with customer → Negotiate price
5. Pickup job → Start service
6. Upload proof of work
7. Complete job → Receive payment (minus commission)

## 💡 Innovation Highlights

### 1. Multi-Source Discovery
- Combines internal database with Google Places API
- Real-time business discovery with live phone numbers
- Fallback to OSM Overpass for resilience

### 2. AI-Powered Negotiation
- Chat history analysis for price verification
- Prevents provider fraud
- Suggests fair prices based on chat context

### 3. Proxy Registration System
- External businesses can be booked instantly
- Dynamic database entry creation
- Maintains referential integrity

### 4. Multi-Lingual Support
- Roman Urdu, Urdu, and English parsing
- Code-switching support ("Bhai AC repair chahiye near DHA")
- AI generates responses in user's language

### 5. Safety Features
- SOS alert system
- Admin notification dashboard
- Booking status tracking
- User verification

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Service Requests
- `POST /api/request/parse` - Parse natural language query
- `GET /api/request/history` - User's request history

### Providers
- `POST /api/providers/rank` - Rank and search providers
- `GET /api/providers/my-profile` - Provider profile
- `PUT /api/providers/my-profile` - Update provider profile

### Unified Search
- `POST /api/unified/search` - Search internal + external providers
- Returns merged, ranked results

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/{id}` - Get booking details
- `PATCH /api/bookings/{id}/status` - Update status
- `POST /api/bookings/{id}/sos` - Trigger emergency alert

### Chat
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/{booking_id}` - Get chat history
- `POST /api/chat/messages/{msg_id}/accept` - Accept price offer

## 🔐 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control (customer/provider/admin)
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (ORM)

## 📈 Scalability Features

- Multi-agent parallel processing
- Database connection pooling
- Async API operations
- External API caching
- Trace logging for monitoring

## 🎯 Target Market

### Primary Users
- **Customers**: Urban Pakistani households needing home services
- **Providers**: Informal sector workers (plumbers, electricians, carpenters, etc.)

### Geographic Focus
- Karachi
- Lahore
- Islamabad
- Rawalpindi
- Other major Pakistani cities

## 🏆 Competitive Advantages

1. **AI-First Approach**: Advanced multi-agent system for better matching
2. **Multi-Source Discovery**: Not limited to registered users
3. **Natural Language**: Speak naturally in any language
4. **Real-Time Negotiation**: Direct price negotiation with AI oversight
5. **Trust & Safety**: Comprehensive verification and SOS features
6. **Local Focus**: Built specifically for Pakistan's informal economy

## 📊 Metrics & Analytics

### Tracked via Agent Traces
- Intent parsing accuracy
- Provider discovery sources used
- Ranking decision factors
- Response times per agent
- Booking conversion rates

## 🔮 Future Enhancements

- Voice input for service requests
- Video verification for providers
- In-app payment integration (JazzCash, Easypaisa)
- Rating and review system
- Service completion photos
- Scheduled recurring services
- Referral program
- Provider background checks
- Insurance coverage
- Multi-language UI (full Urdu support)

## 📞 Support Features

- In-app chat support
- Provider help center
- Customer FAQ
- Emergency contact system
- Admin dashboard for issue resolution

## 🌐 Deployment

### Current Status
- ✅ Development environment running
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:3001

### Production Ready
- Environment variable configuration
- Database migrations
- API rate limiting
- Error tracking
- Performance monitoring

---

**Version**: 2.0 (Careem Style UI)  
**Last Updated**: June 2026  
**Status**: Active Development  
**License**: Proprietary

# NearLink - Demo Scenarios & Test Cases

## 🎬 Live Demo Scenarios

### Scenario 1: Customer Books Plumber (Roman Urdu)
**User**: Zainab (Customer in DHA, Karachi)

**Step 1**: Opens app, types query
```
"Bhai pipe leak ho gaya hai kitchen me defence phase 2 me kisi plumber ka number do"
```

**Step 2**: AI Intent Agent parses
```json
{
  "service_type": "Plumber",
  "location": "Defence Phase 2, Karachi",
  "urgency": "high",
  "time": "ASAP",
  "language_detected": "Roman Urdu"
}
```

**Step 3**: Discovery Agent finds providers
- Searches PostgreSQL: 2 registered plumbers found
- Queries Google Places API: 5 nearby plumbing shops found
- Total: 7 providers

**Step 4**: Ranking Agent evaluates
```
Rank 1: "Bismillah Plumbing Services" (0.5km away, 4.8⭐, Google Places)
Rank 2: "Ali's Plumbing" (1.2km away, 4.5⭐, Registered)
Rank 3: "Expert Plumber DHA" (2.1km away, 4.2⭐, Google Places)
```

**Step 5**: Customer books Rank 1
- Chat opens
- Negotiates: Customer offers Rs. 1500, Provider agrees
- Booking confirmed
- Provider arrives, fixes pipe
- Job completed, payment processed

---

### Scenario 2: Customer Books Electrician (English)
**User**: Ahmed (Customer in Gulshan-e-Iqbal, Karachi)

**Step 1**: Types in English
```
"Need electrician urgently, AC not working in Gulshan block 13"
```

**Step 2**: AI parses
```json
{
  "service_type": "Electrician",
  "location": "Gulshan-e-Iqbal Block 13, Karachi",
  "urgency": "high",
  "time": "urgent",
  "language_detected": "English"
}
```

**Step 3**: Discovery finds 8 providers
- 3 registered electricians
- 5 external from Google Places

**Step 4**: Top result
```
"Dawood Expert Electrician" (0.8km, 5.0⭐, 15 reviews)
```

**Step 5**: Books, negotiates Rs. 2000, service completed

---

### Scenario 3: Provider Receives Booking
**User**: Hassan (Electrician Provider in North Nazimabad)

**Step 1**: Provider dashboard shows
- Total Bookings: 45
- Rating: 4.7⭐
- Status: Available ✅

**Step 2**: New booking notification
```
Customer: Fatima
Service: AC Repair
Location: North Nazimabad Block L
Scheduled: Today 3:00 PM
```

**Step 3**: Provider opens chat
- Customer: "AC compressor issue hai, kitne mein theek karoge?"
- Provider sends offer: Rs. 3500
- Customer: "Rs. 3000 mein kar do"
- Provider: "Okay, Rs. 3200 final"
- Customer accepts

**Step 4**: Provider picks up job
- Enters negotiated amount: Rs. 3200
- AI verifies against chat history ✅
- Job status: In Progress

**Step 5**: Service completion
- Provider uploads photo of repaired AC
- Marks job complete
- Payment: Rs. 3200 - Rs. 320 commission = Rs. 2880 to wallet

---

### Scenario 4: Unified Search with External Provider
**User**: Sarah (Customer in Clifton, Karachi)

**Step 1**: Uses Unified Search
```
"Carpenter chahiye furniture repair ke liye Clifton mein"
```

**Step 2**: Results show
- **Registered**: 1 verified carpenter (3.2km away)
- **External**: 4 carpentry shops from Google Places

**Step 3**: Customer selects external provider
```
"Karachi Wood Works" (0.6km, 4.6⭐, Google Places)
Phone: 0300-1234567
Address: Main Clifton Road
```

**Step 4**: Customer copies contact details
- Calls directly
- Books appointment
- NearLink creates proxy registration for tracking

---

### Scenario 5: Emergency SOS Alert
**User**: Maria (Customer)

**Step 1**: During service, feels unsafe
- Provider behaving inappropriately

**Step 2**: Triggers SOS button
- Red alert sent to admin dashboard
- Booking flagged with safety concern
- Emergency notification system activated

**Step 3**: Admin response
- Reviews booking details
- Contacts customer immediately
- Disables provider account pending investigation
- Logs incident for legal record

---

### Scenario 6: Multi-Language Code-Switching
**User**: Bilal (Customer in Lahore)

**Step 1**: Types mixed query
```
"Bhai AC technician chahiye ASAP, very urgent hai Model Town Lahore mein"
```

**Step 2**: AI successfully parses
```json
{
  "service_type": "AC Technician",
  "location": "Model Town, Lahore",
  "urgency": "very high",
  "time": "ASAP",
  "language_detected": "Roman Urdu + English (Code-switching)"
}
```

**Step 3**: Results delivered with AI recommendation in Urdu
```
"Model Town ke sabse qareeb aur best rated AC technician 'Cooling Experts' hai,
sirf 0.4km door aur 4.9 star rating hai. Inhein abhi book karen."
```

---

### Scenario 7: Provider Fraud Prevention
**User**: Suspicious Provider "Ali Fake"

**Step 1**: Customer books Ali for plumbing (Rs. 2000 agreed in chat)

**Step 2**: Ali tries to pickup job with Rs. 5000
- AI scans chat history
- No mention of Rs. 5000 found
- System rejects

**Step 3**: AI suggests actual amount
```
"Chat history mein Rs. 2000 negotiate hui thi. 
Suggested Amount: Rs. 2000"
```

**Step 4**: Provider must enter correct amount
- Prevents overcharging fraud
- Maintains trust in platform

---

## 🧪 Test Cases for Quality Assurance

### Authentication Tests
```
✅ Customer signup with valid data
✅ Provider signup with services
✅ Login with correct credentials
❌ Login with wrong password
❌ Duplicate email registration
✅ JWT token validation
✅ Role-based access (customer can't access provider routes)
```

### Search & Discovery Tests
```
✅ Parse Roman Urdu query correctly
✅ Parse English query correctly
✅ Parse Urdu query correctly
✅ Extract service type from natural language
✅ Extract location from query
✅ Geocode "DHA Karachi" to coordinates
✅ Search registered providers in DB
✅ Query Google Places API successfully
✅ Merge results from multiple sources
✅ Fallback to OSM when Google fails
```

### Ranking Tests
```
✅ Rank by proximity (closest first)
✅ Consider ratings in ranking
✅ Boost verified providers
✅ Generate AI recommendations
✅ Handle empty results gracefully
✅ ID mapping prevents LLM errors
```

### Booking Tests
```
✅ Create booking for registered provider
✅ Create booking for external provider (proxy registration)
✅ Update booking status (confirmed → in_progress → completed)
✅ Prevent invalid status transitions
✅ Calculate commission correctly (10%)
✅ Track wallet balance
✅ Prevent pickup without sufficient balance
```

### Chat & Negotiation Tests
```
✅ Send text message
✅ Send price offer
✅ Accept price offer
✅ Verify negotiated amount against chat
✅ Suggest correct amount if mismatch
✅ Real-time message updates
✅ Message history persistence
```

### Safety Tests
```
✅ Trigger SOS alert
✅ Notify admin dashboard
✅ Flag booking as unsafe
✅ Prevent provider access after SOS
✅ Log incident for records
```

### Edge Cases
```
✅ Query with no location mentioned (use user's saved location)
✅ Service type not in database (AI extraction fallback)
✅ No providers found (show empty state)
✅ Provider unavailable (show next best option)
✅ Network failure (show error, retry)
✅ Google API rate limit (fallback to OSM)
✅ Gemini API down (use keyword fallback)
```

---

## 📊 Performance Benchmarks

### Response Times (Target)
- Intent parsing: < 500ms
- Provider discovery: < 2000ms
- Ranking: < 800ms
- Total search time: < 3 seconds
- Chat message delivery: < 100ms

### Accuracy Targets
- Intent parsing accuracy: > 95%
- Geocoding accuracy: > 90%
- Service type extraction: > 98%
- Language detection: > 99%

---

## 🎯 Demo Script for Presentation

### 5-Minute Demo Flow

**[0:00 - 0:30] Introduction**
"NearLink connects customers with local service providers using AI. Watch how it works."

**[0:30 - 1:30] Customer Journey**
1. Show natural language input in Roman Urdu
2. AI parses and shows extracted intent
3. Displays ranked providers with recommendations

**[1:30 - 2:30] Booking & Chat**
1. Customer books top provider
2. Chat opens for negotiation
3. Price agreed, booking confirmed

**[2:30 - 3:30] Provider Dashboard**
1. Show provider receiving booking
2. Provider dashboard with stats
3. Pickup job with AI verification

**[3:30 - 4:30] Unified Search**
1. Search shows both registered + Google Places
2. Customer can book verified or call external
3. Real phone numbers from Google

**[4:30 - 5:00] Closing**
"AI-powered, multi-source, safe, and fast. NearLink transforms Pakistan's informal economy."

---

## 💬 Sample Queries to Demonstrate

### Roman Urdu Queries
```
"Mujhe electrician chahiye bijli ka kaam karne ke liye Gulshan mein"
"Plumber ko bulao, pipe phat gaya hai bathroom mein"
"AC repair karna hai DHA phase 6 mein urgent"
"Carpenter chahiye almari banana hai"
"Painter se ghar ki painting karwani hai"
```

### English Queries
```
"Need AC technician in Clifton today"
"Looking for plumber near North Nazimabad"
"Urgent electrician required in Gulshan"
"Want to hire carpenter for furniture repair"
"Need mechanic for car service in DHA"
```

### Mixed/Code-Switching
```
"Bhai electrician chahiye very urgent Gulshan mein"
"AC technician ko bulao ASAP, bohot hot hai"
"Plumber lagao fast, pipe leak ho raha hai"
```

---

**Use these scenarios to demonstrate NearLink's capabilities!**

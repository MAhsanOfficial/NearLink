# 🎨 Render Free Deployment - Visual Step-by-Step Guide

## 📸 Screenshot-by-Screenshot Instructions

---

## 🔐 Step 1: Sign Up (No Card Required!)

```
🌐 Go to: https://render.com

You'll see:
┌─────────────────────────────────────────┐
│  Render - Cloud Application Platform    │
│                                         │
│  [Get Started for Free]                 │
│  [Sign in with GitHub]  ← Click This!  │
│  [Sign in with Email]                   │
└─────────────────────────────────────────┘

✅ Choose "Sign in with GitHub" (easiest)
```

---

## 🔗 Step 2: Authorize Render

```
GitHub will show:
┌─────────────────────────────────────────┐
│  Authorize Render                        │
│                                         │
│  Render wants to:                       │
│  ✓ Read your repositories               │
│  ✓ Access commit status                 │
│                                         │
│  [Authorize Render]  ← Click This!     │
└─────────────────────────────────────────┘

✅ Click "Authorize Render"
```

---

## 🏠 Step 3: Render Dashboard

```
You'll land on:
┌─────────────────────────────────────────┐
│  Dashboard          [New +] ← Click!    │
│                                         │
│  ┌──────────────────────┐              │
│  │  No services yet     │              │
│  │  Create your first   │              │
│  │  [+ New Web Service] │              │
│  └──────────────────────┘              │
└─────────────────────────────────────────┘

Click "New +" button OR "New Web Service"
```

---

## 📋 Step 4: Choose Service Type

```
A dropdown appears:
┌─────────────────────────────────────────┐
│  Create a new...                        │
│                                         │
│  ○ Blueprint (Paid - Skip this!)       │
│  ● Web Service  ← Select This!         │
│  ○ Private Service                      │
│  ○ Background Worker                    │
│  ○ Cron Job                            │
│  ○ Static Site                          │
└─────────────────────────────────────────┘

✅ Select "Web Service"
```

---

## 🔌 Step 5: Connect Repository

```
If first time:
┌─────────────────────────────────────────┐
│  Connect a repository                   │
│                                         │
│  [Connect account]  ← Click if new!    │
│                                         │
│  OR if already connected:               │
│                                         │
│  Search: [________________]             │
│                                         │
│  ✓ YourUsername/NearLink  [Connect]   │
│  ✓ YourUsername/OtherRepo [Connect]   │
└─────────────────────────────────────────┘

Find "NearLink" and click [Connect]
```

---

## ⚙️ Step 6: Configure Service

```
Fill in the form:
┌─────────────────────────────────────────────────┐
│  Name                                           │
│  [nearlink-backend____________________]        │
│                                                 │
│  Region                                         │
│  [Oregon (US West)____▼] ← Choose closest     │
│                                                 │
│  Branch                                         │
│  [main________________________▼]               │
│                                                 │
│  Root Directory (Optional)                      │
│  [backend_____________________]  ← Important!  │
│                                                 │
│  Runtime                                        │
│  [Python 3____________________▼]               │
│                                                 │
│  Build Command                                  │
│  [pip install -r requirements.txt__]          │
│                                                 │
│  Start Command                                  │
│  [uvicorn main:app --host 0.0.0.0 --port $PORT]│
│                                                 │
│  Instance Type                                  │
│  ● Free  ← This should be selected!           │
│  ○ Starter ($7/mo)                             │
│  ○ Standard ($25/mo)                           │
└─────────────────────────────────────────────────┘

⚠️ IMPORTANT: Root Directory = "backend"
```

---

## 🔐 Step 7: Environment Variables

```
Scroll down to "Environment Variables" section:
┌─────────────────────────────────────────────────┐
│  Environment Variables (Optional)               │
│                                                 │
│  [+ Add Environment Variable]                  │
│                                                 │
│  Key             Value                          │
│  ┌─────────┐    ┌──────────────────────┐      │
│  │DATABASE_URL│  │postgresql://...      │      │
│  └─────────┘    └──────────────────────┘      │
│                                                 │
│  [+ Add Environment Variable]                  │
└─────────────────────────────────────────────────┘

Click "[+ Add Environment Variable]" for each:
```

**Add These Variables:**

```
1. DATABASE_URL
   postgresql://your_neon_connection_string

2. GEMINI_API_KEY
   your_gemini_api_key_here

3. GOOGLE_PLACES_API_KEY
   AIzaSyB_6QmnfHPgqxMXge1un8nwKieKpIU5HWw

4. SECRET_KEY
   (click "Generate" button if available)

5. ALLOWED_ORIGINS
   *
```

---

## 🚀 Step 8: Deploy!

```
At the bottom:
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Cancel]        [Create Web Service] ← Click! │
│                                                 │
└─────────────────────────────────────────────────┘

✅ Click "Create Web Service"
```

---

## 📊 Step 9: Watch Build Logs

```
Build starts automatically:
┌─────────────────────────────────────────────────┐
│  nearlink-backend                               │
│  ┌──────┐ Deploying...                         │
│  │ Logs │ Events │ Shell │                     │
│  └──────┘                                       │
│                                                 │
│  ==> Cloning from GitHub...                    │
│  ==> Installing dependencies...                │
│  ==> Collecting fastapi==0.115.0               │
│  ==> Collecting uvicorn...                     │
│  ==> Successfully installed fastapi            │
│  ==> Starting server...                        │
│  ==> Your service is live! 🎉                  │
│                                                 │
│  https://nearlink-backend.onrender.com         │
└─────────────────────────────────────────────────┘

Wait 3-5 minutes for completion
```

---

## ✅ Step 10: Copy Your URL

```
When "Live" badge appears:
┌─────────────────────────────────────────────────┐
│  nearlink-backend        [●Live]               │
│                                                 │
│  https://nearlink-backend.onrender.com         │
│  [Copy URL] ← Click to copy!                  │
│                                                 │
│  Last Deploy: Just now                         │
│  Status: Running                               │
└─────────────────────────────────────────────────┘

✅ Copy this URL for frontend configuration!
```

---

## 🧪 Step 11: Test Your API

```
Open in browser:
https://nearlink-backend.onrender.com/health

Should show:
┌─────────────────────────────────────────────────┐
│  {"status":"healthy"}                          │
└─────────────────────────────────────────────────┘

✅ If you see this, deployment successful! 🎉
```

---

## 📱 What Your Dashboard Looks Like

```
┌─────────────────────────────────────────────────┐
│  Dashboard                         [New +]      │
│                                                 │
│  Web Services                                   │
│  ┌───────────────────────────────────────────┐ │
│  │ nearlink-backend      [●Live]            │ │
│  │ Free                                      │ │
│  │ Oregon (US West)                          │ │
│  │ Last deploy: 2 minutes ago               │ │
│  │                                           │ │
│  │ [View] [Settings] [Logs] [Metrics]      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Databases        (None)                       │
│  Static Sites     (None)                       │
└─────────────────────────────────────────────────┘

Your service is now running 24/7! (with 15min sleep)
```

---

## 🔄 Auto-Deploy Setup

```
In your service Settings:
┌─────────────────────────────────────────────────┐
│  Settings                                       │
│                                                 │
│  Auto-Deploy                                    │
│  ┌──────────────────────────────────────────┐  │
│  │ ✓ Auto-deploy from main branch          │  │
│  │                                          │  │
│  │ Every time you push to main, Render    │  │
│  │ will automatically build and deploy.    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

This is enabled by default! ✅
```

---

## 🎯 Common Screens You'll See

### **During Build:**
```
[Building...]  (Yellow - 2-3 minutes)
```

### **After Success:**
```
[●Live]  (Green - Service is running)
```

### **If Sleeping:**
```
[○Sleeping]  (Gray - Waking up takes 30 seconds)
```

### **If Failed:**
```
[●Failed]  (Red - Check logs for errors)
```

---

## 🛠️ Where to Find Important Buttons

```
Service Dashboard:
┌─────────────────────────────────────────────────┐
│  nearlink-backend                               │
│  ┌────┐ ┌────────┐ ┌────┐ ┌────────┐          │
│  │Logs│ │Settings│ │Shell│ │Metrics │          │
│  └────┘ └────────┘ └────┘ └────────┘          │
│                                                 │
│  Logs      → View real-time console output     │
│  Settings  → Change env vars, domain           │
│  Shell     → Access terminal (Paid feature)    │
│  Metrics   → CPU, Memory, Request stats        │
└─────────────────────────────────────────────────┘
```

---

## 🎊 Congratulations!

Your backend is now live at:
```
https://nearlink-backend.onrender.com
```

**Next Steps:**
1. Copy URL
2. Update frontend `.env`:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://nearlink-backend.onrender.com
   ```
3. Test all API endpoints
4. Deploy frontend!

---

## 📞 Quick Links

- **Dashboard**: https://dashboard.render.com/
- **Docs**: https://render.com/docs
- **Status**: https://status.render.com/
- **Community**: https://community.render.com/

---

**You did it! 🚀 Backend is LIVE! 🎉**

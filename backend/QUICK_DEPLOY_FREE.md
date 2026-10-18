# 🆓 NearLink Backend - FREE Render Deployment (No Card Required)

## ⚡ 5-Minute Deployment Guide

---

## 📋 Prerequisites
- ✅ GitHub account
- ✅ Render.com account (sign up with GitHub)
- ✅ Your code pushed to GitHub

---

## 🚀 Step-by-Step Deployment

### **Step 1: Push Code to GitHub**

```bash
cd backend
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

---

### **Step 2: Create Render Account**

1. Go to: https://render.com/
2. Click **"Get Started"**
3. Choose **"Sign in with GitHub"** (easiest)
4. Authorize Render

**NO CREDIT CARD REQUIRED FOR FREE TIER!** ✅

---

### **Step 3: Create Web Service**

1. Click **"New +"** (top right corner)
2. Select **"Web Service"**
3. Click **"Connect account"** (if first time)
4. Find **"NearLink"** repository
5. Click **"Connect"** next to it

---

### **Step 4: Configure Settings**

Copy-paste these exact values:

| Field | Value |
|-------|-------|
| **Name** | `nearlink-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Instance Type**: Select **"Free"** (should be pre-selected)

---

### **Step 5: Add Environment Variables**

Scroll down to **"Environment Variables"**

Click **"Add Environment Variable"** and add these one by one:

#### **Required Variables:**

```bash
# Database
DATABASE_URL
postgresql://your_neon_connection_string_here

# AI APIs
GEMINI_API_KEY
your_gemini_key_here

GOOGLE_PLACES_API_KEY
AIzaSyB_6QmnfHPgqxMXge1un8nwKieKpIU5HWw

# Security (Render auto-generates this)
SECRET_KEY
click_generate_button

# CORS
ALLOWED_ORIGINS
*
```

**How to Add:**
1. Type key name (e.g., `DATABASE_URL`)
2. Paste value in second box
3. Click **"Add"**
4. Repeat for each variable

---

### **Step 6: Deploy!**

1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait 3-5 minutes (watch logs)
4. ✅ Done when you see: "Your service is live at https://..."

---

## 🎯 Your Backend URL

After deployment completes:

```
https://nearlink-backend.onrender.com
```

**Copy this URL** - you'll need it for frontend!

---

## ✅ Verify Deployment

Test your API:

```bash
# Open in browser or use curl
https://nearlink-backend.onrender.com/health
```

**Expected Response:**
```json
{"status": "healthy"}
```

---

## 🔄 Auto-Deploy on Git Push

Render automatically redeploys when you push to `main`:

```bash
# Make changes
git add .
git commit -m "Update backend"
git push origin main

# Render auto-deploys in 3-5 minutes!
```

---

## ⚠️ Important Free Tier Notes

### **What You Get FREE:**
- ✅ 750 hours/month (enough for 24/7 running)
- ✅ 512MB RAM
- ✅ Shared CPU
- ✅ Custom domains
- ✅ Auto SSL (HTTPS)

### **Limitations:**
- ⏰ Auto-sleeps after **15 minutes** of inactivity
- 🐌 **30-second cold start** on first request after sleep
- 🔄 Resets every 24 hours (loses in-memory data)

**Solution:** Use external database (Neon PostgreSQL) ✅

---

## 🔥 Keep Your App Awake (Optional)

### **Method 1: UptimeRobot (FREE)**

1. Sign up: https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://nearlink-backend.onrender.com/health`
   - Interval: 5 minutes
3. Pings your app every 5 mins = stays awake!

### **Method 2: Cron-Job.org (FREE)**

1. Go to: https://cron-job.org/
2. Create free account
3. Add cronjob:
   - URL: `https://nearlink-backend.onrender.com/health`
   - Interval: Every 10 minutes
4. Keeps app alive!

---

## 🛠️ Troubleshooting

### ❌ **Build Failed**

**Error:** "No module named 'xyz'"
- Check `requirements.txt` has all dependencies
- Test locally: `pip install -r requirements.txt`

### ❌ **App Crashes on Start**

**Error:** "Address already in use"
- Verify start command uses `$PORT` variable
- Should be: `--port $PORT` (not `--port 8000`)

### ❌ **Database Connection Failed**

**Error:** "could not connect to server"
- Check `DATABASE_URL` format
- Must include `?sslmode=require` at end
- Example: `postgresql://user:pass@host/db?sslmode=require`

### ❌ **CORS Errors**

**Error:** "blocked by CORS policy"
- Add frontend domain to `ALLOWED_ORIGINS`
- Or use `*` for testing (not recommended for production)

---

## 📊 Monitor Your App

### **View Logs:**
Dashboard → Your Service → **"Logs"** tab

### **Check Metrics:**
Dashboard → Your Service → **"Metrics"** tab
- Request count
- Memory usage
- Response time

---

## 🎉 Success Checklist

- [ ] Backend deployed successfully
- [ ] Health endpoint returns 200
- [ ] Environment variables configured
- [ ] Database connected
- [ ] No errors in logs
- [ ] Copied backend URL
- [ ] Tested API endpoint
- [ ] (Optional) Set up UptimeRobot

---

## 🔐 Security Tips (Free Tier)

1. **Don't commit .env file**
   ```bash
   # .gitignore already includes:
   .env
   .env.local
   ```

2. **Use environment variables**
   - Never hardcode API keys in code
   - Always use `os.getenv()`

3. **Rotate keys regularly**
   - Change Gemini/Google API keys monthly
   - Update in Render dashboard

---

## 📞 Need Help?

**Render Issues:**
- Docs: https://render.com/docs
- Community: https://community.render.com

**NearLink Issues:**
- GitHub Issues: https://github.com/MAhsanOfficial/NearLink/issues

---

## 🚀 Next Steps

1. ✅ Backend deployed
2. Update frontend API URL
3. Deploy frontend (Firebase/Vercel)
4. Test end-to-end
5. Share with users!

**Congratulations! Your backend is live! 🎊**

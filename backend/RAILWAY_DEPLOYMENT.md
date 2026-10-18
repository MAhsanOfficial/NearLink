# 🚂 Railway.app - FREE Deployment Guide (No Card!)

## ✨ Why Railway?
- ✅ **$5 FREE credit every month** (No card required!)
- ✅ Auto-deploys from GitHub
- ✅ Zero cold starts
- ✅ Simple setup (easier than Render)
- ✅ Built-in PostgreSQL option

---

## 🚀 Quick Deployment Steps

### **Step 1: Sign Up**

1. Go to: https://railway.app/
2. Click **"Start a New Project"**
3. Choose **"Login with GitHub"** (easiest)
4. Authorize Railway

**No card required! $5 free credit monthly!** ✅

---

### **Step 2: Create New Project**

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"NearLink"** repository
4. Railway auto-detects it's Python!

---

### **Step 3: Configure Service**

Railway will ask:
```
Root Directory: backend
```

That's it! Railway auto-detects everything else from your code! 🎉

---

### **Step 4: Add Environment Variables**

Click on your service → **"Variables"** tab

Add these:

```bash
DATABASE_URL=postgresql://your_neon_connection
GEMINI_API_KEY=your_key
GOOGLE_PLACES_API_KEY=AIzaSyB_6QmnfHPgqxMXge1un8nwKieKpIU5HWw
SECRET_KEY=any_random_string_here
ALLOWED_ORIGINS=*
PORT=8000
```

---

### **Step 5: Generate Domain**

1. Go to **"Settings"** tab
2. Click **"Generate Domain"**
3. Copy your URL:
   ```
   https://nearlink-backend-production.up.railway.app
   ```

---

### **Step 6: Deploy!**

Railway automatically deploys! Wait 2-3 minutes.

Check logs to confirm success.

---

## ✅ Test Your Deployment

```bash
https://your-app.up.railway.app/health
```

Should return: `{"status":"healthy"}`

---

## 💰 Free Tier Limits

- **$5 credit/month** = ~500 hours of runtime
- No sleep/cold starts
- 512MB RAM
- 1GB disk

**Perfect for hackathon/MVP!** 🎯

---

## 🔄 Auto-Deploy

Every `git push` to main → auto-deploys!

```bash
git add .
git commit -m "Update"
git push origin main
# Railway auto-deploys in 2 mins!
```

---

## 📊 Monitor Usage

Dashboard shows:
- Credit usage
- Memory/CPU
- Request count
- Logs

---

## 🎉 Done!

Your backend is live at:
```
https://your-app.up.railway.app
```

**Easier than Render + No card required!** ✅

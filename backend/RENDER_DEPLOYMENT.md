# 🚀 NearLink Backend - Render.com Deployment Guide

## Prerequisites
- GitHub account with NearLink repository
- Render.com account (free tier available)
- Environment variables ready

---

## 📋 Step-by-Step Deployment

### 1. **Prepare Your Repository**

Ensure these files exist in your `backend/` directory:
- ✅ `render.yaml` (blueprint file - already created)
- ✅ `requirements.txt` (dependencies)
- ✅ `main.py` (FastAPI app)
- ✅ `.env.example` (template for environment variables)

### 2. **Push to GitHub**

```bash
git add backend/render.yaml backend/RENDER_DEPLOYMENT.md
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3. **Deploy on Render (FREE - No Card Required)**

#### Step-by-Step Manual Deployment:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign in with GitHub (recommended)

2. **Create New Web Service**
   - Click **"New +"** button (top right)
   - Select **"Web Service"**

3. **Connect Your Repository**
   - Click **"Connect account"** if first time
   - Authorize Render to access your GitHub
   - Select **"NearLink"** repository
   - Click **"Connect"**

4. **Configure Service Settings**

   Fill in these fields exactly:

   ```
   Name: nearlink-backend
   Region: Oregon (US West) - or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   Instance Type: Free
   ```

5. **Advanced Settings (Optional)**
   - Scroll down to **"Advanced"**
   - Set **Health Check Path**: `/health`
   - Auto-Deploy: **Yes** (deploys on every git push)

6. **Click "Create Web Service"**
   - Render will start building (takes 3-5 minutes)
   - Watch logs in real-time

### 4. **Configure Environment Variables**

In Render Dashboard → Your Service → Environment:

**Required Variables:**

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database

# AI APIs
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Security
SECRET_KEY=auto_generated_by_render
JWT_SECRET_KEY=your_jwt_secret_here
ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=https://nearlink-ai.web.app,https://your-frontend-domain.com

# Optional
ENVIRONMENT=production
```

**How to Add:**
1. Go to service → **Environment** tab
2. Click **"Add Environment Variable"**
3. Paste key-value pairs
4. Click **"Save Changes"**

### 5. **Database Setup (Neon)**

If using Neon PostgreSQL:

1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project: `nearlink-db`
3. Copy connection string
4. Add to Render as `DATABASE_URL`

**Connection String Format:**
```
postgresql://username:password@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 6. **Deploy & Monitor**

1. Render will automatically build and deploy
2. Check logs: Service → **Logs** tab
3. Monitor build progress (takes 2-5 minutes)
4. Once deployed, note your service URL:
   ```
   https://nearlink-backend.onrender.com
   ```

### 7. **Health Check**

Test your deployment:

```bash
# Check health endpoint
curl https://nearlink-backend.onrender.com/health

# Expected response:
{"status": "healthy"}
```

### 8. **Update Frontend API Base URL**

Update your frontend `.env`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://nearlink-backend.onrender.com
```

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Could not find a version that satisfies the requirement"**
- Check Python version in `render.yaml` (should be 3.11)
- Verify `requirements.txt` has no typos

**Solution:**
```bash
# Test locally first
cd backend
pip install -r requirements.txt
```

### App Crashes on Startup

**Error: "ModuleNotFoundError"**
- Missing dependency in `requirements.txt`

**Solution:**
```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update dependencies"
git push
```

### Database Connection Failed

**Error: "could not connect to server"**
- Check `DATABASE_URL` format
- Ensure Neon database is active
- Verify SSL mode: `?sslmode=require`

### Port Binding Issues

**Error: "Address already in use"**
- Render expects app to bind to `$PORT` environment variable
- Verify start command uses `--port $PORT`

### CORS Errors

**Error: "blocked by CORS policy"**
- Add frontend domain to `ALLOWED_ORIGINS`
- Restart service after adding variable

---

## 📊 Render Free Tier Limits

- ✅ 750 hours/month (enough for 1 service running 24/7)
- ✅ Auto-sleep after 15 min inactivity
- ✅ Cold start: ~30 seconds wake-up time
- ✅ Custom domains supported
- ⚠️ No persistent disk (use external database)

**Upgrade to Paid ($7/month) for:**
- Zero downtime
- No cold starts
- More CPU/RAM
- Priority support

---

## 🔄 Continuous Deployment

Render auto-deploys on every push to `main`:

```bash
# Make changes
git add .
git commit -m "Update: feature description"
git push origin main

# Render automatically:
# 1. Detects push
# 2. Builds new image
# 3. Runs tests (if configured)
# 4. Deploys with zero downtime
```

**Disable Auto-Deploy:**
- Service → Settings → Auto-Deploy: Off

---

## 🔐 Security Best Practices

1. **Never commit secrets**
   ```bash
   # .gitignore already includes:
   .env
   .env.local
   *.pem
   *.key
   ```

2. **Rotate API keys regularly**
   - Generate new keys monthly
   - Update in Render environment

3. **Use environment-specific configs**
   ```python
   # main.py
   import os
   
   ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
   
   if ENVIRONMENT == "production":
       DEBUG = False
       ALLOWED_HOSTS = ["nearlink-backend.onrender.com"]
   ```

4. **Enable HTTPS only**
   - Render provides free SSL
   - Force HTTPS in middleware

---

## 📈 Monitoring & Logs

### View Logs
```bash
# Real-time logs in dashboard
Service → Logs → Filter by level (info, error, warning)
```

### Set Up Alerts
```bash
# Render Dashboard → Service → Notifications
- Deploy failures
- Health check failures
- High memory usage
```

### Performance Monitoring

**Free Options:**
- Render built-in metrics (CPU, Memory, Request count)
- UptimeRobot for external monitoring

**Paid Options:**
- Sentry for error tracking
- New Relic for APM
- DataDog for full observability

---

## 🚀 Production Checklist

Before launching:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Health endpoint returns 200
- [ ] CORS configured for frontend domain
- [ ] API keys secured (not in code)
- [ ] Logs show no errors
- [ ] Test all API endpoints
- [ ] Frontend connects successfully
- [ ] SSL certificate active (https://)
- [ ] Rate limiting configured
- [ ] Backup strategy in place

---

## 📞 Support

**Render Issues:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Support: support@render.com

**NearLink Issues:**
- GitHub: https://github.com/MAhsanOfficial/NearLink/issues
- Email: [Your Support Email]

---

## 🎉 Success!

Your backend is now live at:
```
https://nearlink-backend.onrender.com
```

**Next Steps:**
1. Update frontend API URLs
2. Test all features end-to-end
3. Monitor logs for 24 hours
4. Share with beta users
5. Collect feedback and iterate

**Happy Deploying! 🚀**

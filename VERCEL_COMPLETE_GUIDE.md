# ⚡ Vercel Complete Deployment Guide
## Deploy Frontend + Backend (100% FREE!)

---

## 📋 **What You'll Get**

After this guide:
- ✅ Backend: `https://nearlink-backend.vercel.app`
- ✅ Frontend: `https://nearlink.vercel.app`
- ✅ Both connected and working
- ✅ Auto-deploy on git push
- ✅ FREE forever!

---

## 🔧 **PART 1: Backend Deployment**

### **Step 1: Prepare Backend**

Backend files are already ready:
- ✅ `backend/vercel.json` (created)
- ✅ `backend/requirements.txt`
- ✅ `backend/main.py`

### **Step 2: Deploy Backend**

**Option A: Via Website (Easiest)**

1. Go to: https://vercel.com/
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel
4. Click **"Add New..."** → **"Project"**
5. Find **"NearLink"** repository → Click **"Import"**

**Configure Project:**

```
Framework Preset: Other
Root Directory: backend
Build Command: (leave empty)
Output Directory: (leave empty)
Install Command: pip install -r requirements.txt
```

**Environment Variables:**

Click **"Environment Variables"** and add:

```bash
DATABASE_URL
postgresql://your_neon_connection_string

GEMINI_API_KEY
your_gemini_api_key

GOOGLE_PLACES_API_KEY
AIzaSyB_6QmnfHPgqxMXge1un8nwKieKpIU5HWw

SECRET_KEY
any_random_string_123456

ALLOWED_ORIGINS
*

JWT_SECRET_KEY
another_random_string_789

ALGORITHM
HS256
```

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. **Copy your backend URL:**
   ```
   https://nearlink-backend-xyz.vercel.app
   ```

### **Step 3: Test Backend**

Open in browser:
```
https://your-backend-url.vercel.app/health
```

Should show: `{"status":"healthy"}` ✅

---

## 🎨 **PART 2: Frontend Deployment**

### **Step 1: Update Frontend API URL**

Edit `frontend/.env.local` (or create if not exists):

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.vercel.app
```

**Replace with YOUR actual backend URL!**

### **Step 2: Commit Changes**

```bash
cd frontend
git add .env.local
git commit -m "Add Vercel backend URL"
git push origin main
```

### **Step 3: Deploy Frontend**

1. Go back to: https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Select **"NearLink"** again (yes, same repo!)

**Configure Project:**

```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Environment Variables:**

```bash
NEXT_PUBLIC_API_BASE_URL
https://your-backend-url.vercel.app
```

**IMPORTANT:** Replace with your actual backend URL!

4. Click **"Deploy"**
5. Wait 2-3 minutes
6. **Your frontend is live!**
   ```
   https://nearlink.vercel.app
   ```

---

## ✅ **PART 3: Connect Frontend & Backend**

### **Update Backend CORS**

Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables

**Update ALLOWED_ORIGINS:**

```bash
ALLOWED_ORIGINS
https://nearlink.vercel.app,https://nearlink-git-main.vercel.app
```

Add your frontend URL (including preview URLs)

Click **"Save"** → Backend auto-redeploys

---

## 🧪 **PART 4: Test Everything**

### **Test Backend:**
```bash
curl https://your-backend.vercel.app/health
# Should return: {"status":"healthy"}
```

### **Test Frontend:**
1. Open: `https://nearlink.vercel.app`
2. Try signup/login
3. Test service search
4. Check if API calls work

If you see errors, check browser console (F12) for CORS issues.

---

## 🔄 **Auto-Deploy Setup**

Both are now connected to GitHub!

**Every time you push:**

```bash
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds both projects
# 3. Deploys with zero downtime
```

---

## 🎯 **Your Live URLs**

After deployment:

| Service | URL |
|---------|-----|
| **Backend API** | `https://nearlink-backend.vercel.app` |
| **Frontend Web** | `https://nearlink.vercel.app` |
| **API Docs** | `https://nearlink-backend.vercel.app/docs` |

---

## 💰 **Free Tier Limits**

### **Vercel Hobby Plan (FREE Forever):**
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ 100 deployments/day
- ✅ Auto HTTPS
- ✅ Custom domains
- ✅ Edge network (fast globally)

**Perfect for production!** 🎉

---

## 🛠️ **Troubleshooting**

### **❌ Backend Build Failed**

**Error:** "Could not install packages"
- Check `requirements.txt` is valid
- Test locally: `pip install -r requirements.txt`

**Fix:** Remove problematic packages, push again

---

### **❌ Frontend Build Failed**

**Error:** "Module not found"
- Check `package.json` dependencies
- Test locally: `npm install && npm run build`

**Fix:** Add missing dependencies, push again

---

### **❌ CORS Errors**

**Error:** "blocked by CORS policy"

**Fix:**
1. Go to Backend → Settings → Environment Variables
2. Update `ALLOWED_ORIGINS`:
   ```
   https://nearlink.vercel.app,https://nearlink-git-main.vercel.app,*
   ```
3. Save (auto-redeploys)

---

### **❌ API Not Responding**

**Error:** "Failed to fetch"

**Fix:**
1. Check `frontend/.env.local` has correct backend URL
2. Test backend directly: `curl https://backend-url/health`
3. Check Vercel logs for errors

---

### **❌ Environment Variables Not Working**

**Error:** "undefined is not valid"

**Fix:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Make sure all required variables are added
3. Click **"Redeploy"** (top right)

---

## 📊 **Monitor Your Apps**

### **Vercel Dashboard Shows:**
- Deployment status (Building/Ready/Failed)
- Build logs (real-time)
- Analytics (visits, bandwidth)
- Performance metrics

### **View Logs:**
Dashboard → Your Project → Deployments → Click latest → **"View Function Logs"**

---

## 🔐 **Security Best Practices**

### **1. Never Commit Secrets**
```bash
# .gitignore should have:
.env
.env.local
.env.production
```

### **2. Use Environment Variables**
All secrets go in Vercel Dashboard, NOT in code!

### **3. Restrict CORS**
In production, use specific domains:
```bash
ALLOWED_ORIGINS=https://nearlink.vercel.app
```

---

## 🎨 **Custom Domains (Optional)**

### **Add Your Own Domain:**

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Vercel Dashboard → Project → Settings → **Domains**
3. Click **"Add"**
4. Enter domain: `nearlink.com`
5. Follow DNS instructions
6. Wait 24-48 hours for propagation

**Result:** `https://nearlink.com` instead of `vercel.app` ✨

---

## 🚀 **Performance Optimization**

### **Backend:**
- Use connection pooling for database
- Cache frequent queries
- Compress responses

### **Frontend:**
- Enable Next.js Image Optimization
- Use dynamic imports for heavy components
- Enable Vercel Analytics

---

## 📈 **Scaling (When You Grow)**

### **Free Tier is enough for:**
- 10,000+ monthly users
- 100GB traffic
- Hackathon/MVP/Beta

### **Upgrade to Pro ($20/month) when:**
- Need more bandwidth
- Want team collaboration
- Require advanced analytics
- Need password protection

---

## ✅ **Deployment Checklist**

- [ ] Backend deployed on Vercel
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] CORS setup correctly
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] API calls working
- [ ] Signup/Login functional
- [ ] Service search working
- [ ] No console errors

---

## 🎉 **Congratulations!**

Your full-stack app is now live on Vercel! 🚀

**Share your links:**
- Backend: `https://nearlink-backend.vercel.app`
- Frontend: `https://nearlink.vercel.app`

**Next Steps:**
1. Test all features
2. Share with beta users
3. Collect feedback
4. Iterate and improve!

---

## 📞 **Support**

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: support@vercel.com

**NearLink Issues:**
- GitHub: https://github.com/MAhsanOfficial/NearLink/issues

---

**Happy Deploying! 🎊**

*Both frontend and backend are now live, connected, and auto-deploying!*

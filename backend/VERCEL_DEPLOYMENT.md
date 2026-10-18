# ⚡ Vercel - EASIEST FREE Deployment (No Card!)

## ✨ Why Vercel?
- ✅ **100% FREE forever** (Hobby plan)
- ✅ No credit card required
- ✅ Instant deploys (30 seconds!)
- ✅ Auto HTTPS
- ✅ Best for FastAPI

---

## 🚀 Super Quick Deployment

### **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

Or use their website (even easier!):

---

### **Step 2: Create vercel.json**

In your `backend/` folder, create:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

---

### **Step 3: Update main.py for Vercel**

Add this at the bottom of `main.py`:

```python
# For Vercel serverless
app = app  # Export the FastAPI app
```

---

### **Step 4: Deploy via Website**

1. Go to: https://vercel.com/
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Click **"Add New..."** → **"Project"**
4. Select **"NearLink"** repository
5. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
6. Add environment variables (same as before)
7. Click **"Deploy"**

---

### **Step 5: Done!**

Vercel gives you URL:
```
https://nearlink-backend.vercel.app
```

**Total time: 2 minutes!** ⚡

---

## ✅ Test

```bash
https://nearlink-backend.vercel.app/health
```

---

## 💰 Free Forever

- Unlimited bandwidth
- 100GB monthly bandwidth
- Auto-scaling
- No sleep/cold starts

**Best for production!** 🎯

---

## 🔄 Auto-Deploy

Push to GitHub → Auto-deploys!

---

## 🎉 Easiest Option!

Vercel is **THE EASIEST** for Python FastAPI!

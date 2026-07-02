# NearLink - Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Google API Keys (Places, Geocoding)
- Gemini API Key

### Backend Setup

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
```

3. **Activate virtual environment**
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

4. **Install dependencies**
```bash
pip install -r requirements.txt
```

5. **Configure environment variables**
Create `.env` file in backend folder:
```env
DATABASE_URL=your_neon_postgresql_url
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_google_api_key
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

6. **Run database migrations**
```bash
python scripts/migrate_db.py
```

7. **Start backend server**
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: http://localhost:8000

---

### Frontend Setup

1. **Navigate to frontend folder**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env.local` file in frontend folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Clear cache (if needed)**
```bash
# Windows
Remove-Item -Path ".next" -Recurse -Force

# Mac/Linux
rm -rf .next
```

5. **Start development server**
```bash
npm run dev
```

Frontend will run at: http://localhost:3000 (or 3001 if 3000 is busy)

---

## 🌐 Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

2. **Deploy to Vercel**
- Go to vercel.com
- Import your GitHub repository
- Framework: Next.js (auto-detected)
- Root Directory: `frontend`
- Environment Variables:
  ```
  NEXT_PUBLIC_API_URL=your_backend_url
  ```
- Deploy!

3. **Configure custom domain** (optional)
- Add domain in Vercel dashboard
- Update DNS records
- SSL automatically configured

#### Backend on Railway

1. **Create Railway account**
- Go to railway.app
- Sign up with GitHub

2. **New Project**
- Create new project
- Deploy from GitHub repo
- Root Directory: `backend`

3. **Configure Environment Variables**
```env
DATABASE_URL=your_neon_postgresql_url
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_google_api_key
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
PORT=8000
```

4. **Configure Start Command**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. **Deploy**
- Railway auto-deploys on git push
- Get public URL (e.g., https://nearlink-backend.railway.app)
- Update frontend NEXT_PUBLIC_API_URL

---

### Option 2: AWS (Full Stack)

#### Frontend on AWS Amplify

1. **Connect GitHub repo**
- Open AWS Amplify Console
- Connect repository
- Select `frontend` folder

2. **Build settings**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

3. **Environment variables**
```
NEXT_PUBLIC_API_URL=your_backend_url
```

#### Backend on AWS EC2

1. **Launch EC2 instance**
- Ubuntu Server 22.04 LTS
- t2.medium or higher
- Configure security groups (ports 22, 80, 443, 8000)

2. **SSH into instance**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install dependencies**
```bash
sudo apt update
sudo apt install python3-pip nginx -y
```

4. **Clone repository**
```bash
git clone your-repo-url
cd your-repo/backend
```

5. **Install Python packages**
```bash
pip3 install -r requirements.txt
```

6. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

7. **Start with PM2 or systemd**
```bash
# Using systemd
sudo nano /etc/systemd/system/nearlink.service
```

```ini
[Unit]
Description=NearLink Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/your-repo/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nearlink
sudo systemctl start nearlink
```

---

### Option 3: Docker Deployment

#### Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose
Create `docker-compose.yml` at root:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GOOGLE_PLACES_API_KEY=${GOOGLE_PLACES_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    restart: always
```

**Run with Docker Compose:**
```bash
docker-compose up -d
```

---

## 🔧 Configuration Checklist

### Backend Configuration
- [ ] Database URL configured
- [ ] Gemini API key added
- [ ] Google Places API key added
- [ ] JWT secret key set (use strong random string)
- [ ] CORS origins updated for production
- [ ] Database migrations run
- [ ] Test data seeded (optional)

### Frontend Configuration
- [ ] API URL points to production backend
- [ ] Environment variables set
- [ ] Cache cleared before deployment
- [ ] Build tested locally
- [ ] Mobile responsiveness verified

### Database Setup
- [ ] Neon PostgreSQL database created
- [ ] Connection string secured
- [ ] Tables created via migrations
- [ ] Indexes added for performance
- [ ] Backup strategy configured

### API Keys
- [ ] Google Places API enabled
- [ ] Google Geocoding API enabled
- [ ] Gemini API access confirmed
- [ ] Rate limits configured
- [ ] Billing alerts set

---

## 📊 Monitoring & Maintenance

### Application Monitoring
```python
# Add to backend/main.py for basic monitoring

from fastapi import Request
import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"{request.method} {request.url.path} - {process_time:.2f}s")
    return response
```

### Error Tracking
- Set up Sentry for error tracking
- Log errors to file or cloud service
- Monitor API response times
- Track database query performance

### Health Checks
```python
# Already implemented at /
@app.get("/")
async def root():
    return {
        "app": "NearLink",
        "version": "1.0.0",
        "status": "running"
    }
```

### Database Backups
- Configure Neon automated backups
- Test restore procedures
- Keep backups for 30 days minimum

---

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, etc.)
- Rotate API keys regularly
- Use different keys for dev/staging/prod

### API Security
- Rate limiting enabled
- Input validation on all endpoints
- SQL injection prevention (using ORM)
- XSS protection
- CORS properly configured

### Authentication
- JWT tokens with expiration
- Password hashing (bcrypt)
- Secure password requirements
- Account lockout after failed attempts

---

## 📱 Mobile App Deployment (Future)

### Android (Capacitor)
```bash
cd mobile
npm install
npx cap add android
npx cap sync android
npx cap open android
```

### iOS (Capacitor)
```bash
cd mobile
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

### App Store Submission
- Configure app icons and splash screens
- Update app metadata
- Generate signed builds
- Submit for review

---

## 🧪 Testing Before Deployment

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run lint
npm run build
```

### Integration Tests
- Test complete user flows
- Verify API endpoints
- Check database connections
- Validate external API calls

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: Database connection failed**
- Check DATABASE_URL format
- Verify Neon instance is running
- Check firewall/security groups

**Issue: Google API not working**
- Verify API key is correct
- Check API is enabled in Google Cloud Console
- Confirm billing is set up
- Check rate limits

**Issue: Gemini API errors**
- Verify API key
- Check request format
- Monitor rate limits
- Review error logs

**Issue: Frontend can't connect to backend**
- Verify NEXT_PUBLIC_API_URL
- Check CORS configuration
- Ensure backend is running
- Test with curl/Postman

---

## 🎯 Performance Optimization

### Backend
- Enable database connection pooling
- Add Redis for caching
- Implement request queuing
- Optimize database queries

### Frontend
- Image optimization
- Code splitting
- Lazy loading
- CDN for static assets

### Database
- Add indexes on frequently queried columns
- Optimize slow queries
- Regular VACUUM and ANALYZE
- Monitor connection pool

---

**Deployment Status**: Ready for Production 🚀

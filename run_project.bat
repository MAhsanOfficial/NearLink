@echo off
TITLE NearLink - Full Stack Runner
echo ========================================
echo 🚀 NearLink: AI Service Orchestrator
echo ========================================

:: Start Backend
echo 📦 Starting FastAPI Backend...
start "NearLink Backend" cmd /k "cd backend && (if exist venv\Scripts\activate (call venv\Scripts\activate) else (echo ⚠️ No virtual env found, running with system python)) && python main.py || pause"

:: Start Frontend
echo 🎨 Starting Next.js Frontend...
start "NearLink Frontend" cmd /k "cd frontend && npm run dev || pause"

echo.
echo ✅ Servers are spinning up in separate windows.
echo 📍 Backend: http://localhost:8000
echo 📍 Frontend: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause > nul

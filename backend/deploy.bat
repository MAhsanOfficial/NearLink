@echo off
REM NearLink Backend - Render Deployment Script (Windows)
REM Run this before pushing to GitHub for Render deployment

echo.
echo 🚀 NearLink Backend - Pre-Deployment Checks
echo ===========================================
echo.

REM Check if we're in backend directory
if not exist "main.py" (
    echo ❌ Error: Please run this script from the backend\ directory
    exit /b 1
)

echo ✅ In correct directory

REM Check if render.yaml exists
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found
    exit /b 1
)

echo ✅ render.yaml found

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo ❌ Error: requirements.txt not found
    exit /b 1
)

echo ✅ requirements.txt found

REM Check Python version
echo.
python --version
echo.

REM Check for .env file
if exist ".env" (
    echo ⚠️  Warning: .env file found (should not be committed^)
    echo    Make sure .env is in .gitignore
)

REM Check if .env.example exists
if exist ".env.example" (
    echo ✅ .env.example found (good for documentation^)
) else (
    echo ⚠️  Warning: .env.example not found
)

echo.
echo ===========================================
echo ✨ Pre-deployment checks complete!
echo.
echo 📋 Next steps:
echo 1. Commit: git add . && git commit -m "Ready for deployment"
echo 2. Push: git push origin main
echo 3. Go to: https://dashboard.render.com
echo 4. Create New Web Service or use Blueprint
echo 5. Add environment variables (see RENDER_DEPLOYMENT.md)
echo.
echo 🎉 Good luck with deployment!
echo.
pause

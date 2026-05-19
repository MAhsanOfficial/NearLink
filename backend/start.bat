@echo off
echo ========================================
echo   QuickFix AI Backend Startup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo.

REM Start the server
echo ========================================
echo   Starting Backend Server...
echo ========================================
echo.
echo Server will run on: http://localhost:8000
echo API Docs available at: http://localhost:8000/docs
echo CORS enabled for: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

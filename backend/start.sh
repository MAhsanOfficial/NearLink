#!/bin/bash

echo "========================================"
echo "  QuickFix AI Backend Startup"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
echo ""

# Start the server
echo "========================================"
echo "  Starting Backend Server..."
echo "========================================"
echo ""
echo "Server will run on: http://localhost:8000"
echo "API Docs available at: http://localhost:8000/docs"
echo "CORS enabled for: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py

"""
Vercel Serverless Function Entry Point for NearLink Backend
"""
import os
import sys
from pathlib import Path

# Configure paths FIRST
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Set environment BEFORE any imports
os.environ["VERCEL"] = "1"

# Now import the FastAPI app
from main import app

# Export for Vercel
handler = app

#!/bin/bash

# NearLink Backend - Render Deployment Script
# Run this before pushing to GitHub for Render deployment

echo "🚀 NearLink Backend - Pre-Deployment Checks"
echo "==========================================="

# Check if we're in backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the backend/ directory"
    exit 1
fi

echo "✅ In correct directory"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found"
    exit 1
fi

echo "✅ render.yaml found"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    exit 1
fi

echo "✅ requirements.txt found"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1)
echo "📦 Python version: $PYTHON_VERSION"

# Test requirements installation
echo ""
echo "🔍 Testing requirements installation..."
python -m pip install --dry-run -r requirements.txt > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ All dependencies are installable"
else
    echo "⚠️  Warning: Some dependencies may have issues"
    echo "   Run manually: pip install -r requirements.txt"
fi

# Check for .env file
if [ -f ".env" ]; then
    echo "⚠️  Warning: .env file found (should not be committed)"
    echo "   Make sure .env is in .gitignore"
fi

# Check if .env.example exists
if [ -f ".env.example" ]; then
    echo "✅ .env.example found (good for documentation)"
else
    echo "⚠️  Warning: .env.example not found"
fi

echo ""
echo "==========================================="
echo "✨ Pre-deployment checks complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Ready for deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. Go to Render Dashboard: https://dashboard.render.com"
echo "4. Create New Web Service or use Blueprint"
echo "5. Add environment variables (see RENDER_DEPLOYMENT.md)"
echo ""
echo "🎉 Good luck with deployment!"

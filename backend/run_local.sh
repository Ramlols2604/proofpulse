#!/bin/bash

# ProofPulse Local Development Runner
# No Docker Required!

echo "🚀 Starting ProofPulse Backend..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env - please add your API keys"
    echo ""
fi

# Check if dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip3 install -r requirements.txt
    echo ""
fi

# Create uploads directory
mkdir -p uploads

echo "✅ Environment ready!"
echo "📡 Starting FastAPI with uvicorn..."
echo "🌐 Backend will run on: http://localhost:8000"
echo "📚 API docs available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run uvicorn
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

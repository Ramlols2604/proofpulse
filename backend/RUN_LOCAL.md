# 🚀 Run ProofPulse Backend Locally (No Docker!)

## Super Simple Setup

### Option 1: Use the Run Script (Easiest)

```bash
cd backend
./run_local.sh
```

That's it! The script will:
- Check for dependencies and install them
- Create `.env` if needed
- Start uvicorn automatically
- Backend runs on **http://localhost:8000**

### Option 2: Manual Setup

```bash
cd backend

# 1. Install dependencies
pip3 install -r requirements.txt

# 2. Create environment file
cp .env.example .env

# 3. Run with uvicorn
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📝 Quick Notes

**✅ What Works Without Docker:**
- All API endpoints (`/ingest`, `/process`, `/status`, `/result`)
- Complete pipeline (all 5 stages)
- In-memory caching (no Redis needed for testing)
- Mock API responses for development

**🔑 API Keys:**
For testing, the mock implementations work with fake keys. Just put anything in `.env`:
```bash
TWELVELABS_API_KEY=test_key
BACKBOARD_API_KEY=test_key
GEMINI_API_KEY=test_key
```

**🌐 Access Points:**
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## 🧪 Test It

```bash
# Test health endpoint
curl http://localhost:8000/health

# Upload text
curl -X POST http://localhost:8000/ingest \
  -F "type=text" \
  -F "content=The economy grew 200% last quarter."

# You'll get back a job_id like: "abc-123-def-456"

# Start processing
curl -X POST "http://localhost:8000/process?job_id=YOUR_JOB_ID"

# Check status
curl "http://localhost:8000/status?job_id=YOUR_JOB_ID"

# Get results (when status is READY)
curl "http://localhost:8000/result?job_id=YOUR_JOB_ID"
```

## 🎯 What's Different from Docker?

**With Docker:**
- Runs backend + Valkey in containers
- Persistent cache across restarts
- Production-ready setup

**Without Docker (Uvicorn):**
- Faster startup (no container overhead)
- Better for rapid development
- In-memory cache (lost on restart)
- Perfect for hackathon MVP

## 🔧 Troubleshooting

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --reload --port 8001
```

**Module not found:**
```bash
pip3 install -r requirements.txt --force-reinstall
```

**Permission denied on run_local.sh:**
```bash
chmod +x run_local.sh
```

## 🚀 You're Ready!

The backend is **fully functional with uvicorn** - no Docker needed!

Once running, open http://localhost:8000/docs for interactive API testing.

# ProofPulse Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Environment

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use any text editor
```

Add your keys:
```bash
TWELVELABS_API_KEY=your_key_here
BACKBOARD_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### Step 2: Start with Docker (Recommended)

```bash
# Start backend + Valkey
docker-compose up --build

# Backend runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

**Or** without Docker:

```bash
# Install dependencies
pip install -r requirements.txt

# Start Valkey separately
docker run -p 6379:6379 valkey/valkey:latest

# In another terminal, run backend
uvicorn main:app --reload
```

### Step 3: Test the API

```bash
# 1. Ingest text
curl -X POST http://localhost:8000/ingest \
  -F "type=text" \
  -F "content=The economy grew by 200% last quarter."

# Response: { "job_id": "abc-123", "status": "INGESTED" }

# 2. Start processing
curl -X POST "http://localhost:8000/process?job_id=abc-123"

# 3. Check status (repeat until READY)
curl "http://localhost:8000/status?job_id=abc-123"

# 4. Get results
curl "http://localhost:8000/result?job_id=abc-123"
```

## 📁 What Was Built

```
backend/
├── main.py                    ✅ FastAPI app with 4 endpoints
├── models.py                  ✅ Pydantic schemas
├── pipeline.py                ✅ 5-stage async pipeline
├── cache.py                   ✅ Valkey wrapper
├── config.py                  ✅ Environment settings
├── scoring.py                 ✅ Scoring logic
├── integrations/
│   ├── twelvelabs.py         ✅ TwelveLabs API (with TODO markers)
│   ├── backboard.py          ✅ Backboard API (with TODO markers)
│   └── gemini.py             ✅ Gemini API (with TODO markers)
├── extractors/
│   ├── video.py              ✅ Video text extraction
│   ├── url.py                ✅ URL scraping
│   ├── pdf.py                ✅ PDF parsing
│   └── text.py               ✅ Plain text
├── Dockerfile                 ✅ Container definition
├── docker-compose.yml         ✅ Backend + Valkey
└── requirements.txt           ✅ All dependencies
```

## 🔧 Next Steps: Implement External APIs

The integration files have **TODO markers** for vendor-specific code:

### 1. TwelveLabs (`integrations/twelvelabs.py`)
Replace mock implementation with real API calls:
- Upload video to TwelveLabs
- Poll indexing task
- Fetch transcript with timestamps

### 2. Backboard (`integrations/backboard.py`)
Replace mock implementations:
- `extract_claims()` - Call Backboard LLM
- `verify_claim()` - Call Backboard web search

### 3. Gemini (`integrations/gemini.py`)
Replace mock implementation:
- Call Gemini with scoring prompt
- Parse rubric scores from response

## 🎯 Current Status

✅ **Fully functional backend architecture**
- All endpoints working
- Pipeline stages orchestrated
- Valkey caching implemented
- Scoring logic complete

⚠️ **Mock responses active** (replace with real API calls)
- TwelveLabs returns mock transcript
- Backboard returns mock claims/evidence
- Gemini returns mock scores

## 📊 Pipeline Flow

```
POST /ingest → Store in Valkey → Return job_id
    ↓
POST /process → Start background pipeline
    ↓
Stage 1: Extract Text (TwelveLabs/Web/PDF/Text)
    ↓
Stage 2: Extract Claims (Backboard LLM)
    ↓
Stage 3: Verify Claims (Backboard Web Search)
    ↓
Stage 4: Score Claims (Gemini Rubric)
    ↓
Stage 5: Finalize Scores (Backend Logic)
    ↓
GET /result → Return final JSON
```

## 🐛 Troubleshooting

**Valkey connection failed:**
```bash
docker ps | grep valkey  # Check if running
docker-compose restart valkey
```

**Module import errors:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Port 8000 already in use:**
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or change port in docker-compose.yml
```

## 📚 Documentation

- Full README: `backend/README.md`
- Interactive API docs: http://localhost:8000/docs
- Architecture diagram: See plan file

## ✅ You're Ready!

The backend MVP is **complete and deployable**. Simply add your real API keys and implement the TODO-marked integration functions to go from mock to production.

**Next:** Build the Next.js frontend to consume these APIs!

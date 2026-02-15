# ProofPulse Backend

Real-time claim verification API backend using FastAPI, TwelveLabs, Backboard, Gemini, and Valkey.

## Architecture

The backend implements a **5-stage asynchronous pipeline**:

1. **EXTRACTING_TEXT** - Extract text from video/url/pdf/txt
2. **CLAIM_EXTRACTION** - Identify 3-5 verifiable claims (Backboard LLM)
3. **EVIDENCE_RETRIEVAL** - Verify each claim with sources (Backboard Web Search)
4. **GEMINI_REVIEW** - Generate rubric scores (Gemini API)
5. **SCORING** - Apply multiplier and verdict mapping (Backend logic)

### Key Principles

- **API Keys** - All external API keys live in backend only
- **Frontend Security** - Frontend never calls TwelveLabs, Backboard, or Gemini directly
- **Valkey Caching** - Every pipeline stage reads from and writes to cache
- **Scoring** - Gemini generates rubric scores, backend applies deterministic rules

## Setup

### Prerequisites

- Python 3.11+
- Docker and Docker Compose (recommended)
- Or: Valkey/Redis running locally

### Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required variables:

```bash
TWELVELABS_API_KEY=your_twelvelabs_api_key_here
BACKBOARD_API_KEY=your_backboard_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
VALKEY_URL=redis://localhost:6379
```

### Option 1: Docker (Recommended)

```bash
# Start backend + Valkey
docker-compose up --build

# Backend runs on http://localhost:8000
# Valkey runs on localhost:6379
```

### Option 2: Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start Valkey/Redis separately
docker run -p 6379:6379 valkey/valkey:latest

# Run FastAPI
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST /ingest

Upload input data.

**Request:**
```bash
curl -X POST http://localhost:8000/ingest \
  -F "type=text" \
  -F "content=Your text content here"
```

Or for file upload:
```bash
curl -X POST http://localhost:8000/ingest \
  -F "type=video" \
  -F "file=@video.mp4"
```

**Response:**
```json
{
  "job_id": "abc-123-def-456",
  "status": "INGESTED",
  "message": "Job created successfully"
}
```

### POST /process

Start processing pipeline.

**Request:**
```bash
curl -X POST "http://localhost:8000/process?job_id=abc-123-def-456"
```

**Response:**
```json
{
  "job_id": "abc-123-def-456",
  "status": "PROCESSING",
  "message": "Pipeline started"
}
```

### GET /status

Check job status.

**Request:**
```bash
curl "http://localhost:8000/status?job_id=abc-123-def-456"
```

**Response:**
```json
{
  "job_id": "abc-123-def-456",
  "status": "GEMINI_READY",
  "message": "Gemini scored 3 claims"
}
```

**Status Progression:**
```
INGESTED → PROCESSING → TEXT_READY → CLAIMS_READY → 
EVIDENCE_READY → GEMINI_READY → READY (or FAILED)
```

### GET /result

Get final results (when status is READY).

**Request:**
```bash
curl "http://localhost:8000/result?job_id=abc-123-def-456"
```

**Response:**
```json
{
  "job_id": "abc-123-def-456",
  "input_type": "text",
  "timestamps": null,
  "claims": [
    {
      "claim_id": "uuid",
      "claim_text": "Crime increased 200% last year",
      "start_time": null,
      "end_time": null,
      "claim_type": "statistical",
      "final_verdict": "CONTRADICTED",
      "fact_score": 88,
      "breakdown": {
        "evidence_strength": 28,
        "evidence_agreement": 25,
        "context_accuracy": 18,
        "model_confidence_points": 17,
        "base_points": 88,
        "agreement_multiplier": 1.0,
        "final_score": 88
      },
      "explanation": "Claim states 200% but FBI data shows 3% increase",
      "sources": [
        {
          "title": "FBI Crime Statistics 2024",
          "publisher": "FBI.gov",
          "date": "2024-01-15",
          "url": "https://fbi.gov/stats",
          "snippet": "Crime increased 3% nationally..."
        }
      ]
    }
  ],
  "processing_time": null,
  "created_at": "2024-02-14T12:00:00"
}
```

## Project Structure

```
backend/
├── main.py                    # FastAPI app, endpoints
├── models.py                  # Pydantic schemas
├── pipeline.py                # Pipeline orchestration
├── cache.py                   # Valkey client wrapper
├── config.py                  # Environment configuration
├── scoring.py                 # Scoring logic
├── integrations/
│   ├── twelvelabs.py         # TwelveLabs API (TODO markers)
│   ├── backboard.py          # Backboard API (TODO markers)
│   └── gemini.py             # Gemini API (TODO markers)
├── extractors/
│   ├── video.py              # Video text extraction
│   ├── url.py                # URL content extraction
│   ├── pdf.py                # PDF text extraction
│   └── text.py               # Plain text handler
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Caching Strategy

All data is cached in Valkey with 1-hour TTL:

| Key | Content |
|-----|---------|
| `job:{id}:raw` | Raw input pointer (file path or content) |
| `job:{id}:status` | Current pipeline stage |
| `job:{id}:text` | Normalized text |
| `job:{id}:timestamps` | Timestamp array (for videos) |
| `job:{id}:claims` | Extracted claims |
| `job:{id}:evidence:{claim_id}` | Backboard evidence per claim |
| `job:{id}:gemini:{claim_id}` | Gemini scores per claim |
| `job:{id}:final_result` | Final output JSON |

## Implementing External APIs

The integration files contain **TODO markers** for vendor-specific implementation:

### TwelveLabs (`integrations/twelvelabs.py`)
```python
async def upload_and_transcribe(video_path: str) -> dict:
    """
    TODO: Implement actual TwelveLabs API calls
    - Upload video
    - Create indexing task
    - Poll until ready
    - Fetch transcript with timestamps
    """
```

### Backboard (`integrations/backboard.py`)
```python
async def extract_claims(text: str) -> List[Dict]:
    """
    TODO: Implement Backboard LLM call for claim extraction
    """

async def verify_claim(claim_text: str) -> Dict:
    """
    TODO: Implement Backboard web search for evidence
    """
```

### Gemini (`integrations/gemini.py`)
```python
async def review_and_score_claim(...) -> Dict:
    """
    TODO: Implement Gemini API call with scoring prompt
    - Send claim + evidence
    - Get rubric scores back
    """
```

## Scoring Rubric

### Gemini Generates (Stage 4):
- **Evidence Strength** (0-30): Source quality
- **Evidence Agreement** (0-30): How well sources align
- **Context Accuracy** (0-20): Claim matches context
- **Model Confidence Points** (0-20): Combined confidence score

### Backend Applies (Stage 5):
1. Validate score ranges
2. Calculate agreement multiplier:
   - Both verdicts agree: **1.0**
   - One unclear: **0.85**
   - Contradict each other: **0.70**
3. Final score = `base_points × multiplier`
4. Map to verdict:
   - 80-100: SUPPORTED
   - 60-79: MOSTLY_SUPPORTED
   - 40-59: UNCLEAR
   - 20-39: MOSTLY_CONTRADICTED
   - 0-19: CONTRADICTED

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Test full pipeline with text
curl -X POST http://localhost:8000/ingest \
  -F "type=text" \
  -F "content=The economy grew by 5% last quarter according to official reports."

# Use returned job_id to process
curl -X POST "http://localhost:8000/process?job_id=YOUR_JOB_ID"

# Poll status
curl "http://localhost:8000/status?job_id=YOUR_JOB_ID"

# Get result when READY
curl "http://localhost:8000/result?job_id=YOUR_JOB_ID"
```

## Interactive API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### Valkey Connection Error
```bash
# Check Valkey is running
docker ps | grep valkey

# Or start standalone Valkey
docker run -p 6379:6379 valkey/valkey:latest
```

### API Key Errors
Check `.env` file has all three API keys set correctly.

### File Upload Issues
Ensure `uploads/` directory exists and has write permissions:
```bash
mkdir -p uploads
chmod 755 uploads
```

## License

MIT

# ProofPulse Architecture

## High-Level Flow

```
User uploads video
      ↓
TwelveLabs API
  - Extract transcript with timestamps
  - Generate video embeddings
      ↓
Backboard LLM
  - Identify 3-5 factual claims
  - Extract timestamps for each claim
      ↓
Backboard Web Retrieval
  - Verify each claim
  - Fetch supporting/contradicting evidence
  - Calculate confidence score
      ↓
Valkey Cache
  - Store analysis results
  - Cache embeddings
  - Enable instant reruns
      ↓
Frontend Display
  - Video player with timeline
  - Highlighted claims (clickable)
  - Evidence panel with sources
  - Credibility scores
```

## API Endpoints

### Backend (FastAPI)

**POST /upload**
- Accept video file
- Generate unique video_id
- Initiate TwelveLabs indexing
- Return video_id

**GET /analyze?video_id={id}**
- Check Valkey cache first
- If not cached:
  - Poll TwelveLabs for transcript
  - Call Backboard for claim extraction
  - Call Backboard for verification
  - Store in Valkey
- Return complete analysis JSON

**GET /result?video_id={id}**
- Fetch cached results from Valkey
- Return instantly

## Data Models

### Claim Object
```json
{
  "claim_text": "Crime increased 200% in the last year",
  "start_time": 47.2,
  "end_time": 50.1,
  "claim_type": "statistical",
  "verdict": "contradicted",
  "confidence": 85,
  "sources": [
    {
      "title": "FBI Crime Statistics 2024",
      "publisher": "FBI.gov",
      "url": "https://...",
      "excerpt": "Crime increased 3% nationally..."
    }
  ],
  "reasoning": "Claim states 200% but official FBI data shows 3% increase"
}
```

### Analysis Result
```json
{
  "video_id": "abc123",
  "duration": 120.5,
  "transcript": "Full transcript text...",
  "claims": [
    {/* claim object */}
  ],
  "processing_time": 8.3,
  "cached": false
}
```

## Tech Integration Points

### TwelveLabs Integration
- API: Video indexing and understanding
- Input: Video file
- Output: Transcript + timestamps + embeddings
- Latency: 5-15 seconds for 2-minute video

### Backboard Integration
- API: LLM + web search + retrieval
- Use case 1: Claim extraction (structured JSON output)
- Use case 2: Fact verification (web search + synthesis)
- Latency: 2-5 seconds per claim

### Valkey Integration
- Key structure:
  - `video:{video_id}:transcript`
  - `video:{video_id}:claims`
  - `video:{video_id}:analysis`
  - `embeddings:{video_id}`
- TTL: 1 hour (hackathon demo scope)
- Benefit: Instant reruns for demo reliability

## MVP Scope Limits

✅ Included:
- Videos: 30-120 seconds
- Claims: Maximum 5 per video
- Verdicts: Supported, Contradicted, Unclear
- Sources: 2-3 per claim

❌ Excluded (post-hackathon):
- Narrative similarity across videos
- Advanced visual reasoning beyond transcript
- Multi-language support
- User accounts and history

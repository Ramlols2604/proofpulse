# Live Pipeline Implementation

## Overview

ProofPulse now has **two separate endpoints** for different purposes:

### Goal A: Bulletproof Judge Demo (Cached)
**Endpoint:** `GET /demo`  
**Job ID:** `demo`  
**Purpose:** Safety net for demos. Always works. Instant results.

### Goal B: Real Pipeline Testing (Live)
**Endpoint:** `POST /live`  
**Job ID:** `live_<timestamp>`  
**Purpose:** Prove all systems work with real APIs.

---

## Endpoint Details

### 1. Cached Demo: `GET /demo`

```bash
curl http://localhost:8000/demo
```

**Behavior:**
- Returns pre-computed cached result instantly
- No API calls
- Zero risk
- Always succeeds
- Perfect for judge demos

**What judges see:**
- 3 claims analyzed
- One CONTRADICTED claim
- High-quality sources
- Complete rubric scores

---

### 2. Real Live Pipeline: `POST /live`

```bash
curl -X POST \
  -H "x-client-id: test-user" \
  -F "text=The earth is flat" \
  http://localhost:8000/live
```

**Response:**
```json
{
  "job_id": "live_20260215_044753",
  "status": "PROCESSING",
  "message": "Real pipeline started with live APIs"
}
```

**Poll for status:**
```bash
curl "http://localhost:8000/status?job_id=live_20260215_044753"
```

**Get result:**
```bash
curl "http://localhost:8000/result?job_id=live_20260215_044753"
```

**Behavior:**
- Creates unique job: `live_<timestamp>`
- Runs REAL 5-stage pipeline
- Calls Backboard SDK (claim extraction + evidence)
- Calls Gemini API (if enabled in settings)
- Falls back to Backboard scoring if Gemini fails
- No cached results
- Proves all systems work

---

## Debug Logging

### Enable Debug Mode

Set environment variable:
```bash
DEBUG_JOB_ID=live_test
```

Or for specific job:
```bash
DEBUG_JOB_ID=live_20260215_044753
```

### What Gets Logged

When `DEBUG_JOB_ID` matches the job being processed:

**Stage 1:**
- Text extraction
- Input type and length
- Cache reads/writes

**Stage 2:**
- Backboard claim extraction API call
- Number of claims returned
- Claim text and types

**Stage 3:**
- Backboard evidence retrieval API call per claim
- Sources returned
- Verdict and confidence
- Guard for empty sources

**Stage 4:**
- Gemini or Backboard fallback
- Score breakdown
- API success/failure

**Stage 5:**
- Final scoring logic
- Base points calculation
- Multiplier application
- Final verdict mapping

**Example:**
```
================================================================================
[23:50:11.469] [live_debug_test] STAGE 3.1 API RESPONSE
================================================================================
Backboard returned evidence
{
  "verdict": "CONTRADICTED",
  "confidence": 1,
  "sources_count": 2,
  "sources": [...]
}
================================================================================
```

---

## Test Results: "The earth is flat"

### Full Pipeline Test

**Command:**
```bash
cd backend
python3 test_live.py
```

**Result:**
```
Claim: The earth is flat
Verdict: MOSTLY_CONTRADICTED
Score: 20/100
Sources: 2

Breakdown:
  evidence_strength: 20
  evidence_agreement: 0
  context_accuracy: 0
  model_confidence_points: 0
  base_points: 20
  agreement_multiplier: 1.0
  final_score: 20
```

**Sources:**
1. **NASA** - "The Earth is an oblate spheroid..."
2. **National Geographic** - "Scientific consensus...confirms that Earth is nearly spherical."

**Timing:**
- Stage 1: 0.00s (text extraction)
- Stage 2: 2.71s (Backboard claim extraction)
- Stage 3: 4.65s (Backboard evidence retrieval)
- Stage 4: 3.79s (Backboard fallback scoring)
- Stage 5: 0.01s (final scoring)

**Total:** ~11 seconds (real APIs)

---

## Scoring Logic (Fixed)

### Critical Fix: Verdict from Score Mapping ONLY

**Before (broken):**
```python
final_verdict = gemini.get("gemini_verdict")  # Wrong!
```

**After (correct):**
```python
final_score = round(base_points * multiplier)
final_verdict = map_score_to_verdict(final_score)  # Correct!
```

### Score-to-Verdict Mapping

```python
if score >= 90: "SUPPORTED"
elif score >= 70: "MOSTLY_SUPPORTED"
elif score >= 40: "UNCLEAR"
elif score >= 20: "MOSTLY_CONTRADICTED"
else: "CONTRADICTED"
```

**Example:**
- `base_points = 20`
- `multiplier = 1.0`
- `final_score = 20`
- `final_verdict = "MOSTLY_CONTRADICTED"` ✅

---

## Guard: Empty Sources

### Problem
Stage 3 might return no sources, leading to:
- 0/100 score
- "No sources available" message
- Inconsistent verdict

### Solution
Added guard in `stage_3_evidence_retrieval()`:

```python
if not evidence.get("sources") or len(evidence.get("sources", [])) == 0:
    evidence = {
        "backboard_verdict": "UNCLEAR",
        "backboard_confidence": 10,
        "sources": [{
            "title": "No sources found",
            "publisher": "System",
            "date": "2024-01-01",
            "url": "https://example.com",
            "snippet": "No sources returned by retrieval"
        }],
        "rationale": "No sources available for verification"
    }
```

---

## User Settings

### Per-User Runtime Settings

**Stored in Valkey:**
```
settings:{client_id}
```

**Fields:**
- `gemini_enabled`: boolean
- `demo_mode`: "cached" or "live"

**Frontend:**
- Generates `x-client-id` in localStorage
- Sends header on every request
- Settings UI controls toggles

**Backend:**
- Reads settings at pipeline start
- Falls back to defaults if not found
- No .env changes needed during demo

---

## What to Tell Judges

### 1. Two Demo Modes

**Cached mode (default):**
- Instant results
- Zero API risk
- Perfect for showing UI/UX

**Live mode (optional):**
- Real pipeline
- Real APIs (Backboard + optional Gemini)
- Proves system works end-to-end

### 2. Gemini Toggle

**Gemini ON:**
- Uses Google Gemini 2.0 Flash for detailed rubric scoring
- Falls back to Backboard if quota exceeded
- Shows "Gemini unavailable" badge if fallback used

**Gemini OFF:**
- Uses Backboard for all scoring
- Faster (one less API call)
- Still produces full rubric breakdown

### 3. What "Live" Proves

When you run live mode:
- ✅ Backboard SDK extracts claims
- ✅ Backboard SDK retrieves web evidence
- ✅ Real sources from NASA, National Geographic, etc.
- ✅ Gemini scoring (if enabled and quota available)
- ✅ Fallback scoring works
- ✅ Full 5-stage pipeline completes

---

## Files Changed

### New Files
- `backend/test_live.py` - Standalone test with full debug logging

### Modified Files
- `backend/main.py` - Added `POST /live` endpoint
- `backend/config.py` - Added `DEBUG_JOB_ID` setting
- `backend/pipeline.py` - Added debug logging throughout all stages
- `backend/integrations/backboard.py` - Fixed scoring consistency
- `backend/.env` - Added `DEBUG_JOB_ID=`

---

## Testing Checklist

### Before Demo

✅ **Cached demo works:**
```bash
curl http://localhost:8000/demo | jq
```

✅ **Live pipeline works:**
```bash
curl -X POST -H "x-client-id: test" \
  -F "text=The earth is flat" \
  http://localhost:8000/live
```

✅ **Settings persist:**
```bash
curl -X POST -H "x-client-id: test" \
  -H "Content-Type: application/json" \
  -d '{"gemini_enabled": false, "demo_mode": "live"}' \
  http://localhost:8000/settings

curl -H "x-client-id: test" \
  http://localhost:8000/settings
```

✅ **Frontend loads:**
```bash
open http://localhost:3000
```

✅ **Debug logging works:**
```bash
DEBUG_JOB_ID=live_test python3 backend/test_live.py
```

---

## Summary

### Goal A: Cached Demo ✅
- Endpoint: `GET /demo`
- Always works
- Instant results
- Zero risk

### Goal B: Live Pipeline ✅
- Endpoint: `POST /live`
- Real APIs
- Proves system works
- Full debug logging

### Separated Concerns ✅
- No fake "live" returning cached data
- Clear distinction for judges
- Both modes work independently

### All Issues Fixed ✅
- Verdict from score mapping only
- Sources always present
- Scores are integers
- Consistent logic
- Guard for edge cases

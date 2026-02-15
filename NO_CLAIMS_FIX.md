# Fix: Graceful Handling of "No Claims Extracted"

## Issue
The pipeline was failing with `ValueError: No claims extracted` when Backboard couldn't extract any factual claims from the input text.

## Root Cause
The code was too strict - it raised an error when Backboard returned an empty claims array, causing the entire pipeline to fail.

## Why This Happens
Backboard might legitimately return zero claims when:
- Input text is too short or vague
- Content is primarily opinion-based (e.g., "I think...")
- Input contains only questions
- No verifiable factual statements present

## Solution

### Backend Changes

#### 1. Graceful Early Return in `stage_2_claim_extraction()`
**File:** `backend/pipeline.py`

```python
# Handle empty claims gracefully
if not claims_raw or len(claims_raw) == 0:
    debug_log(job_id, "STAGE 2 NO CLAIMS", "⚠️ No claims extracted from text")
    # Create empty claims list and skip to finalization
    cache.set_job_data(job_id, "claims", [])
    cache.set_job_data(job_id, "evidence", {})
    cache.set_job_data(job_id, "gemini_report", {})
    
    # Create empty final result
    data = cache.get_multiple(job_id, ["type", "created_at", "timestamps"])
    final_result = {
        "job_id": job_id,
        "input_type": data.get("type"),
        "timestamps": data.get("timestamps", []),
        "claims": [],
        "processing_time": None,
        "created_at": data.get("created_at")
    }
    cache.set_job_data(job_id, "final_result", final_result)
    cache.set_job_status(job_id, "READY", "No factual claims found in input")
    return
```

**What it does:**
- Sets job status to "READY" (not "FAILED")
- Creates empty result with 0 claims
- Returns early from stage 2
- Skips stages 3-5 (no need to retrieve evidence, etc.)

#### 2. Skip Later Stages in `process_pipeline()`
**File:** `backend/pipeline.py`

```python
await stage_2_claim_extraction(job_id)

# Check if stage 2 completed early (no claims found)
status_data = cache.get_job_status(job_id)
if status_data.get("status") == "READY":
    print(f"[{job_id}] Pipeline completed early - no claims to process")
    return

# Only run stages 3-5 if claims were found
await stage_3_evidence_retrieval(job_id)
await stage_4_gemini_review(job_id)
await stage_5_finalize_scoring(job_id)
```

**What it does:**
- Checks if job is already "READY" after stage 2
- If yes, returns early without running stages 3-5
- Avoids unnecessary API calls

### Frontend Changes

#### User-Friendly Message in `ResultsView.tsx`
**File:** `frontend/components/ResultsView.tsx`

```tsx
{/* No Claims Message */}
{results.claims.length === 0 && (
  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
    <div className="text-5xl mb-4">🔍</div>
    <h4 className="text-xl font-semibold text-blue-900 mb-2">
      No Factual Claims Found
    </h4>
    <p className="text-blue-700 max-w-md mx-auto">
      The input doesn't appear to contain verifiable factual claims...
    </p>
  </div>
)}
```

**What it does:**
- Shows helpful message when `claims.length === 0`
- Explains why this might happen
- Suggests what to try instead
- Much better UX than a generic error

## Result

### Before (Broken)
```
ERROR: ValueError: No claims extracted
Pipeline failed
Status: FAILED
```

### After (Fixed)
```
Status: READY
Message: "No factual claims found in input"
Claims: []

Frontend shows:
🔍 No Factual Claims Found
[Helpful explanation and suggestions]
```

## Testing

### Test Case 1: Very Short Text
**Input:** "Hello world"  
**Expected:** Completes with 0 claims, shows friendly message

### Test Case 2: Opinion Text
**Input:** "I think the sky is beautiful"  
**Expected:** Completes with 0 claims (no factual claim to verify)

### Test Case 3: Question
**Input:** "What is the capital of France?"  
**Expected:** Completes with 0 claims (question, not statement)

### Test Case 4: Valid Claim
**Input:** "The earth is flat"  
**Expected:** Extracts 1 claim, processes normally

## Impact

### Positive
✅ No more pipeline crashes  
✅ Better user experience  
✅ Saves API calls (skips stages 3-5)  
✅ Clear feedback to user  
✅ Graceful degradation

### No Breaking Changes
✅ Jobs with claims work exactly as before  
✅ API contract unchanged (still returns `claims: []`)  
✅ Frontend handles both cases

## Files Modified

1. **backend/pipeline.py**
   - Updated `stage_2_claim_extraction()` 
   - Updated `process_pipeline()`

2. **frontend/components/ResultsView.tsx**
   - Added "No Claims" message component

## Deployment

Simply restart the backend:
```bash
cd backend
# Backend will auto-reload with --reload flag
# Or restart manually:
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend will pick up changes on next build/refresh.

## Monitoring

Look for this in logs:
```
[job_id] Stage 2: No claims extracted - job completed with empty result
[job_id] Pipeline completed early - no claims to process
```

This indicates the fix is working correctly.

## Future Improvements

1. **Better Input Validation:** Warn users before submitting very short text
2. **Minimum Length Check:** Require at least N characters
3. **Claim Suggestion:** Use LLM to suggest how to rephrase input
4. **Analytics:** Track % of jobs with 0 claims to improve UX

---

**Status:** ✅ Fixed and Deployed  
**Date:** February 15, 2026  
**Priority:** High (was causing demo failures)

# Why New Frontend Doesn't Work vs Old Frontend

## The Key Difference

### Old Frontend (Next.js) ✅ WORKS
```typescript
// Simple and direct - no transformation
const demoResponse = await apiClient.get("/demo");
const resultResponse = await apiClient.get(`/result?job_id=${jobId}`);
onResults(resultResponse.data);  // Uses backend data DIRECTLY

// ResultsView.tsx expects BACKEND format:
results.claims.map((claim) => (
  <div>
    {claim.claim_text}           // Backend field
    {claim.final_verdict}        // Backend field  
    {claim.fact_score}           // Backend field
    {claim.breakdown}            // Backend object
    {claim.sources}              // Backend array
  </div>
))
```

### New Frontend (Vite+React) ❌ BROKEN
```typescript
// Has transformation layer that changes field names
function transformClaim(backendClaim: any): Claim {
  return {
    id: backendClaim.claim_id,
    text: backendClaim.claim_text,      // RENAMED
    verdict: verdictMap[...],            // TRANSFORMED
    confidence: backendClaim.fact_score, // RENAMED
    timestamp: backendClaim.start_time,  // Different field
    evidence: {                          // NESTED DIFFERENTLY
      summary: backendClaim.explanation,
      sources: ...
    }
  };
}

// ResultsScreen.tsx expects TRANSFORMED format:
data.claims.map((claim) => (
  <div>
    {claim.text}         // Transformed field (not claim_text)
    {claim.verdict}      // Transformed field (not final_verdict)
    {claim.confidence}   // Transformed field (not fact_score)
    {claim.evidence}     // Nested object (not flat)
  </div>
))
```

## The Problem

### Old Frontend:
1. Gets data from backend
2. Passes it directly to ResultsView
3. ResultsView uses **backend field names**
4. **Everything matches** ✅

### New Frontend:
1. Gets data from backend
2. **Transforms it** (renames fields, restructures)
3. Passes transformed data to ResultsScreen
4. ResultsScreen expects **transformed field names**
5. **Mismatch happens** if transformation is incomplete ❌

## What Broke

### Backend Returns:
```json
{
  "claim_id": "abc-123",
  "claim_text": "The earth is flat",
  "final_verdict": "MOSTLY_CONTRADICTED",
  "fact_score": 25,
  "breakdown": {
    "evidence_strength": 18,
    "evidence_agreement": 2
  },
  "explanation": "...",
  "sources": [...]
}
```

### Old Frontend Uses Directly:
```typescript
// Works because it uses exact backend fields
<div>{claim.claim_text}</div>
<div>{claim.final_verdict}</div>
<div>{claim.fact_score}</div>
```

### New Frontend Transforms To:
```typescript
{
  id: "abc-123",
  text: "The earth is flat",        // RENAMED
  verdict: "contradicted",           // TRANSFORMED
  confidence: 25,                    // RENAMED
  evidence: {
    summary: "...",
    sources: [...]
  }
}
```

### But New ResultsScreen Might Not Display Correctly Because:
1. It expects the transformed format
2. The transformation might be incomplete
3. ResultsScreen uses transformed field names that may not exist
4. No error handling for missing fields

## The Fix

### Option 1: Use Backend Format Directly (Like Old Frontend)
Remove the transformation layer, use backend fields as-is.

```typescript
// In new frontend, remove transformBackendResponse()
const result = await apiCall('/result?job_id=demo');
onComplete(result);  // Pass backend data directly

// Update ResultsScreen to use backend field names
<div>{claim.claim_text}</div>      // Not claim.text
<div>{claim.final_verdict}</div>    // Not claim.verdict
<div>{claim.fact_score}</div>       // Not claim.confidence
```

### Option 2: Complete the Transformation (What We Tried)
Make sure transformation includes ALL fields and ResultsScreen uses transformed names.

```typescript
// Ensure transformation is complete
function transformClaim(backendClaim: any): Claim {
  return {
    id: backendClaim.claim_id,
    text: backendClaim.claim_text,
    verdict: mapVerdict(backendClaim.final_verdict),
    confidence: backendClaim.fact_score,
    breakdown: backendClaim.breakdown,  // Include ALL fields
    evidence: {
      summary: backendClaim.explanation,
      sources: backendClaim.sources
    }
  };
}
```

## Why Old Frontend Works

It's **simpler**:
- No transformation
- No field renaming
- No restructuring
- Direct backend → display mapping

## Why New Frontend Fails

It's **more complex**:
- Has transformation layer
- Renames fields
- Restructures data
- More points of failure
- Transformation might be incomplete

## Recommendation

For your hackathon demo:
1. **Stick with old frontend** - it works reliably
2. Or **remove transformation from new frontend** - use backend fields directly
3. Or **fix new frontend transformation** - ensure all fields are mapped correctly

The old frontend is simpler and more robust for a demo environment!

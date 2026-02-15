# ProofPulse - Comprehensive Test Cases

**Purpose:** Verify all functionality before demo  
**Date:** February 15, 2026

---

## 🚀 Quick Start Tests

### Test 1: Demo Mode (Must Pass!)
**Priority:** CRITICAL  
**Time:** < 5 seconds  
**Purpose:** Bulletproof demo for judges

**Steps:**
1. Open http://localhost:3000
2. Click **"Try Demo Clip"** button
3. Watch processing animation
4. Wait for results screen

**Expected Result:**
- ✅ Processing animation shows (~3-5 seconds)
- ✅ 3 claims displayed
- ✅ Each claim has:
  - Verdict (SUPPORTED/CONTRADICTED/UNCLEAR)
  - Confidence score (0-100)
  - Sources with links
  - Explanation text
- ✅ Overall credibility score shown
- ✅ All UI elements render correctly

**Pass Criteria:**
- No errors in browser console
- Results display within 5 seconds
- All 3 claims visible

---

## 📝 Text Input Tests

### Test 2: Scientific Fact (Contradicted)
**Priority:** HIGH  
**Time:** 10-15 seconds

**Input:**
```
The earth is flat
```

**Expected Result:**
- ✅ 1 claim extracted
- ✅ Verdict: **MOSTLY_CONTRADICTED** or **CONTRADICTED**
- ✅ Score: 15-30/100
- ✅ Sources: NASA, National Geographic, etc.
- ✅ Evidence: Scientific sources contradicting claim

**Verification:**
```bash
curl -X POST -H "x-client-id: test" \
  -F "text=The earth is flat" \
  http://localhost:8000/live
```

---

### Test 3: Geographic Fact (Supported)
**Priority:** HIGH  
**Time:** 10-15 seconds

**Input:**
```
Zebras are native to Africa and have black and white stripes
```

**Expected Result:**
- ✅ 2 claims extracted:
  1. "Zebras are native to Africa" → MOSTLY_SUPPORTED (70-80/100)
  2. "Zebras have black and white stripes" → SUPPORTED (60-90/100)
- ✅ Sources: Britannica, Smithsonian, National Geographic
- ✅ Multiple credible sources per claim

**Pass Criteria:**
- At least 2 claims extracted
- All scores > 50
- At least 2 sources per claim

---

### Test 4: Medical Claim (Contradicted)
**Priority:** MEDIUM  
**Time:** 10-15 seconds

**Input:**
```
Vaccines cause autism
```

**Expected Result:**
- ✅ 1 claim extracted
- ✅ Verdict: **CONTRADICTED** or **MOSTLY_CONTRADICTED**
- ✅ Score: 0-30/100
- ✅ Sources: CDC, WHO, medical journals
- ✅ Evidence: Multiple studies contradicting claim

---

### Test 5: Historical Fact (Supported)
**Priority:** MEDIUM  
**Time:** 10-15 seconds

**Input:**
```
The moon landing happened in 1969
```

**Expected Result:**
- ✅ 1 claim extracted
- ✅ Verdict: **SUPPORTED** or **MOSTLY_SUPPORTED**
- ✅ Score: 80-100/100
- ✅ Sources: NASA, historical records
- ✅ High confidence

---

### Test 6: Complex Multi-Claim
**Priority:** HIGH  
**Time:** 15-20 seconds

**Input:**
```
Solar panel efficiency has doubled every year since 2010. Wind energy is now the cheapest source of electricity in most countries. Nuclear fusion will be commercially viable by 2025.
```

**Expected Result:**
- ✅ 3 claims extracted
- ✅ Claim 1 (Solar): CONTRADICTED (efficiency hasn't doubled yearly)
- ✅ Claim 2 (Wind): MOSTLY_SUPPORTED (true in many countries)
- ✅ Claim 3 (Fusion): CONTRADICTED or UNCLEAR (2025 already passed, not viable)
- ✅ Mixed verdicts demonstrate system works

---

## 🔍 Edge Case Tests

### Test 7: Empty/No Claims (Should Handle Gracefully)
**Priority:** HIGH  
**Time:** 3-5 seconds

**Inputs to Test:**
```
1. "Hello world"
2. "Can zebras dance?"
3. "I think the sky is beautiful"
4. "What is the capital of France?"
```

**Expected Result:**
- ✅ Job completes successfully (status: READY)
- ✅ 0 claims returned
- ✅ Frontend shows: "No Factual Claims Found" message
- ✅ Helpful explanation displayed
- ✅ No errors or crashes

**Verification:**
```bash
curl -X POST -H "x-client-id: test" \
  -F "text=Hello world" \
  http://localhost:8000/live
# Should complete with claims: []
```

**Pass Criteria:**
- System doesn't crash
- User-friendly message shown
- Can analyze another input immediately

---

### Test 8: Very Long Text
**Priority:** MEDIUM  
**Time:** 20-30 seconds

**Input:**
```
Climate change is causing global temperatures to rise. The average temperature has increased by 1.1 degrees Celsius since pre-industrial times. Sea levels are rising at an accelerating rate. Arctic ice is melting faster than predicted. Renewable energy is becoming cheaper than fossil fuels. Solar and wind power are now cost-competitive with coal. Electric vehicles are becoming mainstream. Battery technology is improving rapidly.
```

**Expected Result:**
- ✅ Up to 5 claims extracted (MAX_CLAIMS limit)
- ✅ Mix of SUPPORTED/UNCLEAR verdicts
- ✅ Multiple sources per claim
- ✅ Processing completes within 30 seconds

**Pass Criteria:**
- Extracts 3-5 claims
- No timeout errors
- All claims have sources

---

### Test 9: Single Word (Should Handle)
**Priority:** LOW  
**Time:** 3 seconds

**Input:**
```
Science
```

**Expected Result:**
- ✅ 0 claims extracted (too vague)
- ✅ "No Factual Claims Found" message
- ✅ No errors

---

### Test 10: Controversial Topic
**Priority:** HIGH  
**Time:** 15-20 seconds

**Input:**
```
The COVID-19 vaccine is effective at preventing severe illness
```

**Expected Result:**
- ✅ 1 claim extracted
- ✅ Verdict: **SUPPORTED** or **MOSTLY_SUPPORTED**
- ✅ Score: 70-95/100
- ✅ Sources: CDC, WHO, peer-reviewed studies
- ✅ Multiple credible sources

---

## ⚙️ Settings Tests

### Test 11: Settings Persistence
**Priority:** MEDIUM  
**Time:** 1 minute

**Steps:**
1. Open http://localhost:3000
2. Click **⚙️ Settings** button (if available)
3. Toggle Gemini: OFF → ON
4. Change Demo Mode: Cached → Live
5. Click Save
6. Refresh page
7. Check settings persist

**Expected Result:**
- ✅ Settings save successfully
- ✅ Settings persist after refresh
- ✅ Backend receives settings via x-client-id

**API Test:**
```bash
# Save settings
curl -X POST -H "x-client-id: test-settings" \
  -H "Content-Type: application/json" \
  -d '{"gemini_enabled": true, "demo_mode": "live"}' \
  http://localhost:8000/settings

# Verify saved
curl -H "x-client-id: test-settings" \
  http://localhost:8000/settings
```

---

### Test 12: Gemini Fallback
**Priority:** HIGH  
**Time:** 10-15 seconds

**Setup:**
1. Gemini is currently disabled (quota)
2. System should fall back to Backboard

**Steps:**
1. Submit any text
2. Check result explanation

**Expected Result:**
- ✅ Processing completes successfully
- ✅ Uses Backboard scoring
- ✅ UI shows "Gemini unavailable • Using Backboard scoring" (if implemented)
- ✅ Scores are still calculated

---

## 🔗 API Endpoint Tests

### Test 13: Backend Health Check
**Command:**
```bash
curl http://localhost:8000/health
```

**Expected Output:**
```json
{
  "status": "healthy",
  "valkey": "connected"
}
```

---

### Test 14: Demo Endpoint
**Command:**
```bash
curl http://localhost:8000/demo
```

**Expected Output:**
```json
{
  "job_id": "demo",
  "status": "READY",
  "message": "Demo loaded from cache"
}
```

Then get result:
```bash
curl http://localhost:8000/result?job_id=demo | jq '.claims | length'
# Should output: 3
```

---

### Test 15: Job Status Flow
**Commands:**
```bash
# 1. Submit job
JOB_ID=$(curl -s -X POST -H "x-client-id: test" \
  -F "text=Paris is the capital of France" \
  http://localhost:8000/live | jq -r '.job_id')

# 2. Check status (immediate)
curl "http://localhost:8000/status?job_id=$JOB_ID"
# Expected: PROCESSING or CLAIM_EXTRACTION

# 3. Wait 5 seconds
sleep 5

# 4. Check status again
curl "http://localhost:8000/status?job_id=$JOB_ID"
# Expected: EVIDENCE_RETRIEVAL or SCORING

# 5. Wait 10 seconds
sleep 10

# 6. Get result
curl "http://localhost:8000/result?job_id=$JOB_ID" | jq
# Expected: Full result with claims
```

---

### Test 16: Settings API
**Commands:**
```bash
# Get default settings
curl -H "x-client-id: test-user-1" \
  http://localhost:8000/settings

# Update settings
curl -X POST -H "x-client-id: test-user-1" \
  -H "Content-Type: application/json" \
  -d '{"gemini_enabled": true, "demo_mode": "live"}' \
  http://localhost:8000/settings

# Verify update
curl -H "x-client-id: test-user-1" \
  http://localhost:8000/settings
```

**Expected:**
- ✅ Returns default settings first time
- ✅ Saves new settings
- ✅ Returns updated settings on next call

---

## 🎨 Frontend UI Tests

### Test 17: Landing Page UI
**Steps:**
1. Open http://localhost:3000
2. Check visual elements

**Verify:**
- ✅ "ProofPulse" title with gradient
- ✅ "Real-Time Claim Verifier" subtitle
- ✅ 3 tabs: Upload / URL / Text
- ✅ Beautiful gradient background
- ✅ Sponsor badges (TwelveLabs, Backboard, Valkey)
- ✅ Animations smooth
- ✅ Responsive design

---

### Test 18: Tab Switching
**Steps:**
1. Click **"Upload"** tab → Should show drag & drop area
2. Click **"URL"** tab → Should show URL input field
3. Click **"Text"** tab → Should show textarea

**Expected:**
- ✅ Smooth transitions between tabs
- ✅ Active tab highlighted
- ✅ Blue underline on active tab
- ✅ Input fields appropriate for each type

---

### Test 19: Processing Animation
**Steps:**
1. Click "Text" tab
2. Enter "Test claim"
3. Click "Analyze Text"
4. Watch processing screen

**Verify:**
- ✅ Smooth transition to processing screen
- ✅ Animated spinner
- ✅ Progress percentage (0% → 99%)
- ✅ Status messages updating
- ✅ Progress bar filling
- ✅ Takes appropriate time (don't complete instantly if real API)

---

### Test 20: Results Display
**Steps:**
1. Complete any analysis
2. View results screen

**Verify:**
- ✅ Back arrow (top left)
- ✅ Credibility score (large number)
- ✅ Each claim card shows:
  - Claim text
  - Verdict badge (colored)
  - Confidence score
  - Explanation
  - Source cards
- ✅ Sources have:
  - Publisher name
  - Title
  - Date
  - "View →" link
- ✅ Can click back to landing

---

## 🔥 Stress Tests

### Test 21: Rapid Submissions
**Priority:** LOW  
**Purpose:** Test if backend can handle multiple concurrent requests

**Steps:**
```bash
for i in {1..5}; do
  curl -X POST -H "x-client-id: stress-test-$i" \
    -F "text=Claim number $i about something factual" \
    http://localhost:8000/live &
done
wait
```

**Expected:**
- ✅ All 5 jobs created
- ✅ All process independently
- ✅ No crashes
- ✅ All complete successfully

---

### Test 22: Very Fast Polling
**Priority:** LOW  
**Purpose:** Test status endpoint under load

**Steps:**
```bash
JOB_ID="demo"
for i in {1..20}; do
  curl -s "http://localhost:8000/status?job_id=$JOB_ID" > /dev/null &
done
wait
```

**Expected:**
- ✅ All requests complete
- ✅ No 500 errors
- ✅ Consistent responses

---

## 🎯 Specific Claim Type Tests

### Test 23: Statistical Claim
**Input:**
```
In 2023, the global GDP grew by 3.2%
```

**Expected:**
- ✅ Claim type: statistical
- ✅ Sources: World Bank, IMF, economic reports
- ✅ Verdict depends on actual data

---

### Test 24: Scientific Claim
**Input:**
```
Water boils at 100 degrees Celsius at sea level
```

**Expected:**
- ✅ Claim type: scientific
- ✅ Verdict: SUPPORTED
- ✅ Score: 90-100/100
- ✅ Sources: Scientific references

---

### Test 25: Historical Claim
**Input:**
```
World War II ended in 1945
```

**Expected:**
- ✅ Claim type: historical
- ✅ Verdict: SUPPORTED
- ✅ Score: 95-100/100
- ✅ Sources: Historical records

---

### Test 26: Policy Claim
**Input:**
```
The Paris Climate Agreement was signed in 2015
```

**Expected:**
- ✅ Claim type: policy
- ✅ Verdict: SUPPORTED
- ✅ Sources: UN, government records

---

## ⚠️ Error Handling Tests

### Test 27: Invalid Job ID
**Command:**
```bash
curl "http://localhost:8000/result?job_id=nonexistent"
```

**Expected:**
```json
{
  "detail": "Job not found"
}
```
**Status Code:** 404

---

### Test 28: Missing Client ID
**Command:**
```bash
curl -X POST -F "text=Test" http://localhost:8000/live
```

**Expected:**
```json
{
  "detail": "x-client-id header required"
}
```
**Status Code:** 400

---

### Test 29: Empty Text Submission
**Command:**
```bash
curl -X POST -H "x-client-id: test" \
  -F "text=" \
  http://localhost:8000/live
```

**Expected:**
- ✅ Job created
- ✅ Returns 0 claims
- ✅ No crash

---

### Test 30: Job Still Processing
**Steps:**
1. Submit a job
2. Immediately try to get result (before READY)

**Command:**
```bash
JOB_ID=$(curl -s -X POST -H "x-client-id: test" \
  -F "text=Long text here" \
  http://localhost:8000/live | jq -r '.job_id')

# Immediately request result
curl "http://localhost:8000/result?job_id=$JOB_ID"
```

**Expected:**
```json
{
  "detail": "Job not ready. Current status: CLAIM_EXTRACTION"
}
```
**Status Code:** 400

---

## 🌐 Frontend Integration Tests

### Test 31: Demo Button Click
**Steps:**
1. Open http://localhost:3000
2. Click "Try Demo Clip"
3. Monitor browser console (F12)

**Expected:**
- ✅ No console errors
- ✅ API call to `/demo` succeeds
- ✅ Processing screen shows
- ✅ Results display correctly
- ✅ All 3 claims render

---

### Test 32: Text Input Flow
**Steps:**
1. Click "Text" tab
2. Paste: "Coffee is good for health"
3. Click "Analyze Text"
4. Monitor network tab (F12)

**Expected:**
- ✅ API call to `/live` with x-client-id header
- ✅ Receives job_id
- ✅ Polls `/status` every 2 seconds
- ✅ When READY, calls `/result`
- ✅ Displays results
- ✅ No CORS errors

---

### Test 33: URL Input (If Implemented)
**Steps:**
1. Click "URL" tab
2. Enter: "https://example.com"
3. Click "Analyze URL"

**Expected:**
- ✅ Submits to backend
- ✅ Backend attempts to fetch URL
- ✅ Extracts text from URL
- ✅ Processes normally

---

### Test 34: File Upload (If Implemented)
**Steps:**
1. Click "Upload" tab
2. Select a .txt file
3. Wait for processing

**Expected:**
- ✅ File uploads
- ✅ Backend receives file
- ✅ Processes content
- ✅ Returns results

---

## 🎬 Demo Script Tests

### Test 35: 30-Second Judge Demo
**Script:**
1. Open app (5 sec)
2. Click "Try Demo Clip" (2 sec)
3. Show processing (3 sec)
4. Show results (20 sec):
   - Point to verdict colors
   - Show confidence scores
   - Open source links
   - Explain rubric breakdown

**Total Time:** 30 seconds  
**Pass Criteria:** Everything works smoothly, no errors

---

### Test 36: 2-Minute Deep Dive
**Script:**
1. Show landing page features (20 sec)
2. Click demo, show results (30 sec)
3. Click "Analyze New Input" (5 sec)
4. Submit real text (5 sec)
5. Watch real processing (15 sec)
6. Compare results (45 sec)

**Total Time:** 2 minutes  
**Pass Criteria:** Demonstrates both cached and live modes

---

## 🔬 Backend Logic Tests

### Test 37: Score-to-Verdict Mapping
**Test Data:**
```python
# In backend, verify these mappings:
score = 95  → verdict = "SUPPORTED"
score = 75  → verdict = "MOSTLY_SUPPORTED"
score = 50  → verdict = "UNCLEAR"
score = 25  → verdict = "MOSTLY_CONTRADICTED"
score = 10  → verdict = "CONTRADICTED"
```

**Verification:**
```bash
# Test "The earth is flat" - should get 15-30 score
curl -X POST -H "x-client-id: test" \
  -F "text=The earth is flat" \
  http://localhost:8000/live

# Wait and check score matches verdict
```

---

### Test 38: Agreement Multiplier
**Purpose:** Verify multiplier logic

**Test Cases:**
- If Backboard says CONTRADICTED and final says CONTRADICTED → multiplier = 1.0
- If Backboard says SUPPORTED and final says SUPPORTED → multiplier = 1.0
- If Backboard says CONTRADICTED but final says SUPPORTED → multiplier = 0.6

---

### Test 39: Empty Sources Guard
**Purpose:** Verify Stage 3 guard works

**Mock Test:** (Would need to mock Backboard returning empty sources)
**Expected:**
- ✅ System provides fallback source
- ✅ Claim marked as UNCLEAR
- ✅ Low scores applied
- ✅ No crash

---

## 📊 Performance Tests

### Test 40: Response Times
**Metrics to Check:**

| Endpoint | Expected Time | Acceptable |
|----------|---------------|------------|
| GET /health | < 100ms | < 500ms |
| GET /demo | < 100ms | < 1s |
| POST /live | < 1s | < 3s |
| GET /status | < 100ms | < 500ms |
| GET /result | < 500ms | < 2s |
| Full pipeline | 10-15s | < 30s |

**Test Command:**
```bash
time curl http://localhost:8000/health
# Should be under 1 second
```

---

## 🔄 Debug Mode Tests

### Test 41: Enable Debug Logging
**Steps:**
1. Stop backend
2. Set: `DEBUG_JOB_ID=test_debug_job`
3. Restart backend
4. Submit job with that exact ID

**Expected:**
- ✅ Detailed logs for each stage
- ✅ Shows cache reads/writes
- ✅ Shows API calls
- ✅ Shows timing data

**Verification:**
```bash
cd backend
DEBUG_JOB_ID=test_debug_job python3 test_live.py
```

---

## 📱 Browser Compatibility Tests

### Test 42: Chrome
- ✅ Open http://localhost:3000 in Chrome
- ✅ All features work
- ✅ Animations smooth
- ✅ No console errors

### Test 43: Safari
- ✅ Open http://localhost:3000 in Safari
- ✅ All features work
- ✅ Animations smooth

### Test 44: Mobile View
- ✅ Open in Chrome DevTools mobile view
- ✅ Responsive layout
- ✅ Touch interactions work

---

## 🎯 Pre-Demo Checklist

### Before Showing to Judges

- [ ] Run Test 1 (Demo Mode) - **MUST PASS**
- [ ] Run Test 2 (Earth is flat) - Verify contradicted
- [ ] Run Test 3 (Zebras) - Verify supported
- [ ] Check no console errors in browser
- [ ] Verify backend logs are clean (no warnings)
- [ ] Test "Analyze New Input" button works
- [ ] Verify all source links clickable
- [ ] Check mobile responsiveness (optional)

---

## 🚨 Critical Path Tests (Must All Pass)

**These 5 tests MUST work for demo:**

1. ✅ **Test 1:** Demo mode loads instantly
2. ✅ **Test 2:** "Earth is flat" returns CONTRADICTED
3. ✅ **Test 3:** "Zebras in Africa" returns SUPPORTED
4. ✅ **Test 7:** Empty claims handled gracefully
5. ✅ **Test 31:** Frontend demo button works

**If any fail:** Debug immediately before demo!

---

## 📝 Test Execution Order

### Pre-Demo (5 minutes)
1. Test 1: Demo mode ✅
2. Test 13: Backend health ✅
3. Test 31: Frontend demo button ✅
4. Test 2: Earth is flat ✅
5. Test 7: Empty claims handling ✅

### During Demo (If judges want to test)
1. Let them click "Try Demo Clip"
2. If they want custom input, suggest:
   - "Vaccines cause autism"
   - "Solar power is efficient"
   - "The moon landing was fake"

### Post-Demo Testing (Optional)
- Tests 4-6: Other claim types
- Tests 21-22: Stress tests
- Tests 42-44: Browser compatibility

---

## 🔧 Debugging Tests

### Test 45: Check Logs
**Backend:**
```bash
tail -f /Users/ramchandrachawla/.cursor/projects/.../terminals/*.txt
```

**Frontend:**
- Open browser console (F12)
- Check for errors

---

### Test 46: Verify All Endpoints
```bash
# List all endpoints
curl http://localhost:8000 | jq
```

**Expected Endpoints:**
- POST /ingest
- POST /process
- GET /status
- GET /result
- GET /demo
- POST /demo/live
- POST /live
- GET /settings
- POST /settings
- GET /health

---

## 📄 Test Report Template

```
TEST RUN: [Date/Time]
TESTER: [Name]

✅ PASSED: [#]
❌ FAILED: [#]
⚠️  WARNINGS: [#]

CRITICAL TESTS:
- [ ] Test 1: Demo Mode
- [ ] Test 2: Contradicted Claim
- [ ] Test 3: Supported Claim
- [ ] Test 7: Empty Claims
- [ ] Test 31: Frontend Demo

NOTES:
- [Any observations]
- [Any issues found]
- [Suggestions]

OVERALL STATUS: READY / NOT READY
```

---

## 🎉 Success Criteria

### For Hackathon Demo
**Minimum Requirements:**
- ✅ Demo mode works instantly
- ✅ Frontend UI loads without errors
- ✅ At least 1 real text input test passes
- ✅ Results display correctly
- ✅ Sources are clickable

**Excellent Demo:**
- ✅ All critical tests pass
- ✅ Multiple input types work
- ✅ No visible errors
- ✅ Smooth animations
- ✅ Fast response times
- ✅ Professional presentation

---

## 📚 Quick Reference

### Start Services
```bash
# Backend
cd backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend
cd frontend && npm run dev
```

### Run Test Suite
```bash
# Quick health check
curl http://localhost:8000/health

# Test demo
curl http://localhost:8000/result?job_id=demo | jq '.claims | length'

# Test real input
curl -X POST -H "x-client-id: test" \
  -F "text=Paris is the capital of France" \
  http://localhost:8000/live
```

### Open App
```
http://localhost:3000
```

---

**Total Test Cases:** 46  
**Critical Tests:** 5  
**Estimated Testing Time:** 30 minutes (full suite)  
**Pre-Demo Testing Time:** 5 minutes (critical only)

---

**Ready to test!** 🚀

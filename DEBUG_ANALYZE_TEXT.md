# Debug: Analyze Text Button Issue

## Current Status
- ✅ Backend running on port 8000
- ✅ Frontend running on port 3000
- ✅ API endpoints responding correctly
- ❓ Frontend returning to main page after clicking "Analyze Text"

## Changes Made

### 1. Added Comprehensive Logging
Added detailed console.log statements in:
- `ProcessingScreen2.tsx`: Logs every step of the process
- `api.ts`: Already had logging for API calls
- `App.tsx`: Already had logging for state changes

### 2. Fixed useEffect Dependencies
Changed the useEffect in `ProcessingScreen2.tsx` to run only once on mount to avoid multiple executions.

### 3. Created Test Tools

#### A. Test HTML Page
Location: `/Users/ramchandrachawla/PersonalProjects/Hackathon/HackNCState/proofpulse/test-ui.html`

**How to use:**
1. Open the file in your browser: `file:///Users/ramchandrachawla/PersonalProjects/Hackathon/HackNCState/proofpulse/test-ui.html`
2. Click "Test Full Flow" button
3. Watch the log output to see exactly where it succeeds or fails
4. This tests the API independent of React

#### B. Backend API Test (curl)
```bash
# Test ingest + process
cd /Users/ramchandrachawla/PersonalProjects/Hackathon/HackNCState/proofpulse

curl -X POST http://localhost:8000/ingest \
  -H "x-client-id: test" \
  -F "type=text" \
  -F "content=The earth is flat" \
  -s | python3 -m json.tool
```

## How to Debug the React App

### Step 1: Open Browser DevTools
1. Go to http://localhost:3000
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to the "Console" tab

### Step 2: Try Analyze Text
1. Click the "Text" tab
2. Enter: "The earth is flat"
3. Click "Analyze Text"
4. Watch the console for logs

### Step 3: Check for Errors
Look for these log messages in order:

```
✓ Expected logs:
[App] handleAnalyze called: {type: 'text', text: 'The earth is flat', ...}
[ProcessingScreen2] Starting process with: {text: 'The earth is flat', ...}
[ProcessingScreen2] Submitting text: The earth is flat
submitTextForAnalysis called with: The earth is flat
Ingest response: {job_id: "...", status: "INGESTED", ...}
[ProcessingScreen2] Got job ID: ...
[ProcessingScreen2] Starting to poll for results
[ProcessingScreen2] Status update: ...
...
[ProcessingScreen2] Got result, calling onComplete
Processing complete: {...}
```

```
✗ If you see error logs:
[ProcessingScreen2] ERROR: ...
[ProcessingScreen2] Error details: ...
Processing error: ...
```

### Step 4: Check Network Tab
1. In DevTools, go to "Network" tab
2. Try "Analyze Text" again
3. Look for these requests:
   - `POST /ingest` - Should return 200 with job_id
   - `POST /process?job_id=...` - Should return 202
   - `GET /status?job_id=...` - Should return 200 with status
   - `GET /result?job_id=...` - Should return 200 with claims

### Step 5: Check for CORS Errors
If you see errors like "CORS policy" or "Access-Control-Allow-Origin", check:
- Backend config.py has `http://localhost:3000` in CORS_ORIGINS
- The x-client-id header is being sent

## Common Issues

### Issue 1: Empty/undefined text
**Symptom:** Log shows `[ProcessingScreen2] No input provided!`
**Fix:** The text state isn't being passed from LandingScreen to App to ProcessingScreen2

### Issue 2: API Call Fails
**Symptom:** Log shows API error or network error
**Check:**
- Is backend actually running? Check http://localhost:8000/health
- CORS configuration correct?
- FormData being sent correctly?

### Issue 3: Immediate Return to Main Page
**Symptom:** No logs in console, just returns
**Possible Causes:**
- React error causing component unmount
- onError being called immediately
- Browser console might show a React error

### Issue 4: Stuck on Processing Screen
**Symptom:** Stays on processing screen forever
**Check:** 
- Backend logs for pipeline errors
- Status endpoint returning correct values
- Polling logic working

## Next Steps

1. **Try the test HTML page first** - This will verify the API works independently
2. **Open React app with DevTools** - Check console and network tabs
3. **Share the console logs** - Copy any error messages you see
4. **Check both terminals**:
   - Backend: `tail -f ~/.cursor/projects/.../terminals/511288.txt`
   - Frontend: `tail -f ~/.cursor/projects/.../terminals/306408.txt`

## Quick Health Check Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend is serving
curl -I http://localhost:3000

# List running processes
lsof -i:8000 -i:3000
```

## Files Modified
- `frontend/src/app/screens/ProcessingScreen2.tsx` - Added logging
- `frontend/src/app/api.ts` - Already had logging
- `frontend/src/app/App.tsx` - No changes needed
- Created: `test-ui.html` - Standalone API test
- Created: `DEBUG_ANALYZE_TEXT.md` - This file

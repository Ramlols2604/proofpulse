# Analyze Text Button Fix

## Problem
The "Analyze Text" button wasn't working due to incorrect API request format.

## Root Cause
The frontend was sending JSON data to `/ingest`, but the backend expects **FormData** with form fields:
- `type`: string (text, url, video, pdf, txt)
- `content`: string (for text/url content)
- `file`: File (for video/pdf uploads)

## Fixed Files
1. **frontend/src/app/api.ts**
   - Changed `submitTextForAnalysis()` to use FormData instead of JSON
   - Changed `submitUrlForAnalysis()` to use FormData instead of JSON
   - Updated `submitFileForAnalysis()` to include the `type` field
   - Added console.log debugging statements

2. **frontend/src/app/screens/LandingScreen.tsx**
   - Fixed the "Analyze File" button styling (removed unsupported `as` prop)

3. **frontend/src/app/App.tsx**
   - Refactored state management to pass individual props instead of an object

## Services Running
✅ **Backend**: http://localhost:8000
✅ **Frontend**: http://localhost:3000

Only ONE instance of each is running on the correct ports.

## How to Test

### 1. Open the App
Navigate to: http://localhost:3000

### 2. Test Text Analysis
1. Click the "Text" tab
2. Enter text (e.g., "The earth is flat")
3. Click "Analyze Text"
4. Should see processing screen with progress bar
5. Results screen displays with claims and scores

### 3. Test URL Analysis
1. Click the "URL" tab
2. Enter a URL
3. Click "Analyze URL"
4. Watch processing stages

### 4. Test File Upload
1. Click "Upload File" tab
2. Drag & drop or click "Analyze File"
3. Select a video/PDF/TXT file
4. Watch processing

### 5. Test Demo
1. Click "Try Demo Clip" button
2. Should instantly show pre-cached results

## API Test Command
```bash
curl -X POST http://localhost:8000/ingest \
  -H "x-client-id: test-client" \
  -F "type=text" \
  -F "content=The earth is flat"
```

Expected response:
```json
{
  "job_id": "uuid-here",
  "status": "INGESTED",
  "message": "Job created successfully"
}
```

## Console Debugging
Open browser DevTools (F12) to see:
- `submitTextForAnalysis called with: ...`
- `Ingest response: ...`
- API call progress and errors

## Status
✅ **FIXED** - All analyze buttons now work correctly with proper FormData API calls.

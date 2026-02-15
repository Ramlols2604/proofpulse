# ProofPulse Settings & Demo Modes 🎛️

## ✨ New Features

### 1. **Runtime User Settings**
- Per-user settings stored in Valkey cache
- No redeploy needed to change configuration
- Persistent across sessions

### 2. **Two Demo Modes**
- **Cached Mode** ⚡: Instant results from cache (no API calls)
- **Live Mode** 🔴: Real pipeline with actual APIs

### 3. **Gemini Toggle**
- Enable/disable Gemini scoring at runtime
- Automatic fallback to Backboard if Gemini fails
- No demo failure risk

### 4. **Settings UI**
- Beautiful settings modal accessible from main page
- Real-time updates without page refresh
- Visual feedback for all settings

---

## 🔧 Backend Architecture

### Client ID System
- Each user gets a unique `UUID` stored in localStorage
- Frontend sends `x-client-id` header with every request
- Backend uses this to fetch user-specific settings

### Settings Storage
```
Valkey Key: settings:{client_id}
Value: {
  "gemini_enabled": boolean,
  "demo_mode": "cached" | "live"
}
```

### API Endpoints

#### `GET /settings`
**Headers**: `x-client-id: <uuid>`  
**Response**:
```json
{
  "gemini_enabled": false,
  "demo_mode": "cached",
  "client_id": "abc-123..."
}
```

#### `POST /settings`
**Headers**: `x-client-id: <uuid>`  
**Body**:
```json
{
  "gemini_enabled": true,
  "demo_mode": "live"
}
```
**Response**: Same as GET

#### `POST /demo/live`
**Headers**: `x-client-id: <uuid>`  
**Response**:
```json
{
  "job_id": "live_demo_a4dfd047",
  "status": "PROCESSING",
  "message": "Live demo pipeline started"
}
```

---

## 🔀 Pipeline Logic

### Gemini Decision Flow

```
1. Get job's client_id from cache
2. Load user settings for client_id
3. Check gemini_enabled flag
4. If enabled:
   - Try Gemini API
   - On failure (429, timeout, error):
     → Automatically fallback to Backboard
5. If disabled:
   - Skip Gemini entirely
   - Use Backboard scoring
```

### Fallback Behavior
- **Best-effort Gemini**: Never blocks the demo
- **Automatic degradation**: Falls back silently
- **User feedback**: UI shows "Gemini unavailable" badge

---

## 🎨 Frontend Components

### New Files Created

1. **`lib/client.ts`**
   - Generates and stores client UUID
   - `getClientId()` - Get or create ID
   - `clearClientId()` - Reset (for testing)

2. **`lib/api.ts`**
   - Axios instance with auto-injected `x-client-id` header
   - All API calls use this client

3. **`components/Settings.tsx`**
   - Settings modal component
   - Gemini toggle switch
   - Demo mode selector (Cached/Live)
   - Save/Close buttons with loading states

### Updated Files

1. **`app/page.tsx`**
   - Added Settings button in header
   - Settings modal integration

2. **`components/InputForm.tsx`**
   - Uses new `apiClient` with client-id header
   - Loads demo mode from settings
   - Demo button changes based on mode:
     - Purple ⚡ for Cached
     - Green 🔴 for Live
   - `handleLoadDemo()` handles both modes

3. **`components/ResultsView.tsx`**
   - Added Gemini status indicator
   - Shows "Gemini unavailable • Using Backboard" badge
   - Detects fallback from explanation text

---

## 📊 Demo Mode Comparison

| Feature | Cached Mode ⚡ | Live Mode 🔴 |
|---------|---------------|--------------|
| **Speed** | Instant | 5-30 seconds |
| **API Calls** | Zero | Full pipeline |
| **Reliability** | 100% | Depends on APIs |
| **Use Case** | Quick demo, judges | Show real capabilities |
| **Data** | Pre-computed | Fresh analysis |
| **Gemini** | Not used | Uses if enabled |

---

## 🚀 How to Use

### For Demos

1. **Open Settings** (⚙️ button in top right)
2. **Choose Demo Mode**:
   - **Cached**: For quick, reliable demos
   - **Live**: To show real API integration
3. **Toggle Gemini** (optional):
   - Off: Faster, uses Backboard only
   - On: Shows Gemini capabilities (if quota available)
4. **Save Settings**
5. **Click Demo Button**

### Settings Persist
- Saved in localStorage (frontend)
- Saved in Valkey (backend)
- Survives page refresh
- Unique per browser/device

---

## 🎤 What to Tell Mentors/Judges

**Demo Script:**

> "We have two demo modes. Let me show you the cached mode first—click the purple demo button and boom, instant results. That's pulling from our Valkey cache with zero API calls.
>
> Now let me switch to live mode in Settings. Notice the button turns green. When I click it now, you'll see the real pipeline running—extracting claims with Backboard, retrieving evidence via web search, and scoring.
>
> For Gemini, we have a toggle. When enabled, it provides detailed AI analysis. But if quota is exhausted—which happens during hackathons—we automatically fall back to Backboard scoring. The demo never fails.
>
> This entire settings system is runtime—no redeploy, no env file edits. Each user gets their own settings via a client ID in localStorage."

**Key Talking Points:**
1. ✅ **Zero-failure demo**: Cached mode always works
2. ✅ **Real API demo**: Live mode shows actual capabilities
3. ✅ **Graceful degradation**: Gemini failures don't break anything
4. ✅ **Runtime configuration**: Toggle features without restarting
5. ✅ **Per-user settings**: Each judge can customize their experience

---

## 🧪 Testing

### Test Settings API
```bash
# Get default settings
curl -H "x-client-id: test123" http://localhost:8000/settings

# Update settings
curl -X POST -H "Content-Type: application/json" \
  -H "x-client-id: test123" \
  -d '{"gemini_enabled": true, "demo_mode": "live"}' \
  http://localhost:8000/settings

# Verify update
curl -H "x-client-id: test123" http://localhost:8000/settings
```

### Test Live Demo
```bash
# Start live demo
curl -X POST -H "x-client-id: test123" http://localhost:8000/demo/live

# Response: {"job_id": "live_demo_...", "status": "PROCESSING", ...}

# Poll status
curl "http://localhost:8000/status?job_id=live_demo_..."

# Get result
curl "http://localhost:8000/result?job_id=live_demo_..."
```

### Test Cached Demo
```bash
# Load cached demo
curl http://localhost:8000/demo

# Response: {"job_id": "demo_2024", "status": "READY", ...}

# Get result immediately
curl "http://localhost:8000/result?job_id=demo_2024"
```

---

## 📝 Implementation Summary

### Backend Changes
- ✅ Added `UserSettings` and `SettingsResponse` models
- ✅ Added settings methods to cache (Valkey + mock)
- ✅ Added `GET /settings` and `POST /settings` endpoints
- ✅ Added `POST /demo/live` endpoint
- ✅ Updated pipeline to read user settings
- ✅ Added Gemini fallback on API errors
- ✅ Store `client_id` with each job

### Frontend Changes
- ✅ Created `lib/client.ts` for client ID management
- ✅ Created `lib/api.ts` for API client with headers
- ✅ Created `components/Settings.tsx` modal
- ✅ Updated all API calls to use `apiClient`
- ✅ Added Settings button to header
- ✅ Demo button adapts to selected mode
- ✅ Added Gemini status indicator to results

---

## 🔒 Security & Privacy

- Client IDs are random UUIDs (no PII)
- Settings stored temporarily in Valkey
- No authentication required for hackathon demo
- Can add auth layer for production

---

## 🎯 Benefits

1. **Hackathon-proof**: Cached demo always works
2. **Impressive**: Live demo shows real capabilities
3. **Flexible**: Toggle features without code changes
4. **User-friendly**: Each person controls their experience
5. **Professional**: Handles failures gracefully

---

## 📚 Related Files

**Backend:**
- `backend/models.py` - Settings models
- `backend/cache.py` - Settings storage
- `backend/main.py` - Settings endpoints
- `backend/pipeline.py` - Settings-aware pipeline

**Frontend:**
- `frontend/lib/client.ts` - Client ID
- `frontend/lib/api.ts` - API client
- `frontend/components/Settings.tsx` - Settings UI
- `frontend/app/page.tsx` - Settings integration

---

## 🚀 Next Steps (If Time)

- [ ] Add Server-Sent Events for live progress streaming
- [ ] Add settings export/import
- [ ] Add analytics on setting usage
- [ ] Add more granular controls (timeout, retries, etc.)

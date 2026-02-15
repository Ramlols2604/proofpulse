# ProofPulse

Run **backend first**, then the frontend.

## 1. Start the backend (port 8000)

From this repo:

```bash
cd backend
pip install -r requirements.txt
# Optional: start Valkey for caching (or backend uses in-memory mock)
# docker run -p 6379:6379 valkey/valkey:latest
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Leave this terminal open. You should see: `Uvicorn running on http://0.0.0.0:8000`.

## 2. Start the frontend (port 3000)

In a **second terminal**:

```bash
cd frontend_new_vite
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:3000/ or http://localhost:3002/ if ports are in use).

---

**If you see `ECONNREFUSED` or "Cannot reach the backend"** in the frontend or in the Vite terminal, the backend is not running. Start step 1 first.

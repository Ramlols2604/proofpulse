# ProofPulse - Quick Test Guide

**Use this for rapid pre-demo testing** ⚡

---

## 🚀 5-Minute Critical Test Suite

### Test 1: Demo Mode (MUST PASS!)
```bash
# Start services first
cd backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
cd ../frontend && npm run dev &

# Wait 5 seconds, then:
open http://localhost:3000

# Click "Try Demo Clip" button
# Expected: 3 claims appear instantly
```
**Pass:** ✅ Shows 3 claims with sources  
**Fail:** ❌ Error or no claims

---

### Test 2: Backend Health
```bash
curl http://localhost:8000/health
```
**Expected:**
```json
{"status": "healthy", "valkey": "connected"}
```

---

### Test 3: Real Text Input
**In Browser:**
1. Click **"Text"** tab
2. Paste: `Zebras are native to Africa`
3. Click **"Analyze Text"**
4. Wait 10-15 seconds

**Expected:**
- ✅ Processing animation
- ✅ 1-2 claims extracted
- ✅ Sources from Britannica, etc.
- ✅ Verdict: MOSTLY_SUPPORTED

---

### Test 4: Contradicted Claim
**In Browser:**
1. Click **"Text"** tab
2. Paste: `The earth is flat`
3. Click **"Analyze Text"**

**Expected:**
- ✅ 1 claim extracted
- ✅ Verdict: MOSTLY_CONTRADICTED (red badge)
- ✅ Score: 20-30/100
- ✅ Sources: NASA, National Geographic

---

### Test 5: Empty Claims (Edge Case)
**In Browser:**
1. Click **"Text"** tab
2. Paste: `Hello world`
3. Click **"Analyze Text"**

**Expected:**
- ✅ Completes without error
- ✅ Shows "No Factual Claims Found" message
- ✅ Can go back and try again

---

## ✅ If All 5 Tests Pass → **READY FOR DEMO!**

---

## 🎯 Quick Command Tests

### One-Line Backend Test
```bash
curl -s http://localhost:8000/health && echo " ✅" || echo " ❌"
```

### One-Line Demo Test
```bash
curl -s http://localhost:8000/result?job_id=demo | jq '.claims | length'
# Expected: 3
```

### One-Line Live Pipeline Test
```bash
curl -X POST -H "x-client-id: quick-test" \
  -F "text=Water boils at 100 degrees" \
  http://localhost:8000/live | jq '.job_id'
```

---

## 🐛 Quick Debugging

### Frontend Not Loading
```bash
curl -I http://localhost:3000
# If fails: cd frontend && npm run dev
```

### Backend Not Responding
```bash
curl http://localhost:8000/health
# If fails: cd backend && uvicorn main:app --reload
```

### Demo Returns Empty
```bash
curl http://localhost:8000/result?job_id=demo
# If empty: cd backend && python3 create_demo.py
```

---

## 📋 Pre-Demo Checklist

5 minutes before demo:

- [ ] ✅ Run Test 1 (Demo mode)
- [ ] ✅ Run Test 3 (Zebras text)
- [ ] ✅ Run Test 4 (Earth is flat)
- [ ] ✅ Check browser console (no errors)
- [ ] ✅ Check backend logs (no crashes)

**If all checked → GO!** 🎉

---

## 🎨 Best Demo Inputs

**Show These to Judges:**

### Instant Demo
```
Click: "Try Demo Clip"
Shows: 3 pre-analyzed claims
Time: < 1 second
```

### Contradicted Claim
```
Input: "The earth is flat"
Shows: Red verdict, low score, NASA sources
Time: ~12 seconds
```

### Supported Claim
```
Input: "Zebras are native to Africa"
Shows: Green verdict, high score, wildlife sources
Time: ~12 seconds
```

### Multi-Claim
```
Input: "Zebras are native to Africa and have black and white stripes"
Shows: 2 claims, both analyzed separately
Time: ~15 seconds
```

---

## 🚨 Emergency Fixes

### If Demo Breaks
```bash
# Quick restart
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
cd backend && uvicorn main:app --reload &
cd ../frontend && npm run dev &
```

### If Zero Claims Keep Appearing
**Explanation to judges:**
"The system filters out non-verifiable statements like questions or opinions. It only analyzes factual claims that can be verified with sources."

**Then show:** A clear factual statement that works.

---

## ⏱️ Time Estimates

| Test | Time | Priority |
|------|------|----------|
| Demo Mode | 5s | CRITICAL |
| Backend Health | 2s | CRITICAL |
| Text Input | 15s | HIGH |
| Contradicted Claim | 15s | HIGH |
| Empty Claims | 5s | MEDIUM |
| Settings | 30s | LOW |
| File Upload | 20s | LOW |

**Critical Tests Total:** 37 seconds  
**Recommended Tests Total:** 2 minutes

---

## 📞 Quick Support

**System not starting?**
```bash
cd /Users/ramchandrachawla/PersonalProjects/Hackathon/HackNCState/proofpulse
cat SYSTEM_TEST_RESULTS.md
```

**Need debug logs?**
```bash
cd backend
DEBUG_JOB_ID=debug_test python3 test_live.py
```

**Want full test suite?**
```bash
cat TEST_CASES.md
```

---

**Use this guide for quick verification before demos!** ⚡

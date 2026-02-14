# ProofPulse

**Real-time video claim verification using multimodal AI**

ProofPulse analyzes short video clips to detect and verify factual claims in real time. Upload a video, and our system extracts claims, checks them against authoritative sources, and highlights misinformation directly in the timeline.

## The Problem

Misinformation spreads faster through video than text. Viral clips, edited speeches, and out-of-context moments flood social media with no easy way to verify factual accuracy.

## The Solution

ProofPulse brings structured fact-checking directly into video content:

1. **Extract** - Transcript, timestamps, and visual context using TwelveLabs
2. **Detect** - Identify verifiable claims using Backboard LLM
3. **Verify** - Cross-check claims against reliable sources via web retrieval
4. **Display** - Highlight claims in the video timeline with evidence and credibility scores

## Tech Stack

### Frontend
- Next.js + TypeScript
- Tailwind CSS + Shadcn UI
- React Player for video playback

### Backend
- Python FastAPI
- Async job handling

### Sponsor Technologies
- **TwelveLabs Marengo** - Video understanding, transcript extraction, embeddings
- **Backboard** - Claim extraction, web search, fact verification
- **Valkey** - Caching analysis results, embedding storage, fast reruns

## Project Structure

```
proofpulse/
├── frontend/          # Next.js application
├── backend/           # FastAPI service
├── docs/              # Documentation and sponsor usage
└── .env.example       # Environment variables template
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Valkey/Redis instance

### Setup

1. Clone the repository
```bash
git clone https://github.com/Ramlols2604/proofpulse.git
cd proofpulse
```

2. Copy environment variables
```bash
cp .env.example .env
# Add your API keys
```

3. Start backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

4. Start frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Flow

1. Upload a short video clip (30-120 seconds)
2. System extracts transcript and identifies claims
3. Each claim is verified against authoritative sources
4. View results: timeline highlights + evidence panel + credibility scores
5. Click any claim to jump to that moment in the video

## Hackathon Details

**Event:** Hack NC State  
**Track:** SIREN'S CALL (Misinformation & Trust)  
**Built in:** 24 hours  

## Team

- Backend & Sponsor Integrations
- Frontend & Demo Experience
- AI Logic & Pitch

## License

MIT

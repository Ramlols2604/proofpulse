# ProofPulse Frontend

Simple Next.js frontend for ProofPulse claim verification.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on **http://localhost:3000**

## Features

- Upload/input different content types (text, URL, video, PDF, TXT)
- Real-time status polling
- Beautiful results display with:
  - Claim verdicts
  - Fact scores (0-100)
  - Score breakdowns
  - Source citations
  - Color-coded verdicts

## Usage

1. Select input type
2. Enter content or upload file
3. Click "Verify Claims"
4. Wait for processing (auto-polls status)
5. View results with scores and sources

## Backend Connection

Frontend connects to backend at: `http://localhost:8000`

Make sure backend is running first!

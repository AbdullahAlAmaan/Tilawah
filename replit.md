# ReciteFlow — Voice-First Quran Recitation Practice Coach

## Overview
ReciteFlow is a voice-first web app for Quran recitation practice with AI-powered feedback. Users select a Surah, record their recitation, and receive scores on completeness, fluency, and pace with specific hotspot annotations. Includes drill mode for targeted practice and session history tracking.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via better-sqlite3 (local file: `data/reciteflow.db`)
- **AI**: Google Gemini 2.5 Flash via @ai-sdk/google, Mastra for agent orchestration
- **Audio**: smallest.ai API for STT (Pulse) and TTS (Lightning)

## Project Structure
```
src/
  app/           # Next.js App Router pages and API routes
    api/         # Backend API endpoints
    session/     # Session page
    results/     # Results page
    history/     # History page
  components/    # React components (DrillPanel, HotspotList, MicControl, ScoreCards, TrendChart)
  data/          # Static data (surahs.ts)
  lib/           # Core logic (analysis, audio, db, mastra, smallest, storage)
data/            # SQLite database files
public/          # Static assets
```

## Environment Variables
- `SMALLEST_API_KEY` — API key for smallest.ai (STT/TTS)
- `GOOGLE_GENERATIVE_AI_API_KEY` — API key for Google Gemini (AI coaching via Mastra)

## Running
- Dev: `npx next dev --hostname 0.0.0.0 --port 5000`
- Build: `npm run build`
- Start: `npm run start -- -p 5000`

## Key Configuration
- `next.config.ts`: `allowedDevOrigins: ["*"]` for Replit proxy compatibility, `serverExternalPackages: ["better-sqlite3"]`
- SQLite database stored locally at `data/reciteflow.db`

## Recent Changes
- 2026-02-14: Initial Replit setup — configured Next.js for Replit proxy, port 5000, deployment config

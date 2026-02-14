# ReciteFlow — Voice-First Recitation Practice Coach (Ramadan Edition)

A voice-first web app that helps users practice Quran recitation with AI-powered feedback. Record your recitation, get scores on completeness, fluency, and pace, and drill into specific hotspots to improve.

## What It Does

1. **Choose a Surah** — Pick from Al-Ikhlas, Al-Falaq, or An-Nas
2. **Record** — Tap the mic and recite. Audio is session-only (never always-on)
3. **Get Feedback** — Receive scores for completeness, fluency, and pace with specific hotspot annotations
4. **Drill Mode** — Practice weak spots with targeted re-recording and instant feedback
5. **Track Progress** — View session history and score trends over time

## How to Run

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key
cp .env.example .env.local
# Edit .env.local and add your API keys (smallest.ai + Gemini)

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sponsor Tech Used

### smallest.ai (Deep Integration)
- **STT (Speech-to-Text)**: Audio from the browser is sent to the smallest.ai Whisper API for Arabic transcription with word-level timestamps and confidence scores
- **TTS (Text-to-Speech)**: AI-generated coaching tips are synthesized to speech via the smallest.ai Lightning TTS model, playable directly on the results page

### Mastra (AI Agent Orchestration)
- **Recitation Coach Agent**: A Mastra `Agent` takes the full analysis JSON (scores, hotspots, duration) and generates a personalized, encouraging coaching tip using Google Gemini 2.5 Flash
- The agent has a carefully crafted system prompt that enforces product principles: never claims mispronunciation, uses soft encouraging language, keeps tips to 2–3 sentences
- The coaching text is then piped to smallest.ai TTS so the user can listen to their personalized feedback

## Privacy Model

- **Session-only recording** — Audio is captured only while the record button is held. No background listening.
- **Audio storage is opt-in** — By default, only text metrics (scores, transcript, hotspots) are saved. Users can toggle "Save audio for playback" to store recordings locally in the browser's IndexedDB.
- **No cloud audio storage** — Audio is processed in-flight for transcription and never persisted on the server.
- **Local metrics** — Session scores are stored in a local SQLite database on the server (`data/reciteflow.db`).

## Demo Script

1. Open the app at `localhost:3000`
2. Click on **Al-Ikhlas** to start a session
3. Review the Arabic text and transliteration displayed
4. Tap the **mic button** to start recording
5. Recite Surah Al-Ikhlas
6. Tap the **stop button** to finish
7. Wait for analysis — you'll be redirected to the results page
8. Review your **overall score**, **completeness**, **fluency**, and **pace**
9. Click on a **hotspot** to see details
10. Use **Drill Mode** to practice a specific phrase
11. Navigate to **History** to see past sessions and trend charts

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **SQLite** (better-sqlite3) for session metrics storage
- **IndexedDB** (via idb) for optional client-side audio storage
- **Recharts** for trend visualization
- **smallest.ai** for STT and TTS
- **Mastra** (@mastra/core) for AI agent orchestration
- **Google Gemini** (gemini-2.5-flash via @ai-sdk/google) as the LLM behind the coach agent

## Important Note

This is a **practice coach**, not a tajweed authority. The app provides feedback on:
- Whether the expected words were detected (completeness)
- Whether the recitation flowed smoothly (fluency)
- Whether the pace was consistent (pace)

It does **not** claim pronunciation correctness. Hotspot labels use careful language: "Unclear pronunciation (low confidence)", "Hesitation hotspot", "Possible missing words".

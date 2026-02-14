import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSurahById } from '@/data/surahs';
import { transcribeAudio } from '@/lib/smallest';
import { analyzeRecitation } from '@/lib/analysis';
import { generateCoachingTip } from '@/lib/mastra';
import { saveSession } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

const RECORDINGS_DIR = path.join(process.cwd(), 'data', 'recordings');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        const surahId = formData.get('surahId') as string;
        const durationMs = parseInt(formData.get('duration') as string || '0');

        if (!file || !surahId) {
            return NextResponse.json({ error: "Missing file or surahId" }, { status: 400 });
        }

        const surah = getSurahById(surahId);
        if (!surah) {
            return NextResponse.json({ error: "Invalid surah" }, { status: 400 });
        }

        // 1. Process Audio -> STT (API expects raw bytes; avoid empty/skinny recordings)
        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length < 1000) {
            return NextResponse.json({ error: "Audio too short or empty. Record at least a second of speech." }, { status: 400 });
        }
        const contentType = file.type || "audio/webm";
        const sessionId = uuidv4();

        // Save recording for playback on results page
        if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
        fs.writeFileSync(path.join(RECORDINGS_DIR, `${sessionId}.webm`), buffer);

        const { transcript, wordTimestamps, language } = await transcribeAudio(buffer, contentType);

        // 2. Analyze
        const result = analyzeRecitation({
            sessionId,
            surahId,
            expectedText: surah.fullText,
            transcript,
            durationMs,
            expectedDurationSec: surah.expectedDurationSec,
            wordTimestamps
        });

        // 3. Generate Coach Feedback (Mastra)
        const feedback = await generateCoachingTip({
            surahName: surah.name,
            overall: result.overall,
            completeness: result.completeness,
            fluency: result.fluency,
            pace: result.pace,
            hotspotCount: result.hotspots.length,
            topHotspots: result.hotspots.slice(0, 3).map(h => ({
                type: h.type,
                description: h.description,
                severity: h.severity
            })),
            durationSec: Math.round(durationMs / 1000),
            wordCount: result.wordCount || 0
        });

        // 4. Store result in DB (so it appears in history and /results/[id])
        saveSession(result, false, feedback);

        return NextResponse.json({ sessionId, success: true });

    } catch (err: any) {
        console.error("Processing API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


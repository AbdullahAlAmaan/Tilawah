import { NextRequest, NextResponse } from "next/server";
import { generateCoachingTip, type CoachInput } from "@/lib/mastra";
import { getSession } from "@/lib/storage";
import { getSurahById } from "@/data/surahs";
import { synthesizeSpeech } from "@/lib/smallest";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, tts } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const surah = getSurahById(session.surahId);

    const coachInput: CoachInput = {
      surahName: surah?.name ?? session.surahId,
      overall: session.overall,
      completeness: session.completeness,
      fluency: session.fluency,
      pace: session.pace,
      hotspotCount: session.hotspots.length,
      topHotspots: session.hotspots.slice(0, 3).map((h) => ({
        type: h.type,
        description: h.description,
        severity: h.severity,
      })),
      durationSec: Math.round(session.durationMs / 1000),
      wordCount: session.wordCount,
    };

    // Generate coaching tip via Mastra agent
    const tip = await generateCoachingTip(coachInput);

    // Optionally synthesize to audio via smallest.ai TTS
    if (tts) {
      try {
        const ttsResult = await synthesizeSpeech(tip);
        const base64Audio = Buffer.from(ttsResult.audioData).toString("base64");
        return NextResponse.json({
          tip,
          audio: base64Audio,
          audioContentType: ttsResult.contentType,
        });
      } catch (ttsErr) {
        console.error("TTS error (returning text only):", ttsErr);
        return NextResponse.json({ tip, audio: null });
      }
    }

    return NextResponse.json({ tip });
  } catch (err) {
    console.error("Coach route error:", err);
    return NextResponse.json(
      { error: "Could not generate coaching tip. Try again." },
      { status: 500 }
    );
  }
}

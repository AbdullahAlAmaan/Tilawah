import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/smallest";
import { analyzeRecitation } from "@/lib/analysis";
import { getSurahById } from "@/data/surahs";
import { saveSession } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const surahId = formData.get("surahId") as string;
    const sessionId = (formData.get("sessionId") as string) || crypto.randomUUID();
    const durationMs = parseInt(formData.get("durationMs") as string) || 10000;
    const playbackEnabled = formData.get("playbackEnabled") === "true";
    const mode = formData.get("mode") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const surah = getSurahById(surahId);
    if (!surah && mode !== "drill") {
      return NextResponse.json({ error: "Invalid surah" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call smallest.ai STT
    let sttResult;
    try {
      sttResult = await transcribeAudio(buffer, audioFile.type || "audio/webm");
    } catch (sttError) {
      console.error("STT error:", sttError);
      return NextResponse.json(
        { error: "Could not transcribe audio. Try speaking more clearly or check your connection." },
        { status: 502 }
      );
    }

    // Drill mode: simplified analysis
    if (mode === "drill") {
      const expectedSnippet = formData.get("expectedSnippet") as string || "";
      const drillScore = computeDrillScore(expectedSnippet, sttResult.transcript);
      return NextResponse.json({
        sessionId,
        transcript: sttResult.transcript,
        drillScore,
        drillFeedback: drillScore >= 80
          ? "Nice improvement! The phrase sounds clearer."
          : drillScore >= 50
            ? "Getting closer. Try once more, slowly."
            : "Take your time. Listen to the reference and try again.",
      });
    }

    // Full analysis
    const effectiveDuration = sttResult.durationMs || durationMs;
    const result = analyzeRecitation({
      sessionId,
      surahId,
      expectedText: surah!.fullText,
      transcript: sttResult.transcript,
      durationMs: effectiveDuration,
      expectedDurationSec: surah!.expectedDurationSec,
      wordTimestamps: sttResult.wordTimestamps,
    });

    // Save to DB
    try {
      saveSession(result, playbackEnabled);
    } catch (dbError) {
      console.error("DB save error:", dbError);
      // Still return results even if save fails
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("STT route error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function computeDrillScore(expected: string, transcript: string): number {
  if (!expected || !transcript) return 0;
  const e = expected.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const t = transcript.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  if (e.length === 0) return transcript.length > 0 ? 50 : 0;

  let matches = 0;
  const tSet = new Set(t);
  for (const word of e) {
    if (tSet.has(word)) matches++;
  }
  return Math.round((matches / e.length) * 100);
}

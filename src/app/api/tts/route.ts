import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/smallest";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const result = await synthesizeSpeech(text);

    return new NextResponse(result.audioData, {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }
}

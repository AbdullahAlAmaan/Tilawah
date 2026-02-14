import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RECORDINGS_DIR = path.join(process.cwd(), "data", "recordings");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    const filePath = path.join(RECORDINGS_DIR, `${sessionId}.webm`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }
    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/webm",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("Recording serve error:", err);
    return NextResponse.json({ error: "Failed to load recording" }, { status: 500 });
  }
}

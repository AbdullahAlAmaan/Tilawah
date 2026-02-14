import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (err) {
    console.error("Get session error:", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

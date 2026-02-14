import { NextResponse } from "next/server";
import { listSessions } from "@/lib/storage";

export async function GET() {
  try {
    const sessions = listSessions();
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("List sessions error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const sessionId = (await params).sessionId;

    if (!global.sessionStore || !global.sessionStore[sessionId]) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(global.sessionStore[sessionId]);
}

declare global {
    var sessionStore: Record<string, any>;
}

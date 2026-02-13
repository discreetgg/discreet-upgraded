import { NextRequest, NextResponse } from 'next/server';

/**
 * Best-effort disconnect signal endpoint used by sendBeacon/fetch during
 * page unload/recovery. This prevents client-side 404 noise and gives us
 * a stable hook for future server-side cleanup.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callId =
      body && typeof body.callId === 'string' ? body.callId.trim() : '';

    return NextResponse.json(
      {
        ok: true,
        accepted: Boolean(callId),
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: true,
        accepted: false,
      },
      { status: 202 },
    );
  }
}

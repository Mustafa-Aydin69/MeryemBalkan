export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId gerekli' }, { status: 400 });
    }

    const { rejectSession } = await import('@/app/lib/two-fa-session');
    await rejectSession(sessionId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

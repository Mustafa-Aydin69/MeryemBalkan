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

    const { approveSession } = await import('@/app/lib/two-fa-session');
    const ok = await approveSession(sessionId);

    if (!ok) {
      return NextResponse.json({ error: 'Oturum bulunamadı veya süresi doldu' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

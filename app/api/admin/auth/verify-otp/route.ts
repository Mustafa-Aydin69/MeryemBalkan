export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const otp = typeof body.otp === 'string' ? body.otp.replace(/\D/g, '') : '';

    if (!sessionId || otp.length !== 6) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const { verifySessionOTP } = await import('@/app/lib/two-fa-session');
    const email = await verifySessionOTP(sessionId, otp);

    if (!email) {
      return NextResponse.json({ success: false, error: 'Hatalı kod veya oturum geçersiz' }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

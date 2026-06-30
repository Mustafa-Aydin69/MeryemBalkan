export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Çıkış yapıldı' });

    const {
      WEB_SESSION_COOKIE_NAME,
      LOGIN_NONCE_COOKIE_NAME,
      revokeWebSession,
    } = await import('@/app/lib/web-session');

    const rawToken = request.cookies.get(WEB_SESSION_COOKIE_NAME)?.value;
    if (rawToken) {
      await revokeWebSession(rawToken).catch(() => {});
    }

    const clearOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0,
    };
    response.cookies.set(WEB_SESSION_COOKIE_NAME, '', clearOpts);
    response.cookies.set(LOGIN_NONCE_COOKIE_NAME, '', clearOpts);
    return response;
  } catch (error) {
    console.error('Logout hatası:', error);
    return NextResponse.json({ success: false, message: 'Çıkış yapılamadı' }, { status: 500 });
  }
}

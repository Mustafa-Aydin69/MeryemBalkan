export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ status: 'expired' });
    }

    const { getSession, completeSession } = await import('@/app/lib/two-fa-session');
    const { createAdminJWT } = await import('@/app/lib/jwt-utils');
    const { ADMIN_CONFIG } = await import('@/app/lib/admin-config');

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json({ status: 'expired' });
    }

    const now = new Date().toISOString();
    if (session.expires_at < now) {
      return NextResponse.json({ status: 'expired' });
    }

    if (session.approved && session.verified) {
      const token = await createAdminJWT(session.email);
      await completeSession(sessionId);

      const response = NextResponse.json({ status: 'complete' });
      response.cookies.set(ADMIN_CONFIG.COOKIE.NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: ADMIN_CONFIG.JWT_EXPIRES_IN,
      });
      return response;
    }

    return NextResponse.json({
      status: 'pending',
      approved: session.approved,
    });
  } catch {
    return NextResponse.json({ status: 'expired' });
  }
}

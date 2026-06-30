export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ status: 'expired' });
    }

    const { checkRateLimit, incrementRateLimit, getClientIP } = await import('@/app/lib/rate-limiter');
    const ip = getClientIP(request);
    const rl = await checkRateLimit(sessionId, 'STATUS_POLL', ip);
    if (!rl.allowed) {
      return NextResponse.json({ status: 'rate_limited' }, { status: 429 });
    }
    await incrementRateLimit(sessionId, 'STATUS_POLL', ip);

    const { getLoginChallenge, deleteLoginChallenge } =
      await import('@/app/lib/login-challenge');

    const challenge = await getLoginChallenge(sessionId);
    if (!challenge) return NextResponse.json({ status: 'expired' });

    const now = new Date().toISOString();
    if (challenge.expires_at < now) return NextResponse.json({ status: 'expired' });

    if (challenge.approved) {
      const {
        createWebSession,
        sha256Hex,
        WEB_SESSION_COOKIE_NAME,
        LOGIN_NONCE_COOKIE_NAME,
        SESSION_TTL_SECONDS,
      } = await import('@/app/lib/web-session');
      const { getClientIP } = await import('@/app/lib/rate-limiter');

      const rawNonce = request.cookies.get(LOGIN_NONCE_COOKIE_NAME)?.value ?? '';
      if (!rawNonce) {
        return NextResponse.json(
          { error: 'Tarayıcı doğrulaması başarısız' },
          { status: 403 }
        );
      }

      const incomingNonceHash = await sha256Hex(rawNonce);
      if (incomingNonceHash !== challenge.browser_nonce_hash) {
        return NextResponse.json(
          { error: 'Tarayıcı doğrulaması başarısız' },
          { status: 403 }
        );
      }

      if (!challenge.auth_user_id) {
        return NextResponse.json({ status: 'expired' });
      }

      const rawToken = await createWebSession(
        challenge.auth_user_id,
        challenge.browser_nonce_hash,
        getClientIP(request),
        request.headers.get('user-agent') ?? ''
      );

      await deleteLoginChallenge(sessionId);

      const response = NextResponse.json({ status: 'complete' });
      response.cookies.set(WEB_SESSION_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
      });
      response.cookies.set(LOGIN_NONCE_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    if (challenge.pre_approved) {
      return NextResponse.json({
        status: 'pending',
        pre_approved: true,
        matchCode: challenge.match_code,
      });
    }

    return NextResponse.json({ status: 'pending', pre_approved: false });
  } catch {
    return NextResponse.json({ status: 'expired' });
  }
}

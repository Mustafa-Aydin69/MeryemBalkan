export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    if (process.env.USE_LOGIN_CHALLENGE_FLOW !== 'true') {
      return NextResponse.json({ error: 'Not enabled' }, { status: 400 });
    }

    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId gerekli' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[pre-approve] Bearer token yok');
      return NextResponse.json({ error: 'Unauthorized', reason: 'no_bearer' }, { status: 401 });
    }

    const { verifyBearerToken } = await import('@/app/lib/supabase-auth-verify');
    const claims = await verifyBearerToken(authHeader.slice(7));
    if (!claims) {
      console.error('[pre-approve] verifyBearerToken başarısız');
      return NextResponse.json({ error: 'Unauthorized', reason: 'token_invalid' }, { status: 401 });
    }

    const { getSupabaseAdmin } = await import('@/app/lib/supabaseAdmin');
    const db = getSupabaseAdmin();
    const { data: adminUser, error: adminErr } = await db
      .from('admin_users')
      .select('is_active')
      .eq('auth_user_id', claims.sub)
      .maybeSingle();

    if (adminErr) {
      console.error('[pre-approve] admin_users sorgu hatası:', adminErr.message);
    }

    if (!adminUser?.is_active) {
      console.error('[pre-approve] is_active değil, sub:', claims.sub);
      return NextResponse.json({ error: 'Unauthorized', reason: 'not_admin' }, { status: 401 });
    }

    const { findActiveDevice } = await import('@/app/lib/devices');
    const device = await findActiveDevice(claims.sub, claims.sessionId);
    if (!device) {
      console.error('[pre-approve] cihaz bulunamadı, sub:', claims.sub, 'sessionId:', claims.sessionId);
      return NextResponse.json(
        { error: 'Kayıtlı cihaz bulunamadı', reason: 'no_device' },
        { status: 403 }
      );
    }

    const { preApproveLoginChallenge } = await import('@/app/lib/login-challenge');
    const ok = await preApproveLoginChallenge(sessionId, claims.sub);

    if (!ok) {
      return NextResponse.json(
        { error: 'Challenge bulunamadı veya süresi doldu' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[pre-approve] sunucu hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

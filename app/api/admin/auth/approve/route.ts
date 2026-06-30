export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const submittedMatchCode =
      typeof body.submitted_match_code === 'string' ? body.submitted_match_code.trim() : '';

    if (!sessionId || !submittedMatchCode) {
      return NextResponse.json(
        { error: 'sessionId ve submitted_match_code gerekli' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verifyBearerToken } = await import('@/app/lib/supabase-auth-verify');
    const claims = await verifyBearerToken(authHeader.slice(7));
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getSupabaseAdmin } = await import('@/app/lib/supabaseAdmin');
    const db = getSupabaseAdmin();
    const { data: adminUser } = await db
      .from('admin_users')
      .select('is_active')
      .eq('auth_user_id', claims.sub)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checkRateLimit, incrementRateLimit, getClientIP } = await import('@/app/lib/rate-limiter');
    const ip = getClientIP(request);
    const rl = await checkRateLimit(claims.sub, 'MOBILE_APPROVE', ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Çok fazla deneme', reason: 'rate_limited' }, { status: 429 });
    }
    await incrementRateLimit(claims.sub, 'MOBILE_APPROVE', ip);

    const { findActiveDevice } = await import('@/app/lib/devices');
    const device = await findActiveDevice(claims.sub, claims.sessionId);
    if (!device) {
      return NextResponse.json(
        { error: 'Kayıtlı cihaz bulunamadı', reason: 'no_device' },
        { status: 403 }
      );
    }

    const { approveLoginChallenge } = await import('@/app/lib/login-challenge');
    const result = await approveLoginChallenge(sessionId, claims.sub, submittedMatchCode);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Onay başarısız', reason: result.reason },
        { status: result.reason === 'locked' ? 423 : 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

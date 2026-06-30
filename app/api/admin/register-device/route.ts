export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyBearerToken } from '@/app/lib/supabase-auth-verify';
import { upsertDevice } from '@/app/lib/devices';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token: fcmToken, install_uuid, platform } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwt = authHeader.slice(7);
    const claims = await verifyBearerToken(jwt);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabaseAdmin();
    const { data: adminData } = await db
      .from('admin_users')
      .select('is_active')
      .eq('auth_user_id', claims.sub)
      .single();

    if (!adminData?.is_active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checkRateLimit, incrementRateLimit, getClientIP } = await import('@/app/lib/rate-limiter');
    const ip = getClientIP(request);
    const rl = await checkRateLimit(claims.sub, 'REGISTER_DEVICE', ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    await incrementRateLimit(claims.sub, 'REGISTER_DEVICE', ip);

    await upsertDevice({
      authUserId: claims.sub,
      deviceIdentifier: typeof install_uuid === 'string' && install_uuid ? install_uuid : 'default',
      platform: platform === 'ios' ? 'ios' : 'android',
      fcmToken,
      supabaseSessionId: claims.sessionId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

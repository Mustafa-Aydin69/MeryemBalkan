export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

async function securityDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function POST(request: NextRequest) {
  try {
    const { sanitizeInput, isValidEmail, isWhitelistedEmail } =
      await import('@/app/lib/admin-config');
    const { checkRateLimit, incrementRateLimit, getClientIP } =
      await import('@/app/lib/rate-limiter');
    const { sendLoginApprovalPushToUser } = await import('@/app/lib/fcm-service');
    const { createIsolatedSupabaseClient } = await import('@/app/lib/isolated-supabase');
    const { getSupabaseAdmin } = await import('@/app/lib/supabaseAdmin');

    const ip = getClientIP(request);
    const body = await request.json();
    const email = sanitizeInput(body.email ?? '').toLowerCase();
    const password = sanitizeInput(body.password ?? '');

    if (!isValidEmail(email) || !isWhitelistedEmail(email) || !password) {
      await securityDelay();
      return NextResponse.json({ error: 'Geçersiz bilgiler' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(email, 'LOGIN', ip);
    if (!rateLimit.allowed) {
      await securityDelay();
      return NextResponse.json({ error: 'Çok fazla deneme' }, { status: 429 });
    }
    await incrementRateLimit(email, 'LOGIN', ip);

    // Supabase Auth ile şifre doğrula — izole client, persistSession=false (düzeltme 3)
    const isolatedClient = createIsolatedSupabaseClient();
    const { data: authData, error: authError } =
      await isolatedClient.auth.signInWithPassword({ email, password });

    // Geçici oturumu hemen imha et — orphan session bırakılmaz
    if (authData?.session) {
      await isolatedClient.auth.signOut();
    }

    if (authError || !authData?.user) {
      await securityDelay();
      return NextResponse.json({ error: 'Geçersiz bilgiler' }, { status: 401 });
    }

    const authUserId = authData.user.id;

    // Admin yetkisi ve aktiflik kontrolü
    const db = getSupabaseAdmin();
    const { data: adminData } = await db
      .from('admin_users')
      .select('is_active')
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .is('revoked_at', null)
      .maybeSingle();

    if (!adminData) {
      await securityDelay();
      return NextResponse.json({ error: 'Geçersiz bilgiler' }, { status: 401 });
    }

    const { createLoginChallenge } = await import('@/app/lib/login-challenge');
    const { generateOpaqueToken, sha256Hex, LOGIN_NONCE_COOKIE_NAME } =
      await import('@/app/lib/web-session');

    const rawNonce = generateOpaqueToken();
    const nonceHash = await sha256Hex(rawNonce);

    const { sessionId } = await createLoginChallenge(email, authUserId, ip, nonceHash);

    // match_code payload'da gönderilmez (SEC-T05). Push await edilir:
    // Vercel'de yanıt dönünce lambda donar, await edilmeyen gönderim kaybolur.
    // Hata girişi bloklamaz (catch) — web zaten status polling ile bekler.
    await sendLoginApprovalPushToUser(authUserId, sessionId).catch((err: unknown) =>
      console.error('FCM push hatası:', err)
    );

    const response = NextResponse.json({ sessionId });
    response.cookies.set(LOGIN_NONCE_COOKIE_NAME, rawNonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 5 * 60,
    });

    return response;
  } catch (err) {
    console.error('Login hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

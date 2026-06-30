/**
 * Central admin authentication and rate limiting.
 * - verifyAdminToken: web session cookie or mobile Bearer → payload or null
 * - enforceAdminRateLimit: token + IP rate limit; returns 429 response or null (allowed)
 * Use in all /api/admin/* and destructive endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIP,
} from './rate-limiter';
import { getSupabaseAdmin } from './supabaseAdmin';

export interface AdminJWTPayload {
  email: string;
  role: 'admin';
  otp_verified: boolean;
  iat: number;
  exp: number;
}

/**
 * Verify admin request. Two paths:
 *   1. admin_session cookie → web session lookup + CSRF check
 *   2. Authorization: Bearer → Supabase token + devices chain (mobile app)
 */
export async function verifyAdminToken(request: NextRequest): Promise<AdminJWTPayload | null> {
  const now = Math.floor(Date.now() / 1000);

  // Web session: admin_session cookie
  const { WEB_SESSION_COOKIE_NAME } = await import('./web-session');
  if (request.cookies.get(WEB_SESSION_COOKIE_NAME)?.value) {
    const { checkCsrf } = await import('./csrf');
    if (!checkCsrf(request)) return null;
    const principal = await verifyWebSession(request);
    if (!principal) return null;
    return { email: principal.email, role: 'admin', otp_verified: true, iat: now, exp: now + 28800 };
  }

  // Mobile Bearer token (Flutter admin app)
  if (request.headers.get('authorization')?.startsWith('Bearer ')) {
    const principal = await verifyMobileBearer(request);
    if (!principal) return null;
    return { email: principal.email, role: 'admin', otp_verified: true, iat: now, exp: now + 28800 };
  }

  return null;
}

/**
 * Enforce rate limit for admin API: by token (email) and by IP.
 * Returns NextResponse with 429 if limited, or null if allowed.
 * Call after verifyAdminToken; pass the payload.
 */
export async function enforceAdminRateLimit(
  request: NextRequest,
  payload: AdminJWTPayload
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const email = payload.email;

  const [byUser, byIP] = await Promise.all([
    checkRateLimit(email, 'ADMIN_API', ip),
    checkRateLimit(ip, 'ADMIN_API_IP', ip),
  ]);

  if (!byUser.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfter: byUser.retryAfter },
      { status: 429, headers: byUser.retryAfter ? { 'Retry-After': String(byUser.retryAfter) } : {} }
    );
  }
  if (!byIP.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfter: byIP.retryAfter },
      { status: 429, headers: byIP.retryAfter ? { 'Retry-After': String(byIP.retryAfter) } : {} }
    );
  }

  await Promise.all([
    incrementRateLimit(email, 'ADMIN_API', ip),
    incrementRateLimit(ip, 'ADMIN_API_IP', ip),
  ]);
  return null;
}

// ─────────────────────────────────────────────────────────────
// Yeni kimlik doğrulama fonksiyonları (P0_AUTH_ARCHITECTURE_PLAN §5)
// ─────────────────────────────────────────────────────────────

export interface MobilePrincipal {
  authUserId: string;
  email: string;
}

/**
 * Mobil admin isteklerini doğrular (§5 zorunlu zincir — düzeltme 2, 8).
 *
 * Adımlar:
 *   1. getClaims(jwt) — Supabase resmi API (manuel imza doğrulaması yok).
 *   2. sub (auth_user_id) oku.
 *   3. session_id claim'i oku.
 *   4. devices: auth_user_id=sub AND supabase_session_id=session_id AND revoked_at IS NULL.
 *   5. admin_users: auth_user_id=sub AND is_active=true AND revoked_at IS NULL.
 *
 * Herhangi bir adım başarısız olursa null döner → çağıran 401 döner.
 */
export async function verifyMobileBearer(
  request: NextRequest
): Promise<MobilePrincipal | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice(7).trim();
  if (!jwt) return null;

  // Adım 1–3: token doğrula + claims oku
  const { verifyBearerToken } = await import('./supabase-auth-verify');
  const claims = await verifyBearerToken(jwt);
  if (!claims) return null;

  // Adım 4: aktif cihaz kontrolü (iptalli/bilinmeyen cihaz → ret)
  const { findActiveDevice } = await import('./devices');
  const device = await findActiveDevice(claims.sub, claims.sessionId);
  if (!device) return null;

  // Adım 5: admin yetkisi kontrolü
  const db = getSupabaseAdmin();
  const { data: adminRow, error } = await db
    .from('admin_users')
    .select('email, is_active')
    .eq('auth_user_id', claims.sub)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !adminRow?.is_active) return null;

  return { authUserId: claims.sub, email: adminRow.email };
}

/**
 * Web admin cookie oturumunu doğrular (Faz 5 — web_sessions hash lookup).
 * admin_session cookie → SHA-256 → web_sessions tablosu.
 */
export async function verifyWebSession(
  request: NextRequest
): Promise<MobilePrincipal | null> {
  const { WEB_SESSION_COOKIE_NAME, lookupWebSession } = await import('./web-session');
  const rawToken = request.cookies.get(WEB_SESSION_COOKIE_NAME)?.value ?? '';
  if (!rawToken) return null;
  const result = await lookupWebSession(rawToken);
  if (!result) return null;
  return { authUserId: result.authUserId, email: result.email };
}


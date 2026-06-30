/**
 * supabase-auth-verify.ts
 *
 * Bearer token doğrulama — Supabase resmi API kullanır (düzeltme 8).
 * Manuel JWT decode / imza doğrulaması YAPILMAZ.
 *
 * verifyBearerToken(jwt):
 *   1. getSupabaseAdmin().auth.getUser(jwt) ile Supabase'e imza doğrulattırır.
 *   2. Geçerli ise user.id (= sub / auth_user_id) döner.
 *   3. JWT payload'ından session_id claim'i okunur (base64 decode — imza
 *      doğrulaması değil; imzayı adım 1 zaten doğruladı).
 *
 * KULLANIM KISITI: yalnızca server-side (API routes / lib).
 */

import { getSupabaseAdmin } from './supabaseAdmin';

export interface VerifiedClaims {
  sub: string;       // Supabase auth_user_id (UUID)
  sessionId: string; // Supabase session_id JWT claim'i
}

/**
 * Bearer token'ı Supabase üzerinden doğrular.
 * Geçersiz / süresi dolmuş / imza hatalı tokenlarda null döner.
 */
export async function verifyBearerToken(jwt: string): Promise<VerifiedClaims | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data.user) return null;

  const sessionId = readSessionIdClaim(jwt);
  if (!sessionId) return null;

  return { sub: data.user.id, sessionId };
}

/**
 * JWT payload'ından session_id claim'ini okur.
 * Bu fonksiyon YALNIZCA base64 decode yapar — kriptografik doğrulama
 * verifyBearerToken'daki getUser() çağrısı tarafından zaten yapıldı.
 */
function readSessionIdClaim(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.session_id === 'string' ? payload.session_id : null;
  } catch {
    return null;
  }
}

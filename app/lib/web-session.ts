export const runtime = 'nodejs';

import { getSupabaseAdmin } from './supabaseAdmin';

export const WEB_SESSION_COOKIE_NAME = 'admin_session';
export const LOGIN_NONCE_COOKIE_NAME = 'login_nonce';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 saat

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateOpaqueToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function createWebSession(
  authUserId: string,
  nonceHash: string,
  ip: string,
  userAgent: string
): Promise<string> {
  const rawToken = generateOpaqueToken();
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  const db = getSupabaseAdmin();
  const { error } = await db.from('web_sessions').insert({
    session_token_hash: tokenHash,
    auth_user_id: authUserId,
    browser_nonce_hash: nonceHash,
    ip,
    user_agent: userAgent,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`web_sessions insert hatası: ${error.message}`);
  return rawToken;
}

export async function lookupWebSession(
  rawToken: string
): Promise<{ authUserId: string; email: string } | null> {
  const tokenHash = await sha256Hex(rawToken);
  const db = getSupabaseAdmin();

  const { data: session } = await db
    .from('web_sessions')
    .select('auth_user_id, expires_at, revoked_at')
    .eq('session_token_hash', tokenHash)
    .single();

  if (!session) return null;
  if (session.revoked_at) return null;
  if (session.expires_at < new Date().toISOString()) return null;

  // last_seen_at güncelle (fire-and-forget)
  db.from('web_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('session_token_hash', tokenHash)
    .then(() => {});

  const { data: adminRow } = await db
    .from('admin_users')
    .select('email, is_active')
    .eq('auth_user_id', session.auth_user_id)
    .single();

  if (!adminRow?.is_active) return null;

  return { authUserId: session.auth_user_id, email: adminRow.email };
}

export async function revokeWebSession(rawToken: string): Promise<void> {
  const tokenHash = await sha256Hex(rawToken);
  const db = getSupabaseAdmin();
  await db
    .from('web_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('session_token_hash', tokenHash);
}

export { SESSION_TTL_SECONDS };

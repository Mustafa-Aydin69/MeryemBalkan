import { getSupabaseAdmin } from './supabaseAdmin';

// Güvenlik-kritik tipler Supabase'de (kalıcı, instance'lar-arası ortak).
// STATUS_POLL bilinçli olarak dışarıda — yüksek frekanslı polling, güvenlik yüzeyi değil.
const DB_BACKED_TYPES: RateLimitType[] = [
  'OTP_REQUEST', 'OTP_VERIFY', 'LOGIN',
  'PAYMENT_CREATE', 'PAYMENT_CALLBACK', 'CHECKOUT_CREATE',
  'ADMIN_API', 'ADMIN_API_IP', 'MOBILE_APPROVE',
  'REGISTER_DEVICE', 'COUPON_VALIDATE',
];

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, InMemoryEntry> | undefined;
}

interface InMemoryEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

function getInMemoryStore(): Map<string, InMemoryEntry> {
  if (!global.__rateLimitStore) global.__rateLimitStore = new Map();
  return global.__rateLimitStore;
}

export type RateLimitType =
  | 'OTP_REQUEST' | 'OTP_VERIFY' | 'LOGIN'
  | 'ADMIN_API' | 'ADMIN_API_IP'
  | 'CHECKOUT_CREATE' | 'PAYMENT_CREATE' | 'PAYMENT_CALLBACK'
  | 'MOBILE_APPROVE' | 'STATUS_POLL' | 'REGISTER_DEVICE'
  | 'COUPON_VALIDATE';

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
  retryAfter?: number;
}

function getConfig(type: RateLimitType) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ADMIN_CONFIG } = require('./admin-config');
  return ADMIN_CONFIG.RATE_LIMIT[type];
}

function getLockoutMs(type: RateLimitType, count: number): number {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ADMIN_CONFIG } = require('./admin-config');
  if (type === 'CHECKOUT_CREATE') return 0;
  return count >= ADMIN_CONFIG.LOCKOUT.ATTEMPTS_FOR_1_HOUR
    ? ADMIN_CONFIG.LOCKOUT.LOCKOUT_1_HOUR
    : ADMIN_CONFIG.LOCKOUT.LOCKOUT_15_MIN;
}

// --- Supabase-backed (OTP_REQUEST, OTP_VERIFY, LOGIN) ---

async function checkDB(key: string, type: RateLimitType): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  const config = getConfig(type);
  const now = new Date();

  const { data } = await supabase
    .from('rate_limit_store')
    .select('count, window_start, locked_until')
    .eq('key', key)
    .single();

  if (!data) return { allowed: true, remainingAttempts: config.MAX_ATTEMPTS };

  if (data.locked_until && new Date(data.locked_until) > now) {
    const ms = new Date(data.locked_until).getTime();
    return { allowed: false, remainingAttempts: 0, lockedUntil: ms, retryAfter: Math.ceil((ms - now.getTime()) / 1000) };
  }

  if (new Date(data.window_start).getTime() + config.WINDOW_MS < now.getTime()) {
    return { allowed: true, remainingAttempts: config.MAX_ATTEMPTS };
  }

  if (data.count >= config.MAX_ATTEMPTS) {
    const lockMs = getLockoutMs(type, data.count);
    const lockedUntil = new Date(now.getTime() + lockMs).toISOString();
    await supabase.from('rate_limit_store').update({ locked_until: lockedUntil }).eq('key', key);
    return { allowed: false, remainingAttempts: 0, lockedUntil: now.getTime() + lockMs, retryAfter: Math.ceil(lockMs / 1000) };
  }

  return { allowed: true, remainingAttempts: config.MAX_ATTEMPTS - data.count };
}

async function incrementDB(key: string, type: RateLimitType): Promise<void> {
  const supabase = getSupabaseAdmin();
  const config = getConfig(type);
  // Atomik INSERT ... ON CONFLICT DO UPDATE — lost-update imkânsız (satır kilidi)
  await supabase.rpc('increment_rate_limit', { p_key: key, p_window_ms: config.WINDOW_MS });
}

async function resetDB(key: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('rate_limit_store').delete().eq('key', key);
}

// --- In-memory (ADMIN_API, PAYMENT, vs.) ---

function checkMem(key: string, type: RateLimitType): RateLimitResult {
  const store = getInMemoryStore();
  const config = getConfig(type);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > config.WINDOW_MS) {
    return { allowed: true, remainingAttempts: config.MAX_ATTEMPTS };
  }
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: entry.lockedUntil, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    store.delete(key);
    return { allowed: true, remainingAttempts: config.MAX_ATTEMPTS };
  }
  if (entry.attempts >= config.MAX_ATTEMPTS) {
    const lockMs = getLockoutMs(type, entry.attempts);
    const lockedUntil = now + lockMs;
    store.set(key, { ...entry, lockedUntil });
    return { allowed: false, remainingAttempts: 0, lockedUntil, retryAfter: Math.ceil(lockMs / 1000) };
  }
  return { allowed: true, remainingAttempts: config.MAX_ATTEMPTS - entry.attempts };
}

function incrementMem(key: string, type: RateLimitType): void {
  const store = getInMemoryStore();
  const config = getConfig(type);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.firstAttempt > config.WINDOW_MS) {
    store.set(key, { attempts: 1, firstAttempt: now });
  } else {
    store.set(key, { ...entry, attempts: entry.attempts + 1 });
  }
}

function resetMem(key: string): void {
  getInMemoryStore().delete(key);
}

// --- Public API ---

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType,
  ipAddress?: string
): Promise<RateLimitResult> {
  const key = `${type}:${identifier}:${ipAddress || 'unknown'}`;
  return DB_BACKED_TYPES.includes(type) ? checkDB(key, type) : checkMem(key, type);
}

export async function incrementRateLimit(
  identifier: string,
  type: RateLimitType,
  ipAddress?: string
): Promise<void> {
  const key = `${type}:${identifier}:${ipAddress || 'unknown'}`;
  if (DB_BACKED_TYPES.includes(type)) {
    await incrementDB(key, type);
  } else {
    incrementMem(key, type);
  }
}

export async function resetRateLimit(
  identifier: string,
  type: RateLimitType,
  ipAddress?: string
): Promise<void> {
  const key = `${type}:${identifier}:${ipAddress || 'unknown'}`;
  if (DB_BACKED_TYPES.includes(type)) {
    await resetDB(key);
  } else {
    resetMem(key);
  }
}

export function getClientIP(request: Request): string {
  // Vercel'de güvenilir header (istemci ekleyemez); öncelik sırası:
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) return vercelIP.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  // Son çare — Vercel dışı ortamlarda (local dev, diğer platformlar)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}

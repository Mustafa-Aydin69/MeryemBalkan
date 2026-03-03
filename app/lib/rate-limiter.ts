// In-memory rate limiter (production'da Redis kullanılmalı)
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

// Global store
declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
  // eslint-disable-next-line no-var
  var __rateLimitCleanupInitialized: boolean | undefined;
}

// Lazy initialization
function getRateLimitStore(): Map<string, RateLimitEntry> {
  if (!global.__rateLimitStore) {
    global.__rateLimitStore = new Map<string, RateLimitEntry>();
  }
  return global.__rateLimitStore;
}

// Config'i lazy load et
function getAdminConfig() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ADMIN_CONFIG } = require('./admin-config');
  return ADMIN_CONFIG;
}

// Cleanup interval'ı güvenli şekilde başlat
function initCleanup() {
  if (typeof global !== 'undefined' && !global.__rateLimitCleanupInitialized) {
    global.__rateLimitCleanupInitialized = true;
    
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        try {
          const rateLimitStore = getRateLimitStore();
          const now = Date.now();
          
          for (const [key, entry] of rateLimitStore.entries()) {
            if (now - entry.firstAttempt > 2 * 60 * 60 * 1000) {
              rateLimitStore.delete(key);
            }
          }
        } catch {
          // Build time'da hata olursa sessizce geç
        }
      }, 60 * 1000);
    }
  }
}

export type RateLimitType = 'OTP_REQUEST' | 'OTP_VERIFY' | 'LOGIN' | 'ADMIN_API' | 'ADMIN_API_IP' | 'CHECKOUT_CREATE';

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  type: RateLimitType,
  ipAddress?: string
): RateLimitResult {
  initCleanup();
  
  const rateLimitStore = getRateLimitStore();
  const ADMIN_CONFIG = getAdminConfig();
  const config = ADMIN_CONFIG.RATE_LIMIT[type];
  const now = Date.now();
  
  const key = `${type}:${identifier}:${ipAddress || 'unknown'}`;
  
  let entry = rateLimitStore.get(key);
  
  // Yeni kayıt veya süre dolmuş
  if (!entry || (now - entry.firstAttempt > config.WINDOW_MS)) {
    entry = {
      attempts: 0,
      firstAttempt: now,
    };
  }
  
  // Lockout kontrolü
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }
  
  // Lockout süresi dolmuşsa sıfırla
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry = {
      attempts: 0,
      firstAttempt: now,
    };
  }
  
  // Limit kontrolü
  if (entry.attempts >= config.MAX_ATTEMPTS) {
    // CHECKOUT_CREATE: kilidi pencerenin bitişine kadar (yeniden deneme penceresi sonunda)
    const isCheckoutCreate = type === 'CHECKOUT_CREATE';
    const lockoutDuration = isCheckoutCreate
      ? Math.max(0, entry.firstAttempt + config.WINDOW_MS - now)
      : entry.attempts >= ADMIN_CONFIG.LOCKOUT.ATTEMPTS_FOR_1_HOUR
        ? ADMIN_CONFIG.LOCKOUT.LOCKOUT_1_HOUR
        : ADMIN_CONFIG.LOCKOUT.LOCKOUT_15_MIN;
    
    entry.lockedUntil = now + lockoutDuration;
    rateLimitStore.set(key, entry);
    
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil(lockoutDuration / 1000),
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: config.MAX_ATTEMPTS - entry.attempts,
  };
}

export function incrementRateLimit(
  identifier: string,
  type: RateLimitType,
  ipAddress?: string
): void {
  const rateLimitStore = getRateLimitStore();
  const key = `${type}:${identifier}:${ipAddress || 'unknown'}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = {
      attempts: 1,
      firstAttempt: now,
    };
  } else {
    entry.attempts++;
  }
  
  rateLimitStore.set(key, entry);
}

export function resetRateLimit(
  identifier: string,
  type: RateLimitType,
  ipAddress?: string
): void {
  const rateLimitStore = getRateLimitStore();
  const key = `${type}:${identifier}:${ipAddress || 'unknown'}`;
  rateLimitStore.delete(key);
}

// IP adresi alma yardımcı fonksiyonu
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

import { ADMIN_CONFIG } from './admin-config';

// In-memory rate limiter (production'da Redis kullanılmalı)
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Store'u temizle (memory leak önlemi)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // 2 saatten eski kayıtları temizle
    if (now - entry.firstAttempt > 2 * 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Her dakika temizle

export type RateLimitType = 'OTP_REQUEST' | 'OTP_VERIFY' | 'LOGIN';

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
  const config = ADMIN_CONFIG.RATE_LIMIT[type];
  const now = Date.now();
  
  // IP + identifier kombinasyonu için key oluştur
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
    // Lockout uygula
    let lockoutDuration = ADMIN_CONFIG.LOCKOUT.LOCKOUT_15_MIN;
    
    if (entry.attempts >= ADMIN_CONFIG.LOCKOUT.ATTEMPTS_FOR_1_HOUR) {
      lockoutDuration = ADMIN_CONFIG.LOCKOUT.LOCKOUT_1_HOUR;
    }
    
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


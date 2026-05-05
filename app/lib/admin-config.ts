// Admin Configuration - Güvenlik Ayarları
// Bu dosyadaki değerleri .env dosyasında tanımlayın
// Secrets: getAdminJWTSecret() from secure-config (mandatory in production)

import { getAdminJWTSecret } from './secure-config';

export const ADMIN_CONFIG = {
  // Whitelist admin e-postaları (sadece bu adresler OTP alabilir)
  WHITELIST_EMAILS: (process.env.ADMIN_WHITELIST_EMAILS || '').split(',').filter(Boolean),

  // JWT ayarları - secret from secure-config (throws in production if missing)
  get JWT_SECRET(): string {
    return getAdminJWTSecret();
  },
  JWT_EXPIRES_IN: 15 * 60, // 15 dakika (saniye cinsinden)
  
  // Rate limiting ayarları
  RATE_LIMIT: {
    OTP_REQUEST: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 10 * 60 * 1000, // 10 dakika
    },
    OTP_VERIFY: {
      MAX_ATTEMPTS: 3,
      WINDOW_MS: 5 * 60 * 1000, // 5 dakika
    },
    LOGIN: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 10 * 60 * 1000, // 10 dakika
    },
    ADMIN_API: {
      MAX_ATTEMPTS: 300,
      WINDOW_MS: 60 * 1000, // 1 dakikada 300 istek (token bazlı)
    },
    ADMIN_API_IP: {
      MAX_ATTEMPTS: 600,
      WINDOW_MS: 60 * 1000, // 1 dakikada 600 istek (IP bazlı)
    },
    CHECKOUT_CREATE: {
      MAX_ATTEMPTS: 10,
      WINDOW_MS: 5 * 60 * 1000, // 5 dakikada en fazla 10 istek (IP bazlı)
    },
    PAYMENT_CREATE: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 60 * 1000, // 1 dakikada en fazla 5 istek (IP bazlı)
    },
    PAYMENT_CALLBACK: {
      MAX_ATTEMPTS: 30,
      WINDOW_MS: 60 * 1000, // 1 dakikada en fazla 30 istek (IP bazlı)
    },
  },
  
  // Lockout ayarları
  LOCKOUT: {
    ATTEMPTS_FOR_15_MIN: 3,
    ATTEMPTS_FOR_1_HOUR: 5,
    LOCKOUT_15_MIN: 15 * 60 * 1000, // 15 dakika
    LOCKOUT_1_HOUR: 60 * 60 * 1000, // 1 saat
  },
  
  // OTP ayarları
  OTP: {
    LENGTH: 6,
    EXPIRES_IN: 5 * 60 * 1000, // 5 dakika
  },
  
  // Cookie ayarları
  COOKIE: {
    NAME: 'admin_token',
    OPTIONS: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 15 * 60, // 15 dakika
    },
  },
};

// Email validation regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 255);
}

// OTP validation
export function isValidOTP(otp: string): boolean {
  if (typeof otp !== 'string') return false;
  const sanitized = otp.replace(/\D/g, '');
  return sanitized.length === ADMIN_CONFIG.OTP.LENGTH && /^\d+$/.test(sanitized);
}

// Email validation
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const sanitized = sanitizeInput(email).toLowerCase();
  return EMAIL_REGEX.test(sanitized) && sanitized.length <= 254;
}

// Whitelist check
export function isWhitelistedEmail(email: string): boolean {
  const sanitizedEmail = sanitizeInput(email).toLowerCase();
  return ADMIN_CONFIG.WHITELIST_EMAILS.some(
    (whitelisted) => whitelisted.toLowerCase() === sanitizedEmail
  );
}

// Güvenli hata mesajı (aynı mesaj her durumda)
export const GENERIC_ERROR_MESSAGE = "İşleminiz değerlendiriliyor. Yetkiniz varsa bilgilendirileceksiniz.";
export const GENERIC_SUCCESS_MESSAGE = "İşleminiz değerlendiriliyor. Yetkiniz varsa bilgilendirileceksiniz.";


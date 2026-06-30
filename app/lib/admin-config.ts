// Admin Configuration - Güvenlik Ayarları

export const ADMIN_CONFIG = {
  WHITELIST_EMAILS: (process.env.ADMIN_WHITELIST_EMAILS || '').split(',').filter(Boolean),

  RATE_LIMIT: {
    OTP_REQUEST: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 10 * 60 * 1000, // 10 dakika
    },
    OTP_VERIFY: {
      MAX_ATTEMPTS: 5,
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
      WINDOW_MS: 5 * 60 * 1000, // 5 dakikada en fazla 10 istek
    },
    PAYMENT_CREATE: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 60 * 1000, // 1 dakikada en fazla 5 istek
    },
    PAYMENT_CALLBACK: {
      MAX_ATTEMPTS: 30,
      WINDOW_MS: 60 * 1000, // 1 dakikada en fazla 30 istek
    },
    MOBILE_APPROVE: {
      MAX_ATTEMPTS: 10,
      WINDOW_MS: 60 * 1000, // 1 dakikada 10 approve/reject (auth_user_id bazlı)
    },
    STATUS_POLL: {
      MAX_ATTEMPTS: 150,
      WINDOW_MS: 60 * 1000, // 1 dakikada 150 poll (session_id + IP)
    },
    REGISTER_DEVICE: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 60 * 60 * 1000, // 1 saatte 5 kayıt (auth_user_id bazlı)
    },
    COUPON_VALIDATE: {
      MAX_ATTEMPTS: 20,
      WINDOW_MS: 60 * 1000, // 1 dakikada en fazla 20 istek (brute-force engeli)
    },
  },

  LOCKOUT: {
    ATTEMPTS_FOR_15_MIN: 3,
    ATTEMPTS_FOR_1_HOUR: 5,
    LOCKOUT_15_MIN: 15 * 60 * 1000, // 15 dakika
    LOCKOUT_1_HOUR: 60 * 60 * 1000, // 1 saat
  },
};

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 255);
}

export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const sanitized = sanitizeInput(email).toLowerCase();
  return EMAIL_REGEX.test(sanitized) && sanitized.length <= 254;
}

export function isWhitelistedEmail(email: string): boolean {
  const sanitizedEmail = sanitizeInput(email).toLowerCase();
  return ADMIN_CONFIG.WHITELIST_EMAILS.some(
    (whitelisted) => whitelisted.toLowerCase() === sanitizedEmail
  );
}

export const GENERIC_ERROR_MESSAGE = "İşleminiz değerlendiriliyor. Yetkiniz varsa bilgilendirileceksiniz.";
export const GENERIC_SUCCESS_MESSAGE = "İşleminiz değerlendiriliyor. Yetkiniz varsa bilgilendirileceksiniz.";

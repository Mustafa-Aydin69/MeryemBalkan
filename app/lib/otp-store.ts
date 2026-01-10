// In-memory OTP store (production'da Redis kullanılmalı)
interface OTPEntry {
  code: string;
  email: string;
  createdAt: number;
  verified: boolean;
}

// Global store - Next.js hot reload'da korunması için
declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OTPEntry> | undefined;
  // eslint-disable-next-line no-var
  var __verificationTokenStore: Map<string, { email: string; createdAt: number }> | undefined;
  // eslint-disable-next-line no-var
  var __otpCleanupInitialized: boolean | undefined;
}

// Lazy initialization - sadece runtime'da çalışır
function getOTPStore(): Map<string, OTPEntry> {
  if (!global.__otpStore) {
    global.__otpStore = new Map<string, OTPEntry>();
  }
  return global.__otpStore;
}

function getVerificationTokenStore(): Map<string, { email: string; createdAt: number }> {
  if (!global.__verificationTokenStore) {
    global.__verificationTokenStore = new Map<string, { email: string; createdAt: number }>();
  }
  return global.__verificationTokenStore;
}

// Config'i lazy load et (build time'da çalışmasın)
function getOTPConfig() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ADMIN_CONFIG } = require('./admin-config');
  return ADMIN_CONFIG.OTP;
}

// Cleanup interval'ı güvenli şekilde başlat (sadece runtime'da)
function initCleanup() {
  if (typeof global !== 'undefined' && !global.__otpCleanupInitialized) {
    global.__otpCleanupInitialized = true;
    
    // Sadece server-side'da çalışsın
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        try {
          const otpStore = getOTPStore();
          const config = getOTPConfig();
          const now = Date.now();
          
          for (const [key, entry] of otpStore.entries()) {
            if (now - entry.createdAt > config.EXPIRES_IN * 2) {
              otpStore.delete(key);
            }
          }
        } catch {
          // Build time'da hata olursa sessizce geç
        }
      }, 60 * 1000);
    }
  }
}

// Güvenli rastgele OTP oluştur
export function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000 + 100000).toString();
  return otp;
}

// OTP kaydet
export function storeOTP(email: string, code: string): void {
  initCleanup();
  const otpStore = getOTPStore();
  const key = email.toLowerCase();
  
  otpStore.set(key, {
    code,
    email: key,
    createdAt: Date.now(),
    verified: false,
  });
}

// OTP doğrula
export function verifyOTP(email: string, code: string): boolean {
  const otpStore = getOTPStore();
  const config = getOTPConfig();
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  
  if (!entry) {
    return false;
  }
  
  // Süre kontrolü
  if (Date.now() - entry.createdAt > config.EXPIRES_IN) {
    otpStore.delete(key);
    return false;
  }
  
  // Kod kontrolü
  if (entry.code !== code) {
    return false;
  }
  
  // Zaten doğrulanmış mı?
  if (entry.verified) {
    return false;
  }
  
  // Doğrulama başarılı - işaretle
  entry.verified = true;
  otpStore.set(key, entry);
  
  return true;
}

// OTP doğrulama durumunu kontrol et
export function isOTPVerified(email: string): boolean {
  const otpStore = getOTPStore();
  const config = getOTPConfig();
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  
  if (!entry) {
    return false;
  }
  
  // Süre kontrolü
  if (Date.now() - entry.createdAt > config.EXPIRES_IN) {
    otpStore.delete(key);
    return false;
  }
  
  return entry.verified;
}

// OTP temizle
export function clearOTP(email: string): void {
  const otpStore = getOTPStore();
  const key = email.toLowerCase();
  otpStore.delete(key);
}

// Doğrulama session token oluştur (OTP doğrulandıktan sonra şifre adımı için)
export function createVerificationToken(email: string): string {
  initCleanup();
  const verificationTokenStore = getVerificationTokenStore();
  
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  verificationTokenStore.set(token, {
    email: email.toLowerCase(),
    createdAt: Date.now(),
  });
  
  return token;
}

export function validateVerificationToken(token: string): string | null {
  const verificationTokenStore = getVerificationTokenStore();
  const entry = verificationTokenStore.get(token);
  
  if (!entry) {
    return null;
  }
  
  // 10 dakika geçerlilik
  if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
    verificationTokenStore.delete(token);
    return null;
  }
  
  return entry.email;
}

export function clearVerificationToken(token: string): void {
  const verificationTokenStore = getVerificationTokenStore();
  verificationTokenStore.delete(token);
}

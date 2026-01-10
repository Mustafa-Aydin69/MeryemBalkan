import { ADMIN_CONFIG } from './admin-config';

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
}

const otpStore = global.__otpStore || new Map<string, OTPEntry>();
global.__otpStore = otpStore;

// Store'u temizle (memory leak önlemi)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    // Süresi dolmuş OTP'leri temizle
    if (now - entry.createdAt > ADMIN_CONFIG.OTP.EXPIRES_IN * 2) {
      otpStore.delete(key);
    }
  }
}, 60 * 1000); // Her dakika temizle

// Güvenli rastgele OTP oluştur
export function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000 + 100000).toString();
  return otp;
}

// OTP kaydet
export function storeOTP(email: string, code: string): void {
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
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  
  if (!entry) {
    return false;
  }
  
  // Süre kontrolü
  if (Date.now() - entry.createdAt > ADMIN_CONFIG.OTP.EXPIRES_IN) {
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
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  
  if (!entry) {
    return false;
  }
  
  // Süre kontrolü
  if (Date.now() - entry.createdAt > ADMIN_CONFIG.OTP.EXPIRES_IN) {
    otpStore.delete(key);
    return false;
  }
  
  return entry.verified;
}

// OTP temizle
export function clearOTP(email: string): void {
  const key = email.toLowerCase();
  otpStore.delete(key);
}

// Doğrulama session token oluştur (OTP doğrulandıktan sonra şifre adımı için)
const verificationTokenStore = global.__verificationTokenStore || new Map<string, { email: string; createdAt: number }>();
global.__verificationTokenStore = verificationTokenStore;

export function createVerificationToken(email: string): string {
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
  verificationTokenStore.delete(token);
}


import { ADMIN_CONFIG } from './admin-config';

// Base64 encoding/decoding için yardımcı fonksiyonlar (Edge Runtime uyumlu)
function base64UrlEncode(str: string): string {
  // btoa kullan (Edge Runtime ve Node.js 16+ uyumlu)
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

// HMAC-SHA256 imza oluşturma
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

export interface AdminJWTPayload {
  email: string;
  role: 'admin';
  otp_verified: boolean;
  iat: number;
  exp: number;
}

// JWT oluşturma
export async function createAdminJWT(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const payload: AdminJWTPayload = {
    email,
    role: 'admin',
    otp_verified: true,
    iat: now,
    exp: now + ADMIN_CONFIG.JWT_EXPIRES_IN,
  };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await createSignature(`${headerEncoded}.${payloadEncoded}`, ADMIN_CONFIG.JWT_SECRET);
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// JWT doğrulama
export async function verifyAdminJWT(token: string): Promise<AdminJWTPayload | null> {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [headerEncoded, payloadEncoded, signatureProvided] = parts;
    
    // İmzayı doğrula
    const expectedSignature = await createSignature(`${headerEncoded}.${payloadEncoded}`, ADMIN_CONFIG.JWT_SECRET);
    
    if (signatureProvided !== expectedSignature) {
      return null;
    }
    
    // Payload'ı parse et
    const payload: AdminJWTPayload = JSON.parse(base64UrlDecode(payloadEncoded));
    
    // Süre kontrolü
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
    
    // Role kontrolü
    if (payload.role !== 'admin') {
      return null;
    }
    
    // OTP doğrulama kontrolü
    if (!payload.otp_verified) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Cookie'den JWT al
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[ADMIN_CONFIG.COOKIE.NAME] || null;
}


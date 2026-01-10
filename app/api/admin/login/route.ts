import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_CONFIG,
  sanitizeInput,
  isWhitelistedEmail,
  GENERIC_SUCCESS_MESSAGE,
} from '@/app/lib/admin-config';
import {
  checkRateLimit,
  incrementRateLimit,
  resetRateLimit,
  getClientIP,
} from '@/app/lib/rate-limiter';
import { validateVerificationToken, clearVerificationToken, clearOTP } from '@/app/lib/otp-store';
import { createAdminJWT } from '@/app/lib/jwt-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Güvenlik gecikmesi
async function securityDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Şifre hashleme (basit - production'da bcrypt kullanın)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.ADMIN_PASSWORD_SALT || 'salt'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// POST: Admin login (şifre ile)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json();
    
    const verificationToken = sanitizeInput(body.verificationToken || '');
    const password = sanitizeInput(body.password || '');

    // Verification token kontrolü
    const email = validateVerificationToken(verificationToken);
    
    if (!email) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Whitelist kontrolü
    if (!isWhitelistedEmail(email)) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Rate limit kontrolü
    const rateLimit = checkRateLimit(email, 'LOGIN', ip);
    if (!rateLimit.allowed) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Denemeyi kaydet
    incrementRateLimit(email, 'LOGIN', ip);

    // Şifre kontrolü - Supabase'den admin şifresini al
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('email', email)
      .single();

    if (adminError || !adminData) {
      // Admin bulunamadı - ama bunu belli etme
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Şifre hash kontrolü
    const passwordHash = await hashPassword(password);
    
    if (passwordHash !== adminData.password_hash) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Başarılı giriş - JWT oluştur
    const token = await createAdminJWT(email);

    // Token'ları temizle
    clearVerificationToken(verificationToken);
    clearOTP(email);
    resetRateLimit(email, 'LOGIN', ip);
    
    // Response oluştur
    const response = NextResponse.json(
      { success: true, message: 'Giriş başarılı' },
      { status: 200 }
    );

    // HttpOnly cookie olarak token'ı set et
    response.cookies.set(ADMIN_CONFIG.COOKIE.NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ADMIN_CONFIG.JWT_EXPIRES_IN,
    });

    return response;
  } catch (error) {
    console.error('Login hatası:', error);
    await securityDelay();
    return NextResponse.json(
      { success: false, message: GENERIC_SUCCESS_MESSAGE },
      { status: 200 }
    );
  }
}


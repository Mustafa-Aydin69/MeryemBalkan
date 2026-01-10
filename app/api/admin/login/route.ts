// Render uyumluluğu için Node.js runtime ve dynamic rendering zorla
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy import - build time'da çalıştırılmaz
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance as SupabaseClient;
}

// Güvenlik gecikmesi
async function securityDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Şifre hashleme (Web Crypto API kullanır - Node.js uyumlu)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = process.env.ADMIN_PASSWORD_SALT || 'default-salt';
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// POST: Admin login (şifre ile)
export async function POST(request: NextRequest) {
  try {
    // Runtime'da import - build time'da çalıştırılmaz
    const {
      ADMIN_CONFIG,
      sanitizeInput,
      isWhitelistedEmail,
      GENERIC_SUCCESS_MESSAGE,
    } = await import('@/app/lib/admin-config');
    
    const {
      checkRateLimit,
      incrementRateLimit,
      resetRateLimit,
      getClientIP,
    } = await import('@/app/lib/rate-limiter');
    
    const { 
      validateVerificationToken, 
      clearVerificationToken, 
      clearOTP 
    } = await import('@/app/lib/otp-store');
    
    const { createAdminJWT } = await import('@/app/lib/jwt-utils');

    const supabase = getSupabase();
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
    return NextResponse.json(
      { success: false, message: 'İşlem tamamlandı' },
      { status: 200 }
    );
  }
}

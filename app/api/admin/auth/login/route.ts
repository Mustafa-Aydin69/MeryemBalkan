export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

async function hashPassword(password: string): Promise<string> {
  const { getAdminPasswordSalt } = await import('@/app/lib/secure-config');
  const encoder = new TextEncoder();
  const salt = getAdminPasswordSalt();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function securityDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function POST(request: NextRequest) {
  try {
    const { sanitizeInput, isValidEmail, isWhitelistedEmail } =
      await import('@/app/lib/admin-config');
    const { checkRateLimit, incrementRateLimit, getClientIP } =
      await import('@/app/lib/rate-limiter');
    const { createTwoFASession, getDeviceFcmToken } =
      await import('@/app/lib/two-fa-session');
    const { generateSecureOTP } = await import('@/app/lib/otp-store');
    const { sendLoginApprovalPush } = await import('@/app/lib/fcm-service');

    const ip = getClientIP(request);
    const body = await request.json();
    const email = sanitizeInput(body.email ?? '').toLowerCase();
    const password = sanitizeInput(body.password ?? '');

    if (!isValidEmail(email) || !isWhitelistedEmail(email) || !password) {
      await securityDelay();
      return NextResponse.json({ error: 'Geçersiz bilgiler' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(email, 'LOGIN', ip);
    if (!rateLimit.allowed) {
      await securityDelay();
      return NextResponse.json({ error: 'Çok fazla deneme' }, { status: 429 });
    }
    await incrementRateLimit(email, 'LOGIN', ip);

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('email', email)
      .single();

    if (!adminData) {
      await securityDelay();
      return NextResponse.json({ error: 'Geçersiz bilgiler' }, { status: 401 });
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== adminData.password_hash) {
      await securityDelay();
      return NextResponse.json({ error: 'Geçersiz bilgiler' }, { status: 401 });
    }

    const otp = generateSecureOTP();
    const sessionId = await createTwoFASession(email, otp);

    const fcmToken = await getDeviceFcmToken();

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    const tasks: Promise<unknown>[] = [
      transporter
        .sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Admin Panel — Doğrulama Kodu',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#333">Admin Panel Girişi</h2>
              <p>Telefon uygulamasına gireceğiniz doğrulama kodunuz:</p>
              <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:10px;margin:20px 0">
                ${otp}
              </div>
              <p style="color:#666;font-size:14px">Bu kod 5 dakika geçerlidir.</p>
              <p style="color:#666;font-size:14px">Bu isteği siz başlatmadıysanız bu maili görmezden gelin.</p>
            </div>
          `,
        })
        .catch((err: unknown) => console.error('OTP mail hatası:', err)),
    ];

    if (fcmToken) {
      tasks.push(
        sendLoginApprovalPush(fcmToken, sessionId).catch((err: unknown) =>
          console.error('FCM push hatası:', err)
        )
      );
    } else {
      console.warn('FCM token bulunamadı — push bildirimi gönderilemedi');
    }

    await Promise.all(tasks);

    return NextResponse.json({ sessionId });
  } catch (err) {
    console.error('2FA login hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

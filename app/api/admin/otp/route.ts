// Render uyumluluğu için Node.js runtime ve dynamic rendering zorla
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

// Nodemailer transporter — modül seviyesinde bir kez oluşturulur, bağlantı havuzlanır
let _transporter: any = null;
function getMailTransporter() {
  if (!_transporter) {
    const nodemailer = require('nodemailer');
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true,
    });
  }
  return _transporter;
}

// Güvenlik gecikmesi (timing attack önlemi)
async function securityDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// POST: OTP gönder
export async function POST(request: NextRequest) {
  try {
    // Runtime'da import - build time'da çalıştırılmaz
    const {
      sanitizeInput,
      isValidEmail,
      isWhitelistedEmail,
      GENERIC_SUCCESS_MESSAGE,
    } = await import('@/app/lib/admin-config');
    
    const {
      checkRateLimit,
      incrementRateLimit,
      getClientIP,
    } = await import('@/app/lib/rate-limiter');
    
    const {
      generateSecureOTP,
      storeOTP,
    } = await import('@/app/lib/otp-store');

    const ip = getClientIP(request);
    const body = await request.json();
    const email = sanitizeInput(body.email || '').toLowerCase();

    // Email validation
    if (!isValidEmail(email)) {
      await securityDelay();
      return NextResponse.json(
        { message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Rate limit kontrolü
    const rateLimit = checkRateLimit(email, 'OTP_REQUEST', ip);
    if (!rateLimit.allowed) {
      await securityDelay();
      return NextResponse.json(
        { message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Denemeyi kaydet
    incrementRateLimit(email, 'OTP_REQUEST', ip);

    // Whitelist kontrolü (sessizce başarısız ol)
    if (!isWhitelistedEmail(email)) {
      await securityDelay();
      return NextResponse.json(
        { message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // OTP oluştur
    const otp = generateSecureOTP();
    storeOTP(email, otp);

    // E-posta gönderimi ve güvenlik gecikmesini paralel çalıştır
    await Promise.all([
      getMailTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Yetkili Erişim Doğrulama Kodu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Yetkili Erişim Doğrulama</h2>
            <p>Doğrulama kodunuz:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">Bu kod 5 dakika içinde geçerliliğini yitirecektir.</p>
            <p style="color: #666; font-size: 14px;">Bu işlemi siz yapmadıysanız bu e-postayı görmezden gelin.</p>
          </div>
        `,
      }).catch((emailError: unknown) => {
        console.error('Email gönderme hatası:', emailError);
      }),
      securityDelay(),
    ]);
    return NextResponse.json(
      { message: GENERIC_SUCCESS_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP API hatası:', error);
    return NextResponse.json(
      { message: 'İşlem tamamlandı' },
      { status: 200 }
    );
  }
}

// PUT: OTP doğrula
export async function PUT(request: NextRequest) {
  try {
    // Runtime'da import
    const {
      sanitizeInput,
      isValidEmail,
      isValidOTP,
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
      verifyOTP,
      createVerificationToken,
    } = await import('@/app/lib/otp-store');

    const ip = getClientIP(request);
    const body = await request.json();
    const email = sanitizeInput(body.email || '').toLowerCase();
    const code = sanitizeInput(body.code || '');

    // Validation
    if (!isValidEmail(email) || !isValidOTP(code)) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Rate limit kontrolü
    const rateLimit = checkRateLimit(email, 'OTP_VERIFY', ip);
    if (!rateLimit.allowed) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Denemeyi kaydet
    incrementRateLimit(email, 'OTP_VERIFY', ip);

    // Whitelist kontrolü
    if (!isWhitelistedEmail(email)) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // OTP doğrula
    const isValid = verifyOTP(email, code);
    
    if (!isValid) {
      await securityDelay();
      return NextResponse.json(
        { success: false, message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
      );
    }

    // Başarılı - verification token oluştur
    const verificationToken = createVerificationToken(email);
    
    // Rate limit sıfırla
    resetRateLimit(email, 'OTP_VERIFY', ip);
    resetRateLimit(email, 'OTP_REQUEST', ip);

    await securityDelay();
    return NextResponse.json(
      { 
        success: true, 
        verificationToken,
        message: 'Doğrulama başarılı' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP doğrulama hatası:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem tamamlandı' },
      { status: 200 }
    );
  }
}

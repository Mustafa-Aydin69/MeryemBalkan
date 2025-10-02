// app/api/send-verification/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Geçici kod saklama (production'da database kullanın)
const verificationCodes = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 6 haneli kod üretme
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email template
function createEmailTemplate(code) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background-color: #f5f5f5; 
          margin: 0; 
          padding: 20px; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white; 
          padding: 40px; 
          border-radius: 10px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #333; 
          letter-spacing: 3px;
          font-family: serif;
          font-style: italic;
        }
        .code { 
          font-size: 36px; 
          font-weight: bold; 
          color: #000; 
          text-align: center; 
          background-color: #f8f8f8; 
          padding: 20px; 
          border-radius: 8px; 
          letter-spacing: 8px;
          margin: 30px 0;
        }
        .message { 
          text-align: center; 
          color: #666; 
          line-height: 1.6;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #eee; 
          color: #999; 
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MERYEM BALKAN</div>
        </div>
        
        <div class="message">
          <h2 style="color: #333; margin-bottom: 20px;">Doğrulama Kodu</h2>
          <p>Hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
        </div>

        <div class="code">${code}</div>

        <div class="message">
          <p>Bu kod 10 dakika süreyle geçerlidir.</p>
          <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        </div>

        <div class="footer">
          <p>© 2025 Meryem Balkan. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Email validasyonu
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-posta adresi gereklidir.' },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi giriniz.' },
        { status: 400 }
      );
    }

    // Kod üret
    const verificationCode = generateVerificationCode();
    
    // Kodu geçici olarak sakla (10 dakika)
    verificationCodes.set(email, {
      code: verificationCode,
      timestamp: Date.now(),
      attempts: 0
    });

    // 10 dakika sonra kodu sil
    setTimeout(() => {
      verificationCodes.delete(email);
    }, 10 * 60 * 1000);

    // Email gönder
    const mailOptions = {
      from: {
        name: 'Meryem Balkan',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Doğrulama Kodu - Meryem Balkan',
      html: createEmailTemplate(verificationCode)
    };

    await transporter.sendMail(mailOptions);

    console.log(`Verification code sent to ${email}: ${verificationCode}`);

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu e-posta adresinize gönderildi.',
      expiresIn: 600
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { success: false, error: 'E-posta gönderilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// Kodu doğrulama için GET metodu da ekleyelim
export async function PUT(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'E-posta ve kod gereklidir.' },
        { status: 400 }
      );
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu bulunamadı veya süresi dolmuş.' },
        { status: 400 }
      );
    }

    // Çok fazla deneme kontrolü
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { success: false, error: 'Çok fazla yanlış deneme. Yeni kod isteyiniz.' },
        { status: 400 }
      );
    }

    // Kod kontrolü
    if (storedData.code !== code) {
      storedData.attempts++;
      return NextResponse.json(
        { success: false, error: `Yanlış kod. ${3 - storedData.attempts} hakkınız kaldı.` },
        { status: 400 }
      );
    }

    // Başarılı doğrulama
    verificationCodes.delete(email);
    return NextResponse.json({
      success: true,
      message: 'Doğrulama başarılı!'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Doğrulama sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
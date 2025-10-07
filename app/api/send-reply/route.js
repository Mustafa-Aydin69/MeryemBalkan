import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function createReplyEmailTemplate(customerName, replyMessage, originalMessage, serviceType) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9f9f9; 
          margin: 0; 
          padding: 20px; 
        }
        .container { 
          max-width: 650px; 
          margin: 0 auto; 
          background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
          border-radius: 12px; 
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header { 
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo { 
          font-size: 28px; 
          font-weight: 300; 
          color: #ffffff; 
          letter-spacing: 6px;
          font-family: 'Georgia', serif;
          font-style: italic;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .subtitle {
          color: #ecf0f1;
          font-size: 13px;
          letter-spacing: 2px;
          margin-top: 8px;
          font-weight: 300;
        }
        .content { 
          padding: 40px 35px;
        }
        .greeting {
          font-size: 22px;
          color: #2c3e50;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .reply-box {
          background-color: #f8f9fa;
          border-left: 4px solid #3498db;
          padding: 25px;
          margin: 25px 0;
          border-radius: 4px;
          line-height: 1.8;
          color: #34495e;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #ddd, transparent);
          margin: 35px 0;
        }
        .original-message {
          background-color: #ffffff;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }
        .original-header {
          font-size: 12px;
          color: #95a5a6;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .original-text {
          color: #7f8c8d;
          font-size: 14px;
          line-height: 1.6;
          font-style: italic;
        }
        .service-badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 10px;
          font-weight: 600;
        }
        .footer { 
          background-color: #2c3e50;
          padding: 30px;
          text-align: center;
        }
        .footer-logo {
          color: #ecf0f1;
          font-size: 16px;
          letter-spacing: 3px;
          font-family: 'Georgia', serif;
          font-style: italic;
          margin-bottom: 15px;
        }
        .footer-text {
          color: #95a5a6;
          font-size: 12px;
          line-height: 1.6;
          margin: 5px 0;
        }
        .contact-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #34495e;
        }
        .contact-link {
          color: #3498db;
          text-decoration: none;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">MERYEM BALKAN</h1>
          <div class="subtitle">HAUTE COUTURE</div>
        </div>
        
        <div class="content">
          <div class="greeting">Merhaba ${customerName},</div>
          
          <div class="reply-box">
            ${replyMessage.replace(/\n/g, '<br>')}
          </div>

          <div class="divider"></div>

          <div class="original-message">
            <div class="original-header">Orijinal Mesajınız</div>
            <div class="service-badge">${serviceType}</div>
            <div class="original-text">${originalMessage}</div>
          </div>

          <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; line-height: 1.6;">
            Sorularınız veya ek talepleriniz için bize her zaman ulaşabilirsiniz. 
            Size yardımcı olmaktan mutluluk duyarız.
          </p>
        </div>

        <div class="footer">
          <div class="footer-logo">MERYEM BALKAN</div>
          <div class="footer-text">
            Her anınızı özel kılmak için buradayız
          </div>
          <div class="contact-info">
            <a href="mailto:info@meryembalkan.com" class="contact-link">info@meryembalkan.com</a>
          </div>
          <div class="footer-text" style="margin-top: 20px;">
            © 2025 Meryem Balkan. Tüm hakları saklıdır.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Gelen veri:', body); // Debug için
    
    const { to, customerName, replyMessage, originalMessage, serviceType } = body;

    // Eksik alan kontrolü
    if (!to || !customerName || !replyMessage || !originalMessage || !serviceType) {
      return NextResponse.json({
        success: false,
        error: 'Eksik parametreler'
      }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Meryem Balkan" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Re: ${serviceType} - Mesajınıza Yanıt`,
      html: createReplyEmailTemplate(customerName, replyMessage, originalMessage, serviceType),
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Mail gönderme hatası:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
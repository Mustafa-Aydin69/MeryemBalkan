export const runtime = 'nodejs';

import nodemailer, { Transporter } from 'nodemailer';

// Singleton transporter — modül seviyesinde tek sefer kurulur
let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return _transporter;
}

/**
 * Merkezî e-posta gönderici.
 * EMAIL_USER tanımlı değilse fırlatır — çağıran tarafta .catch() ile sarılmalı.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}): Promise<void> {
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) throw new Error('EMAIL_USER env var tanımlı değil');

  const from = opts.fromName
    ? `"${opts.fromName}" <${adminEmail}>`
    : `"Meryem Balkan" <${adminEmail}>`;

  await getTransporter().sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

/**
 * Paylaşılan HTML e-posta kabuğu.
 * send-shipment / send-rental-reminder / send-return-confirmation rotalarındaki
 * getEmailTemplate() ile birebir aynı çıktıyı üretir.
 */
export function renderEmailShell(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 3px; font-style: italic;">
                    MERYEM BALKAN
                  </h1>
                  <p style="margin: 8px 0 0; color: #d4af37; font-size: 12px; letter-spacing: 2px;">
                    TASARIM ATÖLYESİ
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 10px; color: #666; font-size: 13px;">
                    Sorularınız için bizimle iletişime geçebilirsiniz.
                  </p>
                  <p style="margin: 0; color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} Meryem Balkan Tasarım Atölyesi
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

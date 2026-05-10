export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import nodemailer from "nodemailer";

function getEmailTemplate(content: string): string {
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
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 3px; font-style: italic;">MERYEM BALKAN</h1>
                  <p style="margin: 8px 0 0; color: #d4af37; font-size: 12px; letter-spacing: 2px;">TASARIM ATÖLYESİ</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">${content}</td>
              </tr>
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 10px; color: #666; font-size: 13px;">Sorularınız için bizimle iletişime geçebilirsiniz.</p>
                  <p style="margin: 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Meryem Balkan Tasarım Atölyesi</p>
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

function getReturnConfirmationContent(name: string, siparisNo?: string): string {
  return `
    <div style="text-align: center; margin-bottom: 25px;">
      <table role="presentation" style="margin: 0 auto;">
        <tr>
          <td style="width: 70px; height: 70px; background: linear-gradient(135deg, #d4af37, #b8962e); border-radius: 50%; text-align: center; vertical-align: middle;">
            <span style="color: white; font-size: 28px;">📬</span>
          </td>
        </tr>
      </table>
    </div>

    <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; text-align: center; font-weight: 500;">
      İade Talebiniz Alındı
    </h2>

    <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
      Sayın <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 25px; color: #333; font-size: 15px; line-height: 1.6;">
      İade talebiniz tarafımıza ulaşmıştır. En geç <strong>2 iş günü</strong> içinde sizinle iletişime geçeceğiz.
    </p>

    ${siparisNo ? `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px 20px; margin-bottom: 25px;">
      <p style="margin: 0; color: #666; font-size: 13px;">Sipariş Numarası</p>
      <p style="margin: 6px 0 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">${siparisNo}</p>
    </div>
    ` : ''}

    <div style="background: linear-gradient(135deg, #fff8e1, #fff3cd); border-left: 4px solid #d4af37; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #7d5a00; font-size: 14px; font-weight: 500;">Süreç hakkında bilgi</p>
      <p style="margin: 8px 0 0; color: #333; font-size: 14px; line-height: 1.6;">
        İade süreciniz değerlendirildikten sonra size detaylı bilgi verilecektir.
        İade koşulları için <a href="https://meryembalkan.com.tr/teslimat-ve-iade-politikasi" style="color: #d4af37;">Teslimat ve İade Politikamızı</a> inceleyebilirsiniz.
      </p>
    </div>

    <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
      Herhangi bir sorunuz olması halinde bizimle iletişime geçebilirsiniz.
    </p>
    <p style="margin: 15px 0 0; color: #333; font-size: 15px;">İyi günler dileriz. 🌸</p>
  `;
}

export async function POST(req: Request) {
  try {
    const { name, email, siparisNo } = await req.json();

    if (!name || !email) {
      return Response.json({ success: false, error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Meryem Balkan" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "İade Talebiniz Alındı – Meryem Balkan",
      html: getEmailTemplate(getReturnConfirmationContent(name, siparisNo)),
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('İade onay e-postası hatası:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

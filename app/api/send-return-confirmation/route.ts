export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { sendEmail, renderEmailShell } from "@/app/lib/email-service";

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

    await sendEmail({
      to: email,
      subject: "İade Talebiniz Alındı – Meryem Balkan",
      html: renderEmailShell(getReturnConfirmationContent(name, siparisNo)),
      fromName: "Meryem Balkan",
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('İade onay e-postası hatası:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

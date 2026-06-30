export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { sendEmail, renderEmailShell } from "@/app/lib/email-service";
import { verifyAdminToken, enforceAdminRateLimit } from "@/app/lib/admin-auth";

function getShipmentContent(data: {
  customerName: string;
  productName: string;
  trackingCode: string;
  orderId: string | number;
}): string {
  return `
    <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 500;">
      Sayın ${data.customerName},
    </h2>

    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      <strong style="color: #d4af37;">${data.productName}</strong> siparişiniz kargoya verilmiştir.
      Siparişinizi aşağıdaki takip koduyla takip edebilirsiniz.
    </p>

    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin: 25px 0; border-left: 4px solid #22c55e; text-align: center;">
      <p style="margin: 0 0 8px; color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Kargo Takip Kodu
      </p>
      <p style="margin: 0; color: #15803d; font-size: 24px; font-weight: 700; letter-spacing: 3px;">
        ${data.trackingCode}
      </p>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-size: 13px;">
        📦 Sipariş No: <strong>#${data.orderId}</strong>
      </p>
    </div>

    <p style="margin: 20px 0 0; color: #444; font-size: 15px; line-height: 1.7;">
      Kargonuz teslim edildiğinde sizi bilgilendireceğiz. Herhangi bir sorunuz olursa
      bizimle iletişime geçmekten çekinmeyin.
    </p>

    <p style="margin: 25px 0 0; color: #444; font-size: 15px; line-height: 1.7;">
      Sevgilerimizle,<br/>
      <strong style="color: #1a1a2e;">Meryem Balkan Tasarım Atölyesi</strong> 💜
    </p>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAdminToken(req);
    if (!payload) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(req, payload);
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    const {
      orderId,
      customerEmail,
      customerName = "Değerli Müşterimiz",
      productName = "Siparişiniz",
      trackingCode,
    } = body;

    if (!customerEmail || !trackingCode) {
      return Response.json(
        { success: false, error: "customerEmail ve trackingCode zorunludur" },
        { status: 400 }
      );
    }

    await sendEmail({
      to: customerEmail,
      subject: "📦 Siparişiniz Kargoya Verildi - Meryem Balkan",
      html: renderEmailShell(
        getShipmentContent({ customerName, productName, trackingCode, orderId: orderId ?? "" })
      ),
      fromName: "Meryem Balkan Tasarım Atölyesi",
    });

    console.log(`Kargo maili gönderildi: ${customerEmail}, takip: ${trackingCode}`);
    return Response.json({ success: true, message: "Kargo bildirimi gönderildi" });
  } catch (err: any) {
    console.error("Kargo maili gönderim hatası:", err);
    return Response.json(
      { success: false, error: err.message || "E-posta gönderilemedi" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { sendEmail, renderEmailShell } from "@/app/lib/email-service";
import { verifyAdminToken, enforceAdminRateLimit } from "@/app/lib/admin-auth";

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

// event_date Supabase'den "YYYY-MM-DD" gelir; DD/MM/YYYY de tolere edilir
// (mobil taraftaki _parseDate ile aynı esneklik).
function parseEventDate(raw: string): Date | null {
  if (!raw) return null;
  const iso = new Date(raw);
  if (!isNaN(iso.getTime())) return iso;
  const parts = raw.split("/");
  if (parts.length === 3) {
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatTr(date: Date): string {
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
}

function getThankYouContent(data: {
  customerName: string;
  productName: string;
  orderId: string | number;
  returnDateText: string | null;
}): string {
  return `
    <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 500;">
      Sayın ${data.customerName},
    </h2>

    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      <strong style="color: #d4af37;">${data.productName}</strong> kiralama siparişiniz için
      bizi tercih ettiğiniz için teşekkür ederiz. Bu özel ve mutlu gününüzü şimdiden kutlarız! 💜
    </p>

    ${data.returnDateText ? `
    <div style="background-color: #fff8e6; border-radius: 8px; padding: 24px; margin: 25px 0; border-left: 4px solid #d4af37; text-align: center;">
      <p style="margin: 0 0 8px; color: #8a6d1f; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Teslim Tarihi Hatırlatması
      </p>
      <p style="margin: 0 0 8px; color: #6b5416; font-size: 20px; font-weight: 700;">
        ${data.returnDateText}
      </p>
      <p style="margin: 0; color: #8a6d1f; font-size: 13px; line-height: 1.5;">
        Ürünü etkinlik tarihinizin bir gün sonrasına kadar mağazamıza teslim etmenizi rica ederiz.
      </p>
    </div>
    ` : ""}

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-size: 13px;">
        📦 Sipariş No: <strong>#${data.orderId}</strong>
      </p>
    </div>

    <p style="margin: 20px 0 0; color: #444; font-size: 15px; line-height: 1.7;">
      Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
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
      eventDate = "",
    } = body;

    if (!customerEmail) {
      return Response.json(
        { success: false, error: "customerEmail zorunludur" },
        { status: 400 }
      );
    }

    const parsedEvent = parseEventDate(eventDate);
    const returnDateText = parsedEvent
      ? formatTr(new Date(parsedEvent.getFullYear(), parsedEvent.getMonth(), parsedEvent.getDate() + 1))
      : null;

    await sendEmail({
      to: customerEmail,
      subject: "💜 Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz - Meryem Balkan",
      html: renderEmailShell(
        getThankYouContent({ customerName, productName, orderId: orderId ?? "", returnDateText })
      ),
      fromName: "Meryem Balkan Tasarım Atölyesi",
    });

    console.log(`Teşekkür/teslim hatırlatma maili gönderildi: ${customerEmail}`);
    return Response.json({ success: true, message: "Teşekkür maili gönderildi" });
  } catch (err: any) {
    console.error("Teşekkür maili gönderim hatası:", err);
    return Response.json(
      { success: false, error: err.message || "E-posta gönderilemedi" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import nodemailer from "nodemailer";

// Sipariş onay e-postası için veri tipi
interface OrderConfirmationData {
  customerName: string;
  email: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  shippingCost?: number;
  installmentCount?: number;
  installmentFee?: number;
  totalPaid: number;
  eventDate: string;
  returnDate: string;
  status: string;
  address?: string;
}

// Tarih formatlama (Türkçe)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// E-posta şablonu - paylaşılan düzen
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
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
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
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
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

// Sipariş onay e-postası içeriği
function getOrderConfirmationContent(data: OrderConfirmationData): string {
  const {
    customerName,
    productName,
    size,
    color,
    price,
    shippingCost,
    installmentCount,
    installmentFee,
    totalPaid,
    eventDate,
    returnDate,
    status,
    address
  } = data;

  // Fiyat dökümü satırları
  let priceBreakdown = `
    <tr>
      <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">Ürün Bedeli</td>
      <td style="padding: 10px 0; color: #333; text-align: right; border-bottom: 1px solid #eee;">${price.toLocaleString('tr-TR')} TL</td>
    </tr>
  `;

  if (shippingCost && shippingCost > 0) {
    priceBreakdown += `
      <tr>
        <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">Kargo Ücreti</td>
        <td style="padding: 10px 0; color: #333; text-align: right; border-bottom: 1px solid #eee;">${shippingCost.toLocaleString('tr-TR')} TL</td>
      </tr>
    `;
  }

  if (installmentCount && installmentCount > 1) {
    priceBreakdown += `
      <tr>
        <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">Taksit Sayısı</td>
        <td style="padding: 10px 0; color: #333; text-align: right; border-bottom: 1px solid #eee;">${installmentCount} Taksit</td>
      </tr>
    `;
    if (installmentFee && installmentFee > 0) {
      priceBreakdown += `
        <tr>
          <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">Vade Farkı</td>
          <td style="padding: 10px 0; color: #333; text-align: right; border-bottom: 1px solid #eee;">+${installmentFee.toLocaleString('tr-TR')} TL</td>
        </tr>
      `;
    }
  }

  return `
    <!-- Başarı İkonu -->
    <div style="text-align: center; margin-bottom: 25px;">
      <table role="presentation" style="margin: 0 auto;">
        <tr>
          <td style="width: 70px; height: 70px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 50%; text-align: center; vertical-align: middle;">
            <span style="color: white; font-size: 32px; font-weight: bold;">✓</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Başlık -->
    <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; text-align: center; font-weight: 500;">
      Siparişiniz Alındı!
    </h2>

    <!-- Selamlama -->
    <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.6;">
      Sayın <strong>${customerName}</strong>,
    </p>
    <p style="margin: 0 0 25px; color: #333; font-size: 15px; line-height: 1.6;">
      Bizi tercih ettiğiniz için teşekkür ederiz. Siparişiniz başarıyla alınmıştır.
    </p>

    <!-- Sipariş Bilgileri Kutusu -->
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 16px; font-weight: 600; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
        📋 Sipariş Bilgileri
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 40%;">Sipariş Durumu:</td>
          <td style="padding: 8px 0; color: #333; font-weight: 500;">
            <span style="background-color: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 13px;">
              ${status}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Etkinlik Tarihi:</td>
          <td style="padding: 8px 0; color: #333; font-weight: 500;">${formatDate(eventDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">En Geç İade Tarihi:</td>
          <td style="padding: 8px 0; color: #333; font-weight: 500;">${formatDate(returnDate)}</td>
        </tr>
      </table>
    </div>

    <!-- Teslimat Notu -->
    <div style="background: linear-gradient(135deg, #fff3e0, #ffe0b2); border-left: 4px solid #ff9800; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #e65100; font-size: 14px; font-weight: 500;">
        📦 Teslimat Bilgisi
      </p>
      <p style="margin: 8px 0 0; color: #333; font-size: 14px; line-height: 1.5;">
        Ürününüz, etkinlik tarihinden <strong>2 gün önce</strong> adresinize teslim edilecektir.
      </p>
      ${address ? `<p style="margin: 8px 0 0; color: #666; font-size: 13px;"><strong>Adres:</strong> ${address}</p>` : ''}
    </div>

    <!-- Ürün Detayları -->
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 16px; font-weight: 600; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
        👗 Ürün Detayları
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 30%;">Ürün:</td>
          <td style="padding: 8px 0; color: #333; font-weight: 500;">${productName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Beden:</td>
          <td style="padding: 8px 0; color: #333;">${size}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Renk:</td>
          <td style="padding: 8px 0; color: #333;">${color}</td>
        </tr>
      </table>
    </div>

    <!-- Fiyat Dökümü -->
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 16px; font-weight: 600; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
        💳 Ödeme Detayları
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${priceBreakdown}
        <tr>
          <td style="padding: 15px 0 0; color: #1a1a2e; font-size: 18px; font-weight: 600;">Toplam Ödenen</td>
          <td style="padding: 15px 0 0; color: #1a1a2e; font-size: 18px; font-weight: 600; text-align: right;">${totalPaid.toLocaleString('tr-TR')} TL</td>
        </tr>
      </table>
    </div>

    <!-- Kapanış -->
    <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
      Herhangi bir sorunuz olması halinde bizimle iletişime geçebilirsiniz.
    </p>
    <p style="margin: 15px 0 0; color: #333; font-size: 15px;">
      İyi günler dileriz. 🌸
    </p>
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderData: OrderConfirmationData = body;

    // Validasyon
    if (!orderData.email || !orderData.customerName || !orderData.productName) {
      return Response.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // E-posta transporteri oluştur (Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // E-posta içeriğini oluştur
    const emailContent = getOrderConfirmationContent(orderData);
    const htmlContent = getEmailTemplate(emailContent);

    // E-posta gönder
    await transporter.sendMail({
      from: `"Meryem Balkan" <${process.env.EMAIL_USER}>`,
      to: orderData.email,
      subject: `Siparişiniz Alındı – ${orderData.productName}`,
      html: htmlContent,
    });

    return Response.json({ success: true, message: 'Sipariş onay e-postası gönderildi' });

  } catch (error: any) {
    console.error('Sipariş onay e-postası gönderme hatası:', error);
    
    // E-posta hatası ödeme akışını engellemeyecek
    return Response.json(
      { success: false, error: error.message || 'E-posta gönderilemedi' },
      { status: 500 }
    );
  }
}

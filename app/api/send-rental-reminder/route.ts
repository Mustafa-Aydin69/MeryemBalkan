export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import nodemailer from "nodemailer";

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

// Normal Hatırlatma E-postası (Gecikme yok)
function getNormalReminderContent(data: {
  customerName: string;
  productName: string;
  eventDate: string;
  returnDate: string;
}): string {
  return `
    <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 500;">
      Sayın ${data.customerName},
    </h2>
    
    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      Öncelikle <strong style="color: #d4af37;">${data.productName}</strong> modelimizi tercih ettiğiniz için teşekkür ederiz.
    </p>
    
    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      Özel gününüzde sizinle birlikte olmaktan mutluluk duyuyoruz. 
      <strong>${formatDate(data.eventDate)}</strong> tarihindeki etkinliğinizin harika geçeceğini umuyoruz!
    </p>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #d4af37;">
      <p style="margin: 0 0 10px; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        İade Bilgisi
      </p>
      <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 500;">
        En Geç İade Tarihi: <strong style="color: #d4af37;">${formatDate(data.returnDate)}</strong>
      </p>
    </div>
    
    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      Kıyafetinizi etkinlik sonrasında, belirtilen tarihte bize ulaştırmanızı rica ederiz. 
      Kargo ile gönderim yapabilir veya mağazamıza teslim edebilirsiniz.
    </p>
    
    <div style="background-color: #fff8e7; border-radius: 8px; padding: 15px 20px; margin: 20px 0;">
      <p style="margin: 0; color: #8b6914; font-size: 14px;">
        💡 <strong>En geç iade tarihiniz ${formatDate(data.returnDate)} olup, bu tarihi geçmemenizi rica ederiz.</strong>
      </p>
    </div>
    
    <p style="margin: 25px 0 0; color: #444; font-size: 15px; line-height: 1.7;">
      Sevgilerimizle,<br/>
      <strong style="color: #1a1a2e;">Meryem Balkan Tasarım Atölyesi</strong> 💜
    </p>
  `;
}

// Gecikmiş Hatırlatma E-postası
function getOverdueReminderContent(data: {
  customerName: string;
  productName: string;
  eventDate: string;
  returnDate: string;
}): string {
  // Bugün hangi gün kontrol et (Pazar günü mü?)
  const today = new Date();
  const isSunday = today.getDay() === 0;
  const shippingInstruction = isSunday
    ? "Kargo şirketleri bugün kapalı olduğundan, <strong>yarın (Pazartesi) ilk iş olarak</strong> göndermenizi rica ederiz."
    : "Yurtiçi Kargo üzerinden <strong>BUGÜN</strong> kargo ile göndermenizi rica ederiz.";

  return `
    <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 500;">
      Sayın ${data.customerName},
    </h2>
    
    <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin: 0 0 25px; border-left: 4px solid #dc2626;">
      <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 500;">
        ⚠️ Kiralama İade Tarihiniz Geçmiştir
      </p>
    </div>
    
    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      <strong style="color: #d4af37;">${data.productName}</strong> modelimiz için belirlenen en geç iade tarihi 
      <strong style="color: #dc2626;">${formatDate(data.returnDate)}</strong> idi.
    </p>
    
    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      Ancak bugün itibarıyla ürünümüz tarafımıza ulaşmamıştır. 
      Başka müşterilerimizin rezervasyonları bulunduğundan, ürünün en kısa sürede iade edilmesi gerekmektedir.
    </p>
    
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: 500;">
        📦 Kargo Talimatları:
      </p>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
        ${shippingInstruction}
      </p>
    </div>
    
    <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
        ⚖️ <strong>İade işlemi gerçekleştirilmediği takdirde yasal süreç başlatılacaktır.</strong>
      </p>
    </div>
    
    <p style="margin: 0 0 15px; color: #444; font-size: 15px; line-height: 1.7;">
      Kargo gönderiminizi yaptıktan sonra takip numarasını bizimle paylaşmanızı rica ederiz.
    </p>
    
    <p style="margin: 25px 0 0; color: #444; font-size: 15px; line-height: 1.7;">
      Saygılarımızla,<br/>
      <strong style="color: #1a1a2e;">Meryem Balkan Tasarım Atölyesi</strong>
    </p>
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      productName,
      eventDate,
      returnDate,
      status, // 'musteride' veya 'gecikti'
    } = body;

    // Validasyon
    if (!customerName || !customerEmail || !productName || !eventDate || !returnDate) {
      return Response.json(
        { success: false, error: "Eksik parametreler" },
        { status: 400 }
      );
    }

    // E-posta yapılandırması
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Duruma göre e-posta içeriği seç
    const isOverdue = status === 'gecikti';
    
    const emailData = {
      customerName,
      productName,
      eventDate,
      returnDate,
    };

    const emailContent = isOverdue
      ? getOverdueReminderContent(emailData)
      : getNormalReminderContent(emailData);

    const emailSubject = isOverdue
      ? "⚠️ Kiralama İade Tarihiniz Geçti - Acil Bilgilendirme"
      : "💜 Kiralama İade Hatırlatması - Meryem Balkan";

    // E-postayı gönder
    await transporter.sendMail({
      from: `"Meryem Balkan Tasarım Atölyesi" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: emailSubject,
      html: getEmailTemplate(emailContent),
    });

    console.log(`Hatırlatma maili gönderildi: ${customerEmail} (${isOverdue ? 'Gecikmiş' : 'Normal'})`);

    return Response.json({
      success: true,
      message: "Hatırlatma e-postası gönderildi",
      type: isOverdue ? 'overdue' : 'normal',
    });

  } catch (err: any) {
    console.error("Hatırlatma maili gönderim hatası:", err);
    return Response.json(
      { success: false, error: err.message || "E-posta gönderilemedi" },
      { status: 500 }
    );
  }
}

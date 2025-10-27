import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, customerEmail, trackingCode } = body;

    if (!orderId || !customerEmail || !trackingCode) {
      return Response.json(
        { message: "Eksik parametreler: orderId, customerEmail, trackingCode gerekli" },
        { status: 400 }
      );
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
      from: `"Meryem Balkan Tasarım Atölyesi" <${process.env.MAIL_USER}>`,
      to: customerEmail,
      subject: "Siparişiniz Kargoya Verildi!",
      html: `
        <div style="font-family:sans-serif; line-height:1.6;">
          <h2 style="color:#d291bc;">Kargonuz Yola Çıktı 💌</h2>
          <p>Merhaba, siparişiniz <b>kargoya verilmiştir.</b></p>
          <p><b>Kargo Takip Kodunuz:</b> ${trackingCode}</p>
          <p>
            Yurtiçi Kargo üzerinden 
            <a href="https://www.yurticikargo.com/" target="_blank">
              kargonuzu buradan
            </a> takip edebilirsiniz.
          </p>
          <br/>
          <p>Teşekkür ederiz,<br/>Meryem Balkan Tasarım Atölyesi 💜</p>
        </div>
      `,
    });

    console.log(`Kargo maili gönderildi: ${customerEmail}`);
    return Response.json({ success: true, message: "Mail gönderildi" });
  } catch (err) {
    console.error("Mail gönderim hatası:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

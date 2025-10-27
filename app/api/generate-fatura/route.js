import { jsPDF } from "jspdf";
import { supabase } from "../../utils/supabaseClient";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Türkçe karakterleri temizle
function cleanTurkishText(text) {
  if (!text) return text;
  const map = {
    'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S',
    'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
    'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
  };
  return text.replace(/[ıİşŞğĞüÜöÖçÇ]/g, char => map[char] || char);
}

export async function POST(req) {
  try {
    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ message: "orderId eksik" }, { status: 400 });

    // === 1. Sipariş verisini çek ===
    const { data: order, error } = await supabase
      .from("siparisler")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order)
      return NextResponse.json({ message: "Sipariş bulunamadı" }, { status: 404 });

    // === 2. jsPDF oluştur ===
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Arka plan
    doc.setFillColor(233, 236, 248);
    doc.rect(0, 0, 210, 297, "F");

    // Beyaz içerik kutusu
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 10, 190, 277, 3, 3, "F");

    // === LOGO ===
    const logoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "AnaSayfa",
      "Meryem_Balkan_Logo.jpg"
    );
    const logoBuffer = await fs.readFile(logoPath);
    const base64Logo = logoBuffer.toString("base64");
    doc.addImage(`data:image/jpeg;base64,${base64Logo}`, "JPEG", 20, 20, 25, 25);

    // === BAŞLIK KISMI ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MERYEM BALKAN", 50, 26);
    doc.text("TASARIM", 50, 32);
    doc.text(cleanTurkishText("ATÖLYESI"), 50, 38);

    doc.setFontSize(20);
    doc.text("FATURA", 190, 28, { align: "right" });

    // Şirket bilgileri
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(cleanTurkishText("Atatürk Mah. Gazi Bulvarı No: 12"), 20, 52);
    doc.text(cleanTurkishText("10100 Karesi/Balıkesir"), 20, 57);
    doc.text("+0 212 123 24 25", 20, 62);
    doc.text("merhaba@harikasite.web.tr", 20, 67);

    // Fatura No ve Tarih
    const tarih = new Date(order.orderDate || Date.now()).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.setFontSize(8);
    doc.text(`Fatura No: ${String(order.id).padStart(3, "0")}`, 190, 52, { align: "right" });
    doc.text(cleanTurkishText(`Duzenlenme Tarihi: ${tarih}`), 190, 57, { align: "right" });

    // === ALICI BİLGİLERİ ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(cleanTurkishText("ALICI BILGILERI"), 20, 80);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    let currentY = 88;
    
    // Müşteri adı
    const customerName = cleanTurkishText(order.customerName || "Musteri Adi");
    const wrappedName = doc.splitTextToSize(customerName, 170);
    doc.text(wrappedName, 20, currentY);
    currentY += wrappedName.length * 5;
    
    // Adres
    const address = cleanTurkishText(order.address || "Adres bilgisi bulunamadi");
    const wrappedAddress = doc.splitTextToSize(address, 170);
    doc.text(wrappedAddress, 20, currentY);
    currentY += wrappedAddress.length * 5;
    
    // Email
    doc.text(order.email || "-", 20, currentY);
    currentY += 5;
    
    // Telefon
    doc.text(order.phone || "", 20, currentY);
    currentY += 5;

    // === TABLO ===
    const tableStartY = currentY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ACIKLAMA", 20, tableStartY);
    doc.text("RENK", 85, tableStartY);
    doc.text("BEDEN", 110, tableStartY);
    doc.text("ETKINLIK", 135, tableStartY);
    doc.text("FIYAT", 190, tableStartY, { align: "right" });

    doc.setLineWidth(0.3);
    doc.line(20, tableStartY + 2, 190, tableStartY + 2);

    // Ürün satırı
    let y = tableStartY + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // Ürün adını wrap et
    const productName = cleanTurkishText(order.productName || "Urun Adi Yok");
    const wrappedProduct = doc.splitTextToSize(productName, 60);
    doc.text(wrappedProduct, 20, y);

    // Diğer sütunlar
    doc.text(cleanTurkishText(order.color || "-"), 85, y);
    doc.text(order.size || "-", 110, y);
    
    // Etkinlik tarihi
    const eventDateShort = new Date(order.eventDate).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    doc.text(eventDateShort || "-", 135, y);
    
    doc.text(`${Number(order.price).toFixed(2)} TL`, 190, y, { align: "right" });

    // Ürün adı birden fazla satırsa y pozisyonunu ayarla
    y += Math.max(wrappedProduct.length * 5, 5);
    doc.line(20, y + 2, 190, y + 2);

    // === TOPLAM ALANI ===
    y += 15;
    const toplamFiyat = Number(order.price) || 0;
    const kdv = toplamFiyat * 0.18;
    const genelToplam = toplamFiyat + kdv;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("ARA TOPLAM :", 135, y);
    doc.text(`${toplamFiyat.toFixed(2)} TL`, 190, y, { align: "right" });

    y += 6;
    doc.text("KDV (18%) :", 135, y);
    doc.text(`${kdv.toFixed(2)} TL`, 190, y, { align: "right" });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("TOPLAM FIYAT :", 135, y);
    doc.text(`${genelToplam.toFixed(2)} TL`, 190, y, { align: "right" });

    // === ÖDEME BİLGİLERİ ===
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(cleanTurkishText("ODEME BILGISI"), 20, y);

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(cleanTurkishText("Odeme Yontemi: Kredi Karti"), 20, y);
    y += 5;
    doc.text(cleanTurkishText("Odeme Durumu: Tamamlandi"), 20, y);
    y += 5;
    doc.text(cleanTurkishText("Islem Tarihi: " + new Date(order.orderDate || Date.now()).toLocaleDateString("tr-TR")), 20, y);

    // Alt not
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    const not = cleanTurkishText(
      "*Bu fatura sistem tarafindan otomatik olusturulmustur. Herhangi bir imza veya onay gerektirmez."
    );
    const wrapped = doc.splitTextToSize(not, 70);
    doc.text(wrapped, 125, y - 8);

    // Alt teşekkür
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(cleanTurkishText("BIZI TERCIH ETTIGINIZ ICIN TESEKKUR EDERIZ."), 105, 282, { align: "center" });

    // === PDF ÇIKTISI ===
    const pdfBytes = doc.output("arraybuffer");
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=fatura_${order.id}.pdf`,
      },
    });
  } catch (err) {
    console.error("Fatura olusturma hatasi:", err);
    return NextResponse.json({ message: "Sunucu hatasi" }, { status: 500 });
  }
}
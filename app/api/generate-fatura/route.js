import jsPDF from "jspdf";
import { supabase } from "../../utils/supabaseClient";
import { NextResponse } from "next/server";

// Türkçe karakterleri temizleme fonksiyonu
function cleanTurkishText(text) {
  if (!text) return "";
  text = String(text);
  const map = {
    'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S',
    'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
    'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
  };
  return text.replace(/[ıİşŞğĞüÜöÖçÇ]/g, char => map[char] || char);
}

// Para birimi formatlama
function formatCurrency(amount) {
  return Number(amount).toFixed(2).replace('.', ',') + " TL";
}

export async function POST(req) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: "orderId eksik" }, { status: 400 });
    }

    // === 1. Sipariş verisini çek ===
    const { data: order, error } = await supabase
      .from("siparisler")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ message: "Sipariş bulunamadı" }, { status: 404 });
    }

    // === 2. jsPDF-AutoTable'ı dinamik olarak import et ===
    const autoTable = (await import("jspdf-autotable")).default;
    
    // === 3. jsPDF Başlat ===
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Font ayarı
    doc.setFont("helvetica");

    // === 4. HEADER (GÖNDERİCİ BİLGİLERİ - SOL ÜST) ===
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(cleanTurkishText("MERYEM BALKAN TASARIM ATOLYESI"), 14, 20);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const senderAddress = [
      cleanTurkishText("Ataturk Mah. Gazi Bulvari No: 12"),
      cleanTurkishText("10100 Karesi/Balikesir"),
      "Tel: +90 212 123 24 25",
      "Web: www.meryembalkan.com | E-Posta: merhaba@meryembalkan.com",
      cleanTurkishText("Vergi Dairesi: KARESI | VKN: 11111111111"),
      "MERSISNO: 0111111111100015"
    ];

    let senderY = 26;
    senderAddress.forEach(line => {
      doc.text(line, 14, senderY);
      senderY += 4;
    });

    // === 5. e-ARŞİV FATURA LOGOSU (SAĞ ÜST) ===
    doc.setFontSize(16);
    doc.setTextColor(255, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(cleanTurkishText("e-ARSIV FATURA"), 150, 20);
    doc.setTextColor(0, 0, 0);

    // === 6. FATURA DETAYLARI TABLOSU ===
    const siparisTarihi = new Date(order.orderDate || Date.now());
    const tarihStr = siparisTarihi.toLocaleDateString("tr-TR");
    const saatStr = siparisTarihi.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });

    autoTable(doc, {
      startY: 25,
      margin: { left: 120 },
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 1,
        font: "helvetica"
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 40 }
      },
      body: [
        [cleanTurkishText("Ozellestirme No:"), "TR1.2"],
        [cleanTurkishText("Senaryo:"), "EARSIVFATURA"],
        [cleanTurkishText("Fatura Tipi:"), "SATIS"],
        [cleanTurkishText("Fatura No:"), `FAT${new Date().getFullYear()}${String(order.id).padStart(5, '0')}`],
        [cleanTurkishText("Fatura Tarihi:"), `${tarihStr} ${saatStr}`],
        [cleanTurkishText("Duzenlenme Tarihi:"), tarihStr],
        ["ETTN:", crypto.randomUUID().toUpperCase()]
      ]
    });

    // === 7. ALICI BİLGİLERİ ===
    const customerStartY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SAYIN", 14, customerStartY);

    doc.setFont("helvetica", "bold");
    doc.text(cleanTurkishText(order.customerName || "Musteri Adi").toUpperCase(), 14, customerStartY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const addressLines = doc.splitTextToSize(cleanTurkishText(order.address || "Adres bilgisi yok"), 80);
    doc.text(addressLines, 14, customerStartY + 10);

    let infoY = customerStartY + 10 + (addressLines.length * 4);
    doc.text(`Tel: ${order.phone || "-"}`, 14, infoY);
    infoY += 4;
    doc.text(`E-Posta: ${order.email || "-"}`, 14, infoY);
    infoY += 4;
    doc.text(`TCKN/VKN: 11111111111`, 14, infoY);

    // === 8. ÜRÜN TABLOSU ===
    const birimFiyat = Number(order.price) || 0;
    const miktar = 1;
    const kdvOrani = 0.20;

    const kdvDahilTutar = birimFiyat * miktar;
    const matrah = kdvDahilTutar / (1 + kdvOrani);
    const kdvTutari = kdvDahilTutar - matrah;

    const columns = [
      { header: 'Sira', dataKey: 'id' },
      { header: cleanTurkishText('Malzeme/Hizmet Kodu'), dataKey: 'code' },
      { header: cleanTurkishText('Aciklama'), dataKey: 'desc' },
      { header: 'Miktar', dataKey: 'qty' },
      { header: 'Birim Fiyat', dataKey: 'price' },
      { header: 'KDV', dataKey: 'vatRate' },
      { header: 'KDV Tutari', dataKey: 'vatAmt' },
      { header: 'Tutar (KDV Haric)', dataKey: 'total' },
    ];

    let urunAciklamasi = cleanTurkishText(order.productName || "Urun");
    if (order.color) urunAciklamasi += ` - ${cleanTurkishText(order.color)}`;
    if (order.size) urunAciklamasi += ` (${order.size})`;

    const tableData = [
      {
        id: "1",
        code: "HIZMET-001",
        desc: urunAciklamasi,
        qty: `${miktar} Adet`,
        price: formatCurrency(matrah),
        vatRate: "%20",
        vatAmt: formatCurrency(kdvTutari),
        total: formatCurrency(matrah)
      }
    ];

    autoTable(doc, {
      columns: columns,
      body: tableData,
      startY: infoY + 10,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: 200
      },
      styles: {
        fontSize: 8,
        halign: 'center',
        textColor: 0,
        lineWidth: 0.1,
        lineColor: 200,
        font: "helvetica"
      },
      columnStyles: {
        desc: { halign: 'left' },
        price: { halign: 'right' },
        vatAmt: { halign: 'right' },
        total: { halign: 'right' }
      }
    });

    // === 9. TOPLAMLAR ===
    const finalY = doc.lastAutoTable.finalY + 5;

    autoTable(doc, {
      startY: finalY,
      margin: { left: 130 },
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 1,
        halign: 'right',
        font: "helvetica"
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 30 }
      },
      body: [
        [cleanTurkishText("Malzeme/Hizmet Toplam:"), formatCurrency(matrah)],
        [cleanTurkishText("Toplam Iskonto:"), "0,00 TL"],
        [cleanTurkishText("Hesaplanan KDV (%20):"), formatCurrency(kdvTutari)],
        [
          { content: cleanTurkishText("Odenecek Tutar:"), styles: { fontStyle: 'bold' } }, 
          { content: formatCurrency(kdvDahilTutar), styles: { fontStyle: 'bold' } }
        ]
      ]
    });

    // === 10. ALT BİLGİLER ===
    const textY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text(cleanTurkishText(`Yazi ile: #${formatCurrency(kdvDahilTutar)}#`), 14, textY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(cleanTurkishText("NOT: Bu belge fatura yerine gecer."), 14, textY + 10);
    doc.text(cleanTurkishText(`Odeme Yontemi: Kredi Karti`), 14, textY + 15);

    doc.setFont("helvetica", "bold");
    doc.text("BANKA IBAN:", 14, textY + 25);
    doc.setFont("helvetica", "normal");
    doc.text("TR00 0000 0000 0000 0000 0000 00 - MERYEM BALKAN", 14, textY + 30);

    // === PDF OLUŞTUR VE GÖNDER ===
    const pdfBytes = doc.output("arraybuffer");

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=fatura_${order.id}.pdf`,
      },
    });

  } catch (err) {
    console.error("Fatura olusturma hatasi:", err);
    return NextResponse.json({ message: "Sunucu hatasi: " + err.message }, { status: 500 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Taksit Seçenekleri API Endpoint'i
 * 
 * Bu endpoint şu anda SAHTE (mock) veri döndürüyor.
 * 
 * TODO: iyzico entegrasyonu için:
 * 1. iyzico SDK'yı import et: import Iyzipay from 'iyzipay';
 * 2. iyzico credentials'ları .env'den al
 * 3. iyzico.installmentInfo.retrieve() metodunu çağır
 * 4. Gerçek banka taksit seçeneklerini döndür
 * 
 * iyzico Dokümantasyonu:
 * https://dev.iyzipay.com/tr/api/taksit-sorgulama
 */

interface InstallmentOption {
  count: number;           // Taksit sayısı (1 = tek çekim)
  totalAmount: number;     // Toplam tutar (komisyon dahil)
  installmentAmount: number; // Aylık taksit tutarı
  interestRate: number;    // Faiz oranı (%)
}

interface InstallmentResponse {
  success: boolean;
  cardType: string;        // Visa, MasterCard, etc.
  bankName: string;        // Banka adı
  installments: InstallmentOption[];
  error?: string;
}

// Sahte taksit verileri - BIN'e göre
function getMockInstallments(bin: string, totalPrice: number): InstallmentResponse {
  const firstDigit = bin.charAt(0);
  
  // TODO: iyzico entegrasyonunda bu fonksiyon tamamen değiştirilecek
  // iyzico gerçek banka ve kart bilgilerine göre taksit seçenekleri döndürür
  
  // Visa kartları (4 ile başlar)
  if (firstDigit === '4') {
    return {
      success: true,
      cardType: 'Visa',
      bankName: 'Örnek Banka', // TODO: iyzico'dan gerçek banka adı gelecek
      installments: [
        { count: 1, totalAmount: totalPrice, installmentAmount: totalPrice, interestRate: 0 },
        { count: 2, totalAmount: totalPrice, installmentAmount: Math.round(totalPrice / 2), interestRate: 0 },
        { count: 3, totalAmount: totalPrice * 1.02, installmentAmount: Math.round((totalPrice * 1.02) / 3), interestRate: 2 },
        { count: 6, totalAmount: totalPrice * 1.05, installmentAmount: Math.round((totalPrice * 1.05) / 6), interestRate: 5 },
        { count: 9, totalAmount: totalPrice * 1.08, installmentAmount: Math.round((totalPrice * 1.08) / 9), interestRate: 8 },
      ]
    };
  }
  
  // MasterCard kartları (5 ile başlar)
  if (firstDigit === '5') {
    return {
      success: true,
      cardType: 'MasterCard',
      bankName: 'Örnek Banka',
      installments: [
        { count: 1, totalAmount: totalPrice, installmentAmount: totalPrice, interestRate: 0 },
        { count: 2, totalAmount: totalPrice, installmentAmount: Math.round(totalPrice / 2), interestRate: 0 },
        { count: 3, totalAmount: totalPrice * 1.015, installmentAmount: Math.round((totalPrice * 1.015) / 3), interestRate: 1.5 },
        { count: 6, totalAmount: totalPrice * 1.04, installmentAmount: Math.round((totalPrice * 1.04) / 6), interestRate: 4 },
      ]
    };
  }
  
  // Troy kartları (9 ile başlar - Türkiye)
  if (firstDigit === '9') {
    return {
      success: true,
      cardType: 'Troy',
      bankName: 'Örnek Banka',
      installments: [
        { count: 1, totalAmount: totalPrice, installmentAmount: totalPrice, interestRate: 0 },
        { count: 2, totalAmount: totalPrice, installmentAmount: Math.round(totalPrice / 2), interestRate: 0 },
        { count: 3, totalAmount: totalPrice, installmentAmount: Math.round(totalPrice / 3), interestRate: 0 },
      ]
    };
  }
  
  // Diğer kartlar - sadece tek çekim
  return {
    success: true,
    cardType: 'Diğer',
    bankName: '',
    installments: [
      { count: 1, totalAmount: totalPrice, installmentAmount: totalPrice, interestRate: 0 }
    ]
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bin, totalPrice } = body;

    // Validasyon
    if (!bin || bin.length < 6) {
      return Response.json({
        success: false,
        cardType: '',
        bankName: '',
        installments: [
          { count: 1, totalAmount: totalPrice || 0, installmentAmount: totalPrice || 0, interestRate: 0 }
        ],
        error: 'Geçersiz BIN numarası'
      });
    }

    if (!totalPrice || totalPrice <= 0) {
      return Response.json({
        success: false,
        error: 'Geçersiz tutar'
      }, { status: 400 });
    }

    /**
     * TODO: iyzico Entegrasyonu
     * 
     * const iyzipay = new Iyzipay({
     *   apiKey: process.env.IYZICO_API_KEY,
     *   secretKey: process.env.IYZICO_SECRET_KEY,
     *   uri: process.env.IYZICO_BASE_URL // sandbox veya production
     * });
     * 
     * const request = {
     *   locale: 'tr',
     *   conversationId: generateConversationId(),
     *   binNumber: bin,
     *   price: totalPrice.toString()
     * };
     * 
     * const result = await new Promise((resolve, reject) => {
     *   iyzipay.installmentInfo.retrieve(request, (err, result) => {
     *     if (err) reject(err);
     *     else resolve(result);
     *   });
     * });
     * 
     * // iyzico yanıtını parse et ve döndür
     * return Response.json(parseIyzicoResponse(result));
     */

    // Şimdilik sahte veri döndür
    const mockResponse = getMockInstallments(bin, totalPrice);
    
    return Response.json(mockResponse);

  } catch (err: any) {
    console.error('Taksit sorgulama hatası:', err);
    
    // Hata durumunda tek çekim seçeneği döndür
    return Response.json({
      success: false,
      cardType: '',
      bankName: '',
      installments: [
        { count: 1, totalAmount: 0, installmentAmount: 0, interestRate: 0 }
      ],
      error: 'Taksit bilgileri alınamadı'
    });
  }
}

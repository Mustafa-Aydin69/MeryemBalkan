'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CreditCardPreview from '../components/CreditCardPreview';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OrderData {
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  shippingAddress: {
    address: string;
    district: string;
    city: string;
    postalCode: string;
    country: string;
  };
  deliveryMethod: string;
  items: any[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  createdAt: string;
}

export default function Payment() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  // Kart flip durumu - CVV'ye focus olunca true olur
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Tema kontrolü
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Sipariş verilerini al
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      setOrderData(JSON.parse(pendingOrder));
    }
  }, []);

  // Sipariş verisi yoksa checkout'a yönlendir (ayrı useEffect)
  useEffect(() => {
    if (isClient && !orderData && !localStorage.getItem('pendingOrder')) {
      router.push('/checkout');
    }
  }, [isClient, orderData, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Kart numarası formatı (XXXX XXXX XXXX XXXX)
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      formattedValue = formattedValue.replace(/(\d{4})/g, '$1 ').trim();
    }

    // Son kullanma tarihi formatı (MM/YY)
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    }

    // CVV (3-4 haneli)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderData) return;

    setIsProcessing(true);

    try {
      // Siparişleri Supabase'e kaydet
      for (const item of orderData.items) {
        const { error } = await supabase.from('siparisler').insert({
          customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
          phone: orderData.customer.phone,
          email: orderData.customer.email || null,
          address: `${orderData.shippingAddress.address}, ${orderData.shippingAddress.district}, ${orderData.shippingAddress.city} ${orderData.shippingAddress.postalCode}`,
          productName: item.title,
          color: item.color,
          size: item.size,
          eventDate: item.date,
          price: `${item.price} TL`,
          status: 'Onay Bekliyor',
          deliveryMethod: orderData.deliveryMethod === 'pickup' ? 'Mağazadan Teslim' : 'Kargo',
        });

        if (error) {
          console.error('Sipariş kayıt hatası:', error);
          throw error;
        }
      }

      // Başarılı
      setPaymentSuccess(true);
      
      // Sepeti ve sipariş verilerini temizle
      localStorage.removeItem('cartItems');
      localStorage.removeItem('pendingOrder');
      
      // 3 saniye sonra siparişler sayfasına yönlendir
      setTimeout(() => {
        router.push('/siparisler?success=true');
      }, 3000);

    } catch (error) {
      console.error('Ödeme hatası:', error);
      alert('Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient || !orderData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <h1 className={`text-2xl font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Ödeme Başarılı!
          </h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Siparişiniz alındı. Siparişler sayfasına yönlendiriliyorsunuz...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <nav className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/checkout" className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            <i className="ri-arrow-left-line"></i>
            <span>Geri</span>
          </Link>
          <div className="text-center">
            <h1 className={`text-lg font-light tracking-[0.2em] font-serif italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
              MERYEM BALKAN
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Güvenli Ödeme
            </p>
          </div>
          <div className="w-16"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol - Kart Bilgileri */}
          <div>
            <h2 className={`text-xl font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Kart Bilgileri
            </h2>

            {/* 3D Kredi Kartı Önizleme */}
            <CreditCardPreview
              cardNumber={cardData.cardNumber}
              cardName={cardData.cardName}
              expiryDate={cardData.expiryDate}
              cvv={cardData.cvv}
              isFlipped={isCardFlipped}
              isDarkMode={isDarkMode}
            />

            <form onSubmit={handlePayment} className="space-y-4">
              {/* Kart Numarası */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Kart Numarası
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={cardData.cardNumber}
                  onChange={handleInputChange}
                  onFocus={() => setIsCardFlipped(false)} // Ön yüze dön
                  placeholder="0000 0000 0000 0000"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-lg tracking-wider transition-all ${isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {/* Kart Üzerindeki İsim */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Kart Üzerindeki İsim
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={cardData.cardName}
                  onChange={handleInputChange}
                  onFocus={() => setIsCardFlipped(false)} // Ön yüze dön
                  placeholder="AD SOYAD"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none uppercase transition-all ${isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {/* Son Kullanma ve CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Son Kullanma
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={cardData.expiryDate}
                    onChange={handleInputChange}
                    onFocus={() => setIsCardFlipped(false)} // Ön yüze dön
                    placeholder="AA/YY"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-center transition-all ${isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={cardData.cvv}
                    onChange={handleInputChange}
                    onFocus={() => setIsCardFlipped(true)}  // Arka yüze dön (CVV göster)
                    onBlur={() => setIsCardFlipped(false)}  // Focus çıkınca ön yüze dön
                    placeholder="***"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-center transition-all ${isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* Ödeme Butonu */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${isProcessing
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    İşleniyor...
                  </>
                ) : (
                  `${orderData.totalPrice.toLocaleString('tr-TR')} TL Öde`
                )}
              </button>
            </form>
          </div>

          {/* Sağ - Sipariş Özeti */}
          <div className={`p-6 rounded-xl h-fit ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className={`text-xl font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Sipariş Özeti
            </h2>

            {/* Ürünler */}
            <div className="space-y-4 mb-6">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.color} / {item.size}
                    </p>
                  </div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {item.price.toLocaleString('tr-TR')} TL
                  </p>
                </div>
              ))}
            </div>

            {/* Fiyat Detayları */}
            <div className={`space-y-3 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Ara Toplam</span>
                <span className={isDarkMode ? 'text-white' : 'text-black'}>{orderData.subtotal.toLocaleString('tr-TR')} TL</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Kargo</span>
                <span className={isDarkMode ? 'text-white' : 'text-black'}>
                  {orderData.shippingCost === 0 ? 'Ücretsiz' : `${orderData.shippingCost} TL`}
                </span>
              </div>
              <div className={`flex justify-between text-lg font-medium pt-3 border-t ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-black'}`}>
                <span>Toplam</span>
                <span>{orderData.totalPrice.toLocaleString('tr-TR')} TL</span>
              </div>
            </div>

            {/* Teslimat Adresi */}
            <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Teslimat Adresi
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {orderData.customer.firstName} {orderData.customer.lastName}<br />
                {orderData.shippingAddress.address}<br />
                {orderData.shippingAddress.district}, {orderData.shippingAddress.city} {orderData.shippingAddress.postalCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


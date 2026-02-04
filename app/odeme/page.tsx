'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import CreditCardPreview from '../components/CreditCardPreview';
import PaymentMarks from '../components/PaymentMarks';
import { deletePendingOrders, confirmOrders } from '../utils/rentalConflict';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

// Resim URL'ini düzeltme (eski localStorage verileri için)
const getImageUrl = (image: string | undefined) => {
  if (!image) return `${getR2BaseUrl()}1760034813002_Meryem_Balkan_Logo.jpg`;
  if (image.startsWith('http')) return image;
  return `${getR2BaseUrl()}${image}`;
};

// 5 dakika = 300 saniye
const PAYMENT_TIMEOUT_SECONDS = 300;

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
  orderIds?: number[]; // Siparişlerin ID'leri
  paymentStartTime?: number; // Ödeme başlangıç zamanı
}

export default function Payment() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeoutExpired, setTimeoutExpired] = useState(false);
  const [remainingTime, setRemainingTime] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  
  // Taksit Altyapısı State'leri
  // TODO: iyzico entegrasyonunda bu state'ler kullanılacak
  const [selectedInstallment, setSelectedInstallment] = useState(1); // Seçilen taksit sayısı
  const [installmentOptions, setInstallmentOptions] = useState<{
    count: number;
    totalAmount: number;
    installmentAmount: number;
    interestRate: number;
  }[]>([]);
  const [cardType, setCardType] = useState(''); // Visa, MasterCard, Troy
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [currentBin, setCurrentBin] = useState(''); // İlk 6 hane
  
  // Kart flip durumu - CVV'ye focus olunca true olur
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  /**
   * BIN Algılama ve Taksit Sorgulama
   * 
   * TODO: iyzico entegrasyonunda bu fonksiyon gerçek API'yi çağıracak
   * Şu anda /api/installments stub endpoint'ini kullanıyor
   */
  const fetchInstallmentOptions = useCallback(async (bin: string, totalPrice: number) => {
    if (bin.length < 6 || !totalPrice) return;
    
    setIsLoadingInstallments(true);
    try {
      const response = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bin, totalPrice }),
      });
      
      const data = await response.json();
      
      if (data.success && data.installments) {
        setInstallmentOptions(data.installments);
        setCardType(data.cardType || '');
        // Varsayılan olarak tek çekim seçili
        setSelectedInstallment(1);
      } else {
        // Hata durumunda tek çekim
        setInstallmentOptions([{ count: 1, totalAmount: totalPrice, installmentAmount: totalPrice, interestRate: 0 }]);
        setCardType('');
      }
    } catch (error) {
      console.error('Taksit sorgulama hatası:', error);
      // Hata durumunda tek çekim - ödeme akışını kesme
      setInstallmentOptions([{ count: 1, totalAmount: totalPrice, installmentAmount: totalPrice, interestRate: 0 }]);
    } finally {
      setIsLoadingInstallments(false);
    }
  }, []);

  // Kart numarası değiştiğinde BIN kontrolü
  useEffect(() => {
    const cleanedNumber = cardData.cardNumber.replace(/\s/g, '');
    const bin = cleanedNumber.slice(0, 6);
    
    // BIN değiştiyse ve 6 haneli ise taksit seçeneklerini sorgula
    if (bin.length === 6 && bin !== currentBin && orderData?.totalPrice) {
      setCurrentBin(bin);
      fetchInstallmentOptions(bin, orderData.totalPrice);
    }
    
    // Kart numarası silinirse taksit seçeneklerini temizle
    if (cleanedNumber.length < 6) {
      setCurrentBin('');
      setInstallmentOptions([]);
      setCardType('');
      setSelectedInstallment(1);
    }
  }, [cardData.cardNumber, currentBin, orderData?.totalPrice, fetchInstallmentOptions]);
  
  // Cleanup için ref
  const cleanupDoneRef = useRef(false);
  const orderDataRef = useRef<OrderData | null>(null);

  // Cleanup fonksiyonu (timeout durumunda sepeti de geri yükler)
  const cleanupPendingOrders = useCallback(async (shouldRestoreCart: boolean = true) => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;
    
    const data = orderDataRef.current;
    if (data?.orderIds && data.orderIds.length > 0) {
      // Sepeti geri yükle (sadece timeout/iptal durumunda)
      if (shouldRestoreCart && data.items && data.items.length > 0) {
        const existingCart = localStorage.getItem('cartItems');
        const currentItems = existingCart ? JSON.parse(existingCart) : [];
        const restoredCart = [...currentItems, ...data.items];
        localStorage.setItem('cartItems', JSON.stringify(restoredCart));
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      await deletePendingOrders(data.orderIds);
      localStorage.removeItem('pendingOrder');
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    
    // Tema kontrolü
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Sipariş verilerini al
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      const parsed = JSON.parse(pendingOrder);
      setOrderData(parsed);
      orderDataRef.current = parsed;
      
      // Kalan süreyi hesapla
      if (parsed.paymentStartTime) {
        const elapsed = Math.floor((Date.now() - parsed.paymentStartTime) / 1000);
        const remaining = Math.max(0, PAYMENT_TIMEOUT_SECONDS - elapsed);
        setRemainingTime(remaining);
        
        if (remaining === 0) {
          setTimeoutExpired(true);
        }
      }
    }

    // Sayfa kapatılırken/yenilenirken cleanup
    const handleBeforeUnload = () => {
      if (!paymentSuccess && orderDataRef.current?.orderIds) {
        const data = orderDataRef.current;
        
        // Sepeti geri yükle (localStorage senkron çalışır)
        if (data.items && data.items.length > 0) {
          const existingCart = localStorage.getItem('cartItems');
          const currentItems = existingCart ? JSON.parse(existingCart) : [];
          const restoredCart = [...currentItems, ...data.items];
          localStorage.setItem('cartItems', JSON.stringify(restoredCart));
        }
        
        // pendingOrder'ı sil (sayfa yenilenince ödeme sayfasına dönmesin)
        localStorage.removeItem('pendingOrder');
        
        // Veritabanından sil
        navigator.sendBeacon('/api/cleanup-orders', JSON.stringify({ orderIds: data.orderIds }));
      }
    };

    // Browser geri butonu için - history'ye state ekle
    window.history.pushState({ paymentPage: true }, '', window.location.href);
    
    // Geri butonu tıklandığında cleanup yap ve sepeti geri yükle
    const handlePopState = (e: PopStateEvent) => {
      if (!paymentSuccess && orderDataRef.current?.orderIds) {
        // Sepeti geri yükle
        const data = orderDataRef.current;
        if (data?.items && data.items.length > 0) {
          const existingCart = localStorage.getItem('cartItems');
          const currentItems = existingCart ? JSON.parse(existingCart) : [];
          const restoredCart = [...currentItems, ...data.items];
          localStorage.setItem('cartItems', JSON.stringify(restoredCart));
          window.dispatchEvent(new Event('cartUpdated'));
        }
        
        // Veritabanından sil
        const orderIds = orderDataRef.current.orderIds;
        navigator.sendBeacon('/api/cleanup-orders', JSON.stringify({ orderIds }));
        localStorage.removeItem('pendingOrder');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [paymentSuccess]);

  // Sipariş verisi yoksa sepete yönlendir (sayfa yenilendiğinde)
  useEffect(() => {
    if (isClient && !orderData && !localStorage.getItem('pendingOrder')) {
      router.push('/sepet');
    }
  }, [isClient, orderData, router]);

  // Geri sayım timer
  useEffect(() => {
    if (!isClient || !orderData || paymentSuccess || timeoutExpired) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeoutExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isClient, orderData, paymentSuccess, timeoutExpired]);

  // Timeout olduğunda cleanup
  useEffect(() => {
    if (timeoutExpired && orderData?.orderIds) {
      cleanupPendingOrders();
    }
  }, [timeoutExpired, orderData, cleanupPendingOrders]);

  // Süre formatı (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    
    if (!orderData || timeoutExpired) return;

    setIsProcessing(true);

    try {
      /**
       * TODO: iyzico Entegrasyonu
       * 
       * Ödeme payload'ı hazırla:
       * const paymentPayload = {
       *   cardNumber: cardData.cardNumber.replace(/\s/g, ''),
       *   cardHolderName: cardData.cardName,
       *   expireMonth: cardData.expiryDate.split('/')[0],
       *   expireYear: '20' + cardData.expiryDate.split('/')[1],
       *   cvc: cardData.cvv,
       *   installment: selectedInstallment, // Seçilen taksit sayısı
       *   price: orderData.totalPrice,
       *   paidPrice: selectedInstallmentOption?.totalAmount || orderData.totalPrice,
       *   // ... diğer iyzico parametreleri
       * };
       * 
       * const paymentResult = await fetch('/api/iyzico/payment', {
       *   method: 'POST',
       *   body: JSON.stringify(paymentPayload)
       * });
       */
      
      // Seçilen taksit bilgisi - iyzico entegrasyonunda kullanılacak
      const selectedInstallmentOption = installmentOptions.find(opt => opt.count === selectedInstallment);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const paymentInfo = {
        installmentCount: selectedInstallment,
        totalAmount: selectedInstallmentOption?.totalAmount || orderData.totalPrice,
        installmentAmount: selectedInstallmentOption?.installmentAmount || orderData.totalPrice,
      };
      // TODO: iyzico entegrasyonunda paymentInfo kullanılacak
      
      // Siparişlerin durumunu "Hazırlanıyor" olarak güncelle
      if (orderData.orderIds && orderData.orderIds.length > 0) {
        const { success, error } = await confirmOrders(orderData.orderIds);
        
        if (!success) {
          throw new Error(error || 'Sipariş onaylanamadı');
        }
      }

      // Başarılı - cleanup yapılmasın
      cleanupDoneRef.current = true;
      setPaymentSuccess(true);

      // Sipariş onay e-postası gönder (her ürün için)
      // E-posta hatası ödeme akışını engellemez
      try {
        for (const item of orderData.items) {
          // eventDate + 3 gün = en geç iade tarihi
          const eventDateObj = new Date(item.date);
          const returnDateObj = new Date(eventDateObj);
          returnDateObj.setDate(returnDateObj.getDate() + 3);
          
          // Taksit bilgilerini hesapla
          const selectedOption = installmentOptions.find(opt => opt.count === selectedInstallment);
          const basePrice = item.price;
          const installmentFee = selectedOption && selectedInstallment > 1 
            ? (selectedOption.totalAmount - orderData.totalPrice) 
            : 0;
          
          await fetch('/api/send-order-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
              email: orderData.customer.email,
              productName: item.title,
              size: item.size,
              color: item.color,
              price: basePrice,
              shippingCost: orderData.shippingCost > 0 ? orderData.shippingCost : undefined,
              installmentCount: selectedInstallment > 1 ? selectedInstallment : undefined,
              installmentFee: installmentFee > 0 ? installmentFee : undefined,
              totalPaid: selectedOption?.totalAmount || orderData.totalPrice,
              eventDate: item.date,
              returnDate: returnDateObj.toISOString().split('T')[0],
              status: 'Hazırlanıyor',
              address: `${orderData.shippingAddress.address}, ${orderData.shippingAddress.district}, ${orderData.shippingAddress.city}`
            }),
          });
        }
      } catch (emailError) {
        // E-posta hatası ödeme akışını engellemez - sadece log'la
        console.error('Sipariş onay e-postası gönderilemedi:', emailError);
      }
      
      // Sepeti ve sipariş verilerini temizle
      localStorage.removeItem('cartItems');
      localStorage.removeItem('pendingOrder');
      
      // 3 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error) {
      console.error('Ödeme hatası:', error);
      alert('Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Timeout veya iptal durumu
  const handleCancel = async () => {
    await cleanupPendingOrders(true); // Sepeti geri yükle + DB'den sil
    router.push('/sepet');
  };

  if (!isClient || !orderData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  // Timeout expired ekranı
  if (timeoutExpired) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center p-8 max-w-md">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
            <i className={`ri-time-line text-4xl ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}></i>
          </div>
          <h1 className={`text-2xl font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Ödeme Süresi Doldu
          </h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            5 dakikalık ödeme süresi doldu. Güvenlik nedeniyle rezervasyonunuz iptal edildi.
            Lütfen tekrar deneyin.
          </p>
          <button
            onClick={() => router.push('/sepet')}
            className={`px-8 py-3 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            Sepete Dön
          </button>
        </div>
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
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button 
            onClick={handleCancel}
            className={`flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            <i className="ri-arrow-left-line"></i>
            <span className="hidden sm:inline">İptal</span>
          </button>
          <div className="text-center flex-1">
            <h1 className={`text-sm sm:text-lg font-light tracking-[0.15em] sm:tracking-[0.2em] font-serif italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
              MERYEM BALKAN
            </h1>
            <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Güvenli Ödeme
            </p>
          </div>
          {/* Kalan süre göstergesi */}
          <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm ${
            remainingTime <= 60 
              ? isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
              : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <i className="ri-time-line"></i>
            <span className="font-mono font-medium">{formatTime(remainingTime)}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Sol - Kart Bilgileri */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Kart Bilgileri
              </h2>
              <PaymentMarks />
            </div>

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

              {/* Taksit Seçimi - BIN Tabanlı Dinamik Sistem */}
              {/* TODO: iyzico entegrasyonunda installmentOptions gerçek veriden gelecek */}
              {installmentOptions.length > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Taksit Seçenekleri
                    </label>
                    {cardType && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {cardType}
                      </span>
                    )}
                  </div>
                  
                  {isLoadingInstallments ? (
                    <div className={`flex items-center justify-center p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Taksit seçenekleri yükleniyor...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Taksit Seçenekleri - Radio Button Listesi */}
                      <div className={`rounded-lg overflow-hidden border ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        {installmentOptions.map((option, index) => {
                          const isSelected = selectedInstallment === option.count;
                          const isLastItem = index === installmentOptions.length - 1;
                          
                          return (
                            <label
                              key={option.count}
                              className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                !isLastItem ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : ''
                              } ${
                                isSelected
                                  ? isDarkMode
                                    ? 'bg-white/10'
                                    : 'bg-black/5'
                                  : isDarkMode
                                    ? 'hover:bg-white/5'
                                    : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Custom Radio */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? isDarkMode
                                      ? 'border-white bg-white'
                                      : 'border-black bg-black'
                                    : isDarkMode
                                      ? 'border-gray-500'
                                      : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <div className={`w-2 h-2 rounded-full ${
                                      isDarkMode ? 'bg-black' : 'bg-white'
                                    }`}></div>
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  name="installment"
                                  value={option.count}
                                  checked={isSelected}
                                  onChange={() => setSelectedInstallment(option.count)}
                                  className="sr-only"
                                />
                                <div>
                                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {option.count === 1 ? 'Tek Çekim' : `${option.count} Taksit`}
                                  </span>
                                  {option.count > 1 && (
                                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {option.installmentAmount.toLocaleString('tr-TR')} ₺ × {option.count}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                  {option.totalAmount.toLocaleString('tr-TR')} ₺
                                </div>
                                {option.interestRate > 0 && (
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    +%{option.interestRate} faiz
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      
                      {/* Bilgi Metni */}
                      <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="inline w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        Taksit seçenekleri kart ve banka uygunluğuna göre sunulmaktadır.
                      </p>
                    </>
                  )}
                </div>
              )}
              
              {/* Kart numarası girilmemişken taksit bilgisi */}
              {cardData.cardNumber.replace(/\s/g, '').length < 6 && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <svg className="inline w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Taksit seçeneklerini görmek için kart numaranızı girin.
                </p>
              )}
              
              {/* Taksit yok - Sadece tek çekim */}
              {installmentOptions.length === 1 && cardData.cardNumber.replace(/\s/g, '').length >= 6 && (
                <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Bu kart için sadece tek çekim ödeme seçeneği mevcuttur.</span>
                  </div>
                </div>
              )}

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
                  (() => {
                    // Taksitli ödeme seçildiyse taksitli tutarı göster
                    const selectedOption = installmentOptions.find(opt => opt.count === selectedInstallment);
                    const displayAmount = selectedOption?.totalAmount || orderData.totalPrice;
                    return `${displayAmount.toLocaleString('tr-TR')} TL Öde`;
                  })()
                )}
              </button>
            </form>
          </div>

          {/* Sağ - Sipariş Özeti */}
          <div className={`p-4 sm:p-6 rounded-xl h-fit ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className={`text-lg sm:text-xl font-medium mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Sipariş Özeti
            </h2>

            {/* Ürünler */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-md overflow-hidden flex-shrink-0">
                    <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.color} / {item.size}
                    </p>
                    {item.date && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <i className="ri-calendar-line mr-1"></i>
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
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
              {/* Toplam - Taksit seçimine göre dinamik */}
              {(() => {
                const selectedOption = installmentOptions.find(opt => opt.count === selectedInstallment);
                const finalTotal = selectedOption?.totalAmount || orderData.totalPrice;
                const hasDifference = selectedOption && selectedOption.totalAmount !== orderData.totalPrice;
                
                return (
                  <>
                    <div className={`flex justify-between text-lg font-medium pt-3 border-t ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-black'}`}>
                      <span>Toplam</span>
                      <span>{finalTotal.toLocaleString('tr-TR')} TL</span>
                    </div>
                    
                    {/* Taksit Detayları */}
                    {selectedInstallment > 1 && selectedOption && (
                      <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                        <div className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span>Taksit</span>
                          <span>{selectedInstallment} × {selectedOption.installmentAmount.toLocaleString('tr-TR')} TL</span>
                        </div>
                        {hasDifference && (
                          <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            +%{selectedOption.interestRate} vade farkı uygulanmıştır
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
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


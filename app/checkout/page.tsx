'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginModal from '../components/LoginModal';
import { useState, useEffect } from 'react';
import { checkCartConflicts, createPendingOrders } from '../utils/rentalConflict';

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

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  color: string;
  size: string;
  date: string;
  image: string;
}

interface ConflictInfo {
  itemTitle: string;
  reason: string;
}

export default function Checkout() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [billingAddressOption, setBillingAddressOption] = useState<'same' | 'different'>('same');
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictItems, setConflictItems] = useState<ConflictInfo[]>([]);
  const [validItemsForPayment, setValidItemsForPayment] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    country: 'Türkiye',
    district: '',
  });

  useEffect(() => {
    setIsClient(true);
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }

      // ✅ Sepeti localStorage'dan çek
      const storedCart = localStorage.getItem("cartItems");
      if (storedCart) {
        const parsed: CartItem[] = JSON.parse(storedCart);
        setCartItems(parsed);

        if (parsed.length > 0) {
          setLoadingPrices(true); // 🔹 fiyat yükleniyor durumu başlat
          fetch("/api/get-prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productIds: parsed.map((item: CartItem) => item.productId),
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                const merged = parsed.map((item: CartItem) => {
                  // "5_Altın_Sarısı_36_2025-10-22" → "5"
                  const realId = String(item.productId).split('_')[0];

                  const found = data.find((p) => String(p.id) === realId);

                  return {
                    ...item,
                    price: found
                      ? Number(String(found.price).replace(/\./g, '').replace(',', '.'))
                      : 0,
                  };
                });
                setCartItems(merged);
              } else {
                console.error("Beklenmeyen API yanıtı:", data);
              }
            })
            .catch((err) => console.error("Fiyatlar yüklenemedi:", err))
            .finally(() => setLoadingPrices(false)); // 🔹 fiyatlar geldi
        } else {
          setLoadingPrices(false);
        }
      } else {
        setLoadingPrices(false);
      }
    } catch (e) {
      console.warn("Unable to access localStorage:", e);
      setLoadingPrices(false);
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (e) {
        console.warn('Unable to write theme to localStorage:', e);
      }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch (e) {
        console.warn('Unable to write theme to localStorage:', e);
      }
    }
  };

  const showNavBackground = isClient && scrollY > 50;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Hata varsa temizle
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Tüm alanların dolu olup olmadığını kontrol et
  const isFormComplete = (): boolean => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.address.trim() !== '' &&
      formData.district.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.postalCode.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.email.trim() !== '' &&
      deliveryMethod !== '' &&
      cartItems.length > 0
    );
  };

  // Form validasyonu
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'Ad zorunludur';
    if (!formData.lastName.trim()) errors.lastName = 'Soyad zorunludur';
    if (!formData.address.trim()) errors.address = 'Adres zorunludur';
    if (!formData.district.trim()) errors.district = 'İlçe zorunludur';
    if (!formData.city.trim()) errors.city = 'Şehir zorunludur';
    if (!formData.postalCode.trim()) errors.postalCode = 'Posta kodu zorunludur';
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon numarası zorunludur';
    } else if (!/^[0-9\s]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Geçerli bir telefon numarası giriniz';
    }
    if (!formData.email.trim()) {
      errors.email = 'E-posta adresi zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    if (!deliveryMethod) errors.deliveryMethod = 'Teslimat yöntemi seçiniz';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!validateForm()) {
      // İlk hatalı alana scroll
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 🔹 ADIM 1: Çakışma kontrolü yap
      const { conflicts, validItems } = await checkCartConflicts(cartItems);
      
      if (conflicts.length > 0) {
        // Çakışma var - modal göster
        setConflictItems(conflicts.map(c => ({
          itemTitle: c.item.title,
          reason: c.reason
        })));
        setValidItemsForPayment(validItems);
        setShowConflictModal(true);
        setIsSubmitting(false);
        return;
      }
      
      // 🔹 ADIM 2: Çakışma yok - siparişleri "Ödeme Yapıyor" olarak kaydet
      await proceedToPayment(cartItems);
      
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      setFormErrors({ submit: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
      setIsSubmitting(false);
    }
  };

  // Ödeme sayfasına geçiş işlemi
  const proceedToPayment = async (itemsToProcess: CartItem[]) => {
    setIsSubmitting(true);
    
    try {
      const fullAddress = `${formData.address}, ${formData.district}, ${formData.city} ${formData.postalCode}`;
      
      // Siparişleri "Ödeme Yapıyor" olarak kaydet
      const { success, orderIds, error } = await createPendingOrders(
        itemsToProcess,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
        fullAddress
      );
      
      if (!success) {
        throw new Error(error || 'Sipariş oluşturulamadı');
      }
      
      // Sipariş verilerini hazırla
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
        shippingAddress: {
          address: formData.address,
          district: formData.district,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        billingAddress: billingAddressOption === 'same' 
          ? null
          : formData,
        deliveryMethod,
        items: itemsToProcess,
        subtotal: itemsToProcess.reduce((sum, item) => {
          const cleanPrice = Number(String(item.price || 0).replace(/\./g, '').replace(',', '.'));
          return sum + (isNaN(cleanPrice) ? 0 : cleanPrice);
        }, 0),
        shippingCost,
        totalPrice: itemsToProcess.reduce((sum, item) => {
          const cleanPrice = Number(String(item.price || 0).replace(/\./g, '').replace(',', '.'));
          return sum + (isNaN(cleanPrice) ? 0 : cleanPrice);
        }, 0) + (Number(shippingCost) || 0),
        orderIds, // Ödeme sayfasında kullanılacak
        createdAt: new Date().toISOString(),
        paymentStartTime: Date.now(), // 5 dk timeout için başlangıç zamanı
      };

      // Sipariş verilerini localStorage'a kaydet
      localStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      // Sepeti güncelle (sadece işlenen ürünleri kaldır)
      const remainingItems = cartItems.filter(
        item => !itemsToProcess.find(processed => processed.id === item.id)
      );
      localStorage.setItem('cartItems', JSON.stringify(remainingItems));
      window.dispatchEvent(new Event('cartUpdated'));

      // Ödeme sayfasına yönlendir
      router.push('/odeme');
    } catch (error) {
      console.error('Ödeme işlemi hatası:', error);
      setFormErrors({ submit: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Çakışma modalında "Evet" - Kalan ürünlerle devam et
  const handleConflictContinue = async () => {
    setShowConflictModal(false);
    
    if (validItemsForPayment.length === 0) {
      // Hiç geçerli ürün kalmadı - anasayfaya yönlendir
      localStorage.setItem('cartItems', '[]');
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/');
      return;
    }
    
    // Çakışan ürünleri sepetten kaldır ve kalan ürünlerle devam et
    setCartItems(validItemsForPayment);
    localStorage.setItem('cartItems', JSON.stringify(validItemsForPayment));
    window.dispatchEvent(new Event('cartUpdated'));
    
    await proceedToPayment(validItemsForPayment);
  };

  // Çakışma modalında "Hayır" - İşlemi iptal et
  const handleConflictCancel = () => {
    setShowConflictModal(false);
    
    // Çakışan ürünleri sepetten kaldır
    localStorage.setItem('cartItems', JSON.stringify(validItemsForPayment));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Anasayfaya yönlendir
    router.push('/');
  };

  // ✅ Teslimat ücreti
  const shippingCost =
    deliveryMethod === 'pickup'
      ? 0
      : deliveryMethod === 'shipping'
        ? 500
        : 0;

  // ✅ Güvenli alt toplam (string, "12.000", "12,000" gibi tüm formatları destekler)
  const subtotal = cartItems.reduce((sum, item) => {
    const cleanPrice = Number(String(item.price || 0).replace(/\./g, '').replace(',', '.'));
    return sum + (isNaN(cleanPrice) ? 0 : cleanPrice);
  }, 0);

  // ✅ Toplam (sayısal toplama)
  const totalPrice = subtotal + (Number(shippingCost) || 0);

  const storeAddress = {
    name: "Meryem Balkan Atölye",
    fullAddress: "Atatürk Mahallesi, Muhsin Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan",
    mail: "meryembalkantasarimatölye@gmail.com"
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'
        }`}
      suppressHydrationWarning={true}
    >
      {/* Navigation - önceki kod aynı */}
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground
          ? isDarkMode
            ? 'bg-gray-900 shadow-sm'
            : 'bg-white shadow-sm'
          : isDarkMode
            ? 'bg-gray-900'
            : 'bg-white'
          }`}
      >
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex justify-between items-center w-full mb-4">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-lg`}></i>
            </button>

            <div className="text-center">
              <h1
                className={`text-xl font-light tracking-[0.3em] font-serif transition-colors italic ${isDarkMode ? 'text-white' : 'text-black'
                  }`}
              >
                MERYEM BALKAN
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/sepet"
                className={`${isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
                  }`}
              >
                <i className="ri-shopping-bag-line text-lg"></i>
              </Link>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
                  }`}
              >
                <i className="ri-user-line text-lg"></i>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium tracking-wide text-center">
            <Link
              href="/"
              className={`cursor-pointer transition-colors font-light ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              ANASAYFA
            </Link>
            <Link
              href="/portfolio"
              className={`cursor-pointer transition-colors font-light ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              ELBİSELER
            </Link>
            <Link
              href="/hakkimda"
              className={`cursor-pointer transition-colors font-light ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              HAKKIMDA
            </Link>
            <Link
              href="/iletisim"
              className={`cursor-pointer transition-colors font-light ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              İLETİŞİM
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb - önceki kod aynı */}
      <section
        className={`px-8 py-4 border-b pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}
      >
        <div className="max-w-6xl mx-auto">
          <div
            className={`flex items-center text-sm transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
          >
            <Link
              href="/sepet"
              className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                }`}
            >
              Sepet
            </Link>
            <i className="ri-arrow-right-s-line mx-2"></i>
            <span
              className={`transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                }`}
            >
              İletişim Bilgileri
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="pt-6 pb-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
            {/* Sol Taraf - Form */}
            <div className="space-y-8">
              {/* Teslimat Seçenekleri */}
              <div>
                <h3
                  className={`text-xl font-medium mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Teslimat
                </h3>

                <div className="space-y-4">
                  {/* Mağazadan Teslim Al */}
                  <div
                    className={`p-4 border cursor-pointer transition-all ${deliveryMethod === 'pickup'
                      ? isDarkMode
                        ? 'border-white bg-gray-800'
                        : 'border-black bg-gray-50'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-800'
                        : 'border-gray-300 bg-white'
                      }`}
                    onClick={() => setDeliveryMethod('pickup')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${deliveryMethod === 'pickup'
                            ? isDarkMode
                              ? 'border-white'
                              : 'border-black'
                            : isDarkMode
                              ? 'border-gray-400'
                              : 'border-gray-300'
                            }`}
                        >
                          {deliveryMethod === 'pickup' && (
                            <div
                              className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'
                                }`}
                            ></div>
                          )}
                        </div>
                        <span
                          className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          Mağazadan Teslim Al
                        </span>
                      </div>
                      <span
                        className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Ücretsiz
                      </span>
                    </div>

                    {/* Mağaza Adresi - Sadece pickup seçildiğinde görüntülenir */}
                    {deliveryMethod === 'pickup' && (
                      <div
                        className={`mt-4 pt-4 border-t text-sm transition-colors ${isDarkMode
                          ? 'border-gray-600 text-gray-300'
                          : 'border-gray-200 text-gray-600'
                          }`}
                      >
                        <div className="space-y-1">
                          <p
                            className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                              }`}
                          >
                            {storeAddress.name}
                          </p>
                          <p>{storeAddress.fullAddress}</p>
                          <p>{storeAddress.mail}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kargo ile Gönderim */}
                  <div
                    className={`p-4 border cursor-pointer transition-all ${deliveryMethod === 'shipping'
                      ? isDarkMode
                        ? 'border-white bg-gray-800'
                        : 'border-black bg-gray-50'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-800'
                        : 'border-gray-300 bg-white'
                      }`}
                    onClick={() => setDeliveryMethod('shipping')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${deliveryMethod === 'shipping'
                            ? isDarkMode
                              ? 'border-white'
                              : 'border-black'
                            : isDarkMode
                              ? 'border-gray-400'
                              : 'border-gray-300'
                            }`}
                        >
                          {deliveryMethod === 'shipping' && (
                            <div
                              className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'
                                }`}
                            ></div>
                          )}
                        </div>
                        <span
                          className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          Kargo ile Gönderim
                        </span>
                      </div>
                      <span
                        className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        500TL
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ödeme Yöntemi */}
              <div>
                <h3
                  className={`text-xl font-medium mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Ödeme
                </h3>

                <div
                  className={`p-4 border cursor-pointer transition-all ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isDarkMode ? 'border-white' : 'border-black'
                          }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'
                            }`}
                        ></div>
                      </div>
                      <span
                        className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Kredi / Banka Kartı
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri - Her zaman görüntülenir */}
              <div>
                <h3
                  className={`text-xl font-medium mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  {deliveryMethod === 'pickup' ? 'Fatura Adresi' : 'Teslimat Adresi'}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="country"
                      className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                        }`}
                    >
                      Ülke/Bölge *
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country || 'Türkiye'}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border focus:outline-none text-sm pr-8 transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                        : 'bg-white border-gray-300 text-black focus:border-black'
                        }`}
                    >
                      <option value="Türkiye">Türkiye</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Ad *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                          : 'bg-white border-gray-300 text-black focus:border-black'
                          }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Soyad *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                          : 'bg-white border-gray-300 text-black focus:border-black'
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                        }`}
                    >
                      Adres *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Tam adresinizi giriniz"
                      className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white placeholder:text-gray-400'
                        : 'bg-white border-gray-300 text-black focus:border-black placeholder:text-gray-500'
                        }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="district"
                      className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                        }`}
                    >
                      İlçe *
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                        : 'bg-white border-gray-300 text-black focus:border-black'
                        }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="postalCode"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Posta kodu *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                          : 'bg-white border-gray-300 text-black focus:border-black'
                          }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="city"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Şehir *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                          : 'bg-white border-gray-300 text-black focus:border-black'
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                        }`}
                    >
                      Telefon Numarası *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="0 5XX XXX XX XX"
                      className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white placeholder:text-gray-400'
                        : 'bg-white border-gray-300 text-black focus:border-black placeholder:text-gray-500'
                        }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                        }`}
                    >
                      E-posta Adresi *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="ornek@email.com"
                      className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white placeholder:text-gray-400'
                        : 'bg-white border-gray-300 text-black focus:border-black placeholder:text-gray-500'
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Fatura Adresi */}
              <div>
                <h3
                  className={`text-xl font-medium mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Fatura Adresi
                </h3>

                <div className="space-y-4">
                  {/* Gönderim adresi ile aynı */}
                  <div
                    className={`p-4 border cursor-pointer transition-all ${billingAddressOption === 'same'
                      ? isDarkMode
                        ? 'border-white bg-gray-800'
                        : 'border-black bg-gray-50'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-800'
                        : 'border-gray-300 bg-white'
                      }`}
                    onClick={() => setBillingAddressOption('same')}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${billingAddressOption === 'same'
                          ? isDarkMode
                            ? 'border-white'
                            : 'border-black'
                          : isDarkMode
                            ? 'border-gray-400'
                            : 'border-gray-300'
                          }`}
                      >
                        {billingAddressOption === 'same' && (
                          <div
                            className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'
                              }`}
                          ></div>
                        )}
                      </div>
                      <span
                        className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Gönderim adresi ile aynı
                      </span>
                    </div>
                  </div>

                  {/* Farklı fatura adresi */}
                  <div
                    className={`p-4 border cursor-pointer transition-all ${billingAddressOption === 'different'
                      ? isDarkMode
                        ? 'border-white bg-gray-800'
                        : 'border-black bg-gray-50'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-800'
                        : 'border-gray-300 bg-white'
                      }`}
                    onClick={() => setBillingAddressOption('different')}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${billingAddressOption === 'different'
                          ? isDarkMode
                            ? 'border-white'
                            : 'border-black'
                          : isDarkMode
                            ? 'border-gray-400'
                            : 'border-gray-300'
                          }`}
                      >
                        {billingAddressOption === 'different' && (
                          <div
                            className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'
                              }`}
                          ></div>
                        )}
                      </div>
                      <span
                        className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Farklı bir fatura adresi kullan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Eğer farklı adres seçildiyse yeni form aç */}
                {billingAddressOption === 'different' && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label
                        htmlFor="country"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Ülke/Bölge *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country || 'Türkiye'}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border focus:outline-none text-sm pr-8 transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                          : 'bg-white border-gray-300 text-black focus:border-black'
                          }`}
                      >
                        <option value="Türkiye">Türkiye</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="firstName"
                          className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          Ad *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                            : 'bg-white border-gray-300 text-black focus:border-black'
                            }`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          Soyad *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                            : 'bg-white border-gray-300 text-black focus:border-black'
                            }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Adres *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="Tam adresinizi giriniz"
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white placeholder:text-gray-400'
                          : 'bg-white border-gray-300 text-black focus:border-black placeholder:text-gray-500'
                          }`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="district"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        İlçe *
                      </label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                          : 'bg-white border-gray-300 text-black focus:border-black'
                          }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="postalCode"
                          className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          Posta kodu *
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                            : 'bg-white border-gray-300 text-black focus:border-black'
                            }`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="city"
                          className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          Şehir *
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                            : 'bg-white border-gray-300 text-black focus:border-black'
                            }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        Telefon Numarası *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="0 5XX XXX XX XX"
                        className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-white placeholder:text-gray-400'
                          : 'bg-white border-gray-300 text-black focus:border-black placeholder:text-gray-500'
                          }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ Taraf - Dinamik Sipariş Özeti */}
            <div
              className={`space-y-5 h-fit ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 sm:p-5 md:p-6 rounded-xl lg:sticky lg:top-32`}
            >
              <h3
                className={`text-xl font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                  }`}
              >
                Sipariş Özeti
              </h3>

              {/* Dinamik Ürün Listesi */}
              <div className="space-y-4">
                {loadingPrices ? (
                  <div className="text-center py-10 text-gray-500 animate-pulse">
                    Fiyatlar yükleniyor...
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>Sepetiniz boş</p>
                    <Link
                      href="/portfolio"
                      className={`inline-block mt-4 px-6 py-2 border rounded-full text-sm transition-colors ${isDarkMode
                        ? 'border-gray-600 text-white hover:bg-gray-700'
                        : 'border-gray-300 text-black hover:bg-gray-100'
                        }`}
                    >
                      Alışverişe Başla
                    </Link>
                  </div>
                ) : (

                  cartItems.map((item, index) => (

                    <div
                      key={item.id}
                      className={`flex items-center space-x-4 pb-4 ${index < cartItems.length - 1 ? 'border-b border-gray-200' : ''
                        }`}
                    >
                      <div className="w-14 h-18 sm:w-16 sm:h-20 flex-shrink-0 overflow-hidden rounded-md">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {item.title}
                        </h4>
                        <p
                          className={`text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                          {item.color} / {item.size}
                        </p>
                        <p
                          className={`text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                          {new Date(item.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {item.price.toLocaleString('tr-TR')} TL
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Fiyat Detayları - Sadece sepet dolu ise göster */}
              {!loadingPrices && cartItems.length > 0 && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span
                        className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}
                      >
                        Ara toplam
                      </span>
                      <span
                        className={`transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        {subtotal.toLocaleString('tr-TR')}TL
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span
                        className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}
                      >
                        {deliveryMethod === 'pickup'
                          ? 'Mağazadan Teslim Al'
                          : deliveryMethod === 'shipping'
                            ? 'Kargo'
                            : 'Teslimat'}
                      </span>
                      <span
                        className={`transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        {deliveryMethod === 'pickup'
                          ? 'Ücretsiz'
                          : deliveryMethod === 'shipping'
                            ? '500TL'
                            : 'Seçiniz'}
                      </span>
                    </div>

                    <div
                      className={`flex justify-between text-lg font-medium pt-3 border-t transition-colors ${isDarkMode
                        ? 'border-gray-600 text-white'
                        : 'border-gray-200 text-black'
                        }`}
                    >
                      <span>Toplam</span>
                      <span>{totalPrice.toLocaleString('tr-TR')}TL</span>
                    </div>
                  </div>

                  {/* Sipariş Tamamla Butonu */}
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormComplete() || isSubmitting}
                    className={`w-full py-4 px-8 rounded-full font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${!isFormComplete() || isSubmitting
                      ? isDarkMode
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-black text-white hover:bg-gray-900'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        İşleniyor...
                      </>
                    ) : (
                      'Ödemeye Geç'
                    )}
                  </button>
                  {/* Bilgilendirme yazısı */}
                  <div className="mt-3 flex flex-col items-center text-center">
                    <p className="text-xs text-gray-500 max-w-[250px] leading-snug">
                      Siparişi tamamla dedikten sonra <span className="font-semibold text-gray-700">ödeme sayfasına</span> yönlendirileceksiniz.
                    </p>
                  </div>
                </>
              )}

              <div className="text-center">
                <Link
                  href="/sepet"
                  className={`inline-flex items-center space-x-2 cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'
                    }`}
                >
                  <i className="ri-arrow-left-line"></i>
                  <span>Sepete dön</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - önceki kod aynı */}
      <footer className={`py-12 sm:py-16 px-4 sm:px-6 md:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer rounded-full ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`} aria-label="Instagram">
                  <i className="ri-instagram-line text-lg"></i>
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">KURUMSAL</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li><Link href="/hakkimda" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Hakkımızda</Link></li>
                <li><Link href="/iletisim" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>İletişime Geç</Link></li>
                <li><Link href="/gizlilik-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>KVKK</Link></li>
                <li><Link href="/aydinlatma-metni" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Aydınlatma Metni</Link></li>
                <li><Link href="/kiralama-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Kiralama Sözleşmesi ve Yükümlülükleri</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">İLETİŞİM</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li className="break-all">meryembalkantasarimatölye@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; Meryem Balkan.</p>
          </div>
        </div>
      </footer>

      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl w-full max-w-md p-6 shadow-2xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <i className={`ri-error-warning-line text-3xl ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}></i>
              </div>
              <h3 className="text-xl font-medium mb-2">Ürün Müsaitlik Sorunu</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Bazı ürünler seçtiğiniz tarihlerde artık müsait değil:
              </p>
            </div>

            <div className={`max-h-48 overflow-y-auto mb-6 space-y-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg p-4`}>
              {conflictItems.map((conflict, index) => (
                <div key={index} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{conflict.itemTitle}</span>
                  <p className="mt-0.5">{conflict.reason}</p>
                </div>
              ))}
            </div>

            {validItemsForPayment.length > 0 ? (
              <>
                <p className={`text-sm mb-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Diğer {validItemsForPayment.length} ürün ile devam etmek ister misiniz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConflictCancel}
                    className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'border border-gray-600 text-white hover:bg-gray-700' : 'border border-gray-300 text-black hover:bg-gray-100'}`}
                  >
                    Hayır, İptal Et
                  </button>
                  <button
                    onClick={handleConflictContinue}
                    className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    Evet, Devam Et
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={`text-sm mb-4 text-center ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                  Sepetinizdeki tüm ürünler artık müsait değil.
                </p>
                <button
                  onClick={handleConflictCancel}
                  className={`w-full py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  Anasayfaya Dön
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

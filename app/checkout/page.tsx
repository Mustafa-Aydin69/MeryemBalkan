'use client';
import Link from 'next/link';
import LoginModal from '../components/LoginModal';
import { useState, useEffect } from 'react';

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

export default function Checkout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [billingAddressOption, setBillingAddressOption] = useState<'same' | 'different'>('same');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    country: '',
    tcNumber: '',
    district: '',
  });

  useEffect(() => {
    setIsClient(true);
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      // ✅ Sepeti localStorage'dan çek
      const storedCart = localStorage.getItem('cartItems');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.warn('Unable to access localStorage:', e);
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Order data:', { deliveryMethod, formData, cartItems });
  };

  const shippingCost = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'shipping' ? 50 : 0;
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = subtotal + shippingCost;

  const storeAddress = {
    name: "Meryem Balkan Atölye",
    fullAddress: "Atatürk Mahallesi, Muhsin Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan",
    mail: "meryembalkantasarımatölyesi@gmail.com"
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
        <div className="flex flex-col items-center px-8 py-6">
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

          <div className="flex space-x-8 text-sm font-medium tracking-wide">
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
      <div className="pt-8 pb-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                        50TL
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
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">VISA</span>
                        </div>
                        <div className="w-8 h-5 bg-red-500 rounded-sm"></div>
                        <div className="w-8 h-5 bg-blue-500 rounded-sm"></div>
                        <div className="w-8 h-5 bg-yellow-500 rounded-sm"></div>
                        <div className="w-8 h-5 bg-gray-800 rounded-sm"></div>
                      </div>
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
                      htmlFor="tcNumber"
                      className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                        }`}
                    >
                      T.C. Kimlik Numarası *
                    </label>
                    <input
                      type="text"
                      id="tcNumber"
                      name="tcNumber"
                      value={formData.tcNumber}
                      onChange={handleInputChange}
                      required
                      maxLength={11}
                      pattern="[0-9]{11}"
                      placeholder="11 haneli T.C. kimlik numaranız"
                      className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white placeholder:text-gray-400'
                        : 'bg-white border-gray-300 text-black focus:border-black placeholder:text-gray-500'
                        }`}
                    />
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
              className={`space-y-6 h-fit ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                } p-6 rounded-lg lg:sticky lg:top-32`}
            >
              <h3
                className={`text-xl font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                  }`}
              >
                Sipariş Özeti
              </h3>

              {/* Dinamik Ürün Listesi */}
              <div className="space-y-4">
                {cartItems.length === 0 ? (
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
                      <div className="w-16 h-20 flex-shrink-0 overflow-hidden rounded">
                        <img
                          src={item.image}
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
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {item.price.toLocaleString('tr-TR')}TL
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Fiyat Detayları - Sadece sepet dolu ise göster */}
              {cartItems.length > 0 && (
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
                            ? '50TL'
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
                    disabled={cartItems.length === 0 || !deliveryMethod}
                    className={`w-full py-4 px-8 rounded-full font-medium transition-colors whitespace-nowrap ${cartItems.length === 0 || !deliveryMethod
                      ? isDarkMode
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-black text-white hover:bg-gray-900'
                      }`}
                  >
                    Siparişi Tamamla
                  </button>
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
      <footer
        className={`py-16 px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'
          }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h4 className="text-2xl font-light tracking-wide mb-4 font-serif italic">
                MERYEM BALKAN
              </h4>
              <p
                className={`mb-6 leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
              >
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/meryembalkan_ateiler/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  <i className="ri-instagram-line text-lg"></i>
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">KURUMSAL</h5>
              <ul
                className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
              >
                <li>
                  <Link
                    href="/hakkimda"
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                      }`}
                  >
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/iletisim"
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                      }`}
                  >
                    Randevu Al
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gizlilik-politikasi"
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                      }`}
                  >
                    Gizlilik Politikası
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kvkk"
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                      }`}
                  >
                    KVKK
                  </Link>
                </li>
                <li>
                  <Link
                    href="/aydinlatma-metni"
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                      }`}
                  >
                    Aydınlatma Metni
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kiralama-sozlesmesi"
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'
                      }`}
                  >
                    Kiralama Sözleşmesi ve Yükümlülükleri
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">İLETİŞİM</h5>
              <ul
                className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
              >
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarımatölyesi@gmail.com</li>
              </ul>
            </div>
          </div>

          <div
            className={`border-t mt-12 pt-8 text-center text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
              }`}
          >
            <p>&copy; 2025 Meryem Balkan.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

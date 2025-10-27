'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import LoginModal from '../../components/LoginModal';
import { addToCart } from '../../utils/cartUtils';
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import { tr } from "date-fns/locale";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IMAGE_BASE_URL = "https://orplwznpdpwnyflkbuoy.supabase.co/storage/v1/object/public/urunler/";

interface ProductDetailProps {
  productId: string;
}

interface Product {
  id: number;
  title: string;
  collection: string;
  year: string;
  price: number;
  description: string;
  features: string[];
  size: string[];
  colors: string[];
  images: string[];
  category: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [hasCartItems, setHasCartItems] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSizeImage, setShowSizeImage] = useState(false);
  const [showCalendarInfo, setShowCalendarInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  // Ürün verilerini Supabase'den çek
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("urunler")
        .select("*")
        .eq("id", productId)
        .eq("status", "Yayında")
        .single();

      if (error) {
        console.error("Ürün alınamadı:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log("Ürün bulunamadı");
        setLoading(false);
        return;
      }

      // Veriyi dönüştür
      const mappedProduct: Product = {
        id: data.id,
        title: data.title,
        collection: data.collection,
        year: data.year,
        price: data.price,
        description: data.description || 'Size özel tasarlanmış zarif elbise.',
        features: data.features && data.features.length > 0
          ? data.features
          : ['Özel tasarım', 'Kaliteli kumaş', 'Profesyonel işçilik'],
        size: data.size && data.size.length > 0
          ? data.size
          : ['36', '38', '40', '42'],
        colors: data.colors && data.colors.length > 0
          ? data.colors
          : ['Siyah', 'Lacivert'],
        images: data.images && data.images.length > 0
          ? data.images.map((img: string) => `${IMAGE_BASE_URL}${img}`)
          : ['/images/AnaSayfa/Meryem_Balkan_Logo.jpg'],
        category: data.category,
      };


      setProduct(mappedProduct);
      setLoading(false);

      // İlgili ürünleri çek
      fetchRelatedProducts(data.category, data.id);
    };

    fetchProduct();
  }, [productId]);
  //Günleri çek
  useEffect(() => {
    if (!product) return;

    const fetchDisabledDates = async () => {
      const { data, error } = await supabase
        .from("siparisler")
        .select("eventDate")
        .eq("productName", product.title);

      if (error) {
        console.error("Tarih bilgileri alınamadı:", error);
        return;
      }

      if (data) {
        const blocked: Date[] = [];

        data.forEach(({ eventDate }) => {
          if (!eventDate) return;
          const event = new Date(eventDate);
          for (let i = -7; i <= 7; i++) {
            const d = new Date(event);
            d.setDate(event.getDate() + i);
            blocked.push(d);
          }
        });

        setDisabledDates(blocked);
      }
    };

    fetchDisabledDates();
  }, [product]);

  // İlgili ürünleri çek
  const fetchRelatedProducts = async (category: string, currentId: number) => {
    const { data, error } = await supabase
      .from("urunler")
      .select("*")
      .eq("category", category)
      .eq("status", "Yayında")
      .neq("id", currentId)
      .limit(4);

    if (data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        collection: item.collection,
        price: item.price,
        images: item.images && Array.isArray(item.images) && item.images.length > 0
          ? `${IMAGE_BASE_URL}${item.images[0]}`
          : '/images/AnaSayfa/Meryem_Balkan_Logo.jpg',
        slug: `${item.id}-${item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      }));
      setRelatedProducts(mapped);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const checkCartItems = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItemCount(cartItems.length);
    };

    checkCartItems();
    window.addEventListener('storage', checkCartItems);
    window.addEventListener('cartUpdated', checkCartItems);

    return () => {
      window.removeEventListener('storage', checkCartItems);
      window.removeEventListener('cartUpdated', checkCartItems);
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize || !selectedColor || !date) {
      setNotification({
        message: 'Lütfen tüm alanları doldurun.',
        type: 'warning'
      });
      return;
    }
    // ⚖️ Kiralama sözleşmesi onayı kontrolü
    if (!acceptedTerms) {
      setNotification({
        message: 'Lütfen kiralama şartlarını onaylayın.',
        type: 'warning',
      });
      return;
    }

    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      setNotification({
        message: 'Başlangıç tarihi bugünden önce olamaz.',
        type: 'error'
      });
      return;
    }

    const result = addToCart(
      product.id.toString(),
      product.title,
      product.price,
      selectedColor,
      selectedSize,
      date ? date.toISOString().split("T")[0] : "",
      product.images[0]
    );

    setNotification({
      message: result.message,
      type: result.type
    });

    if (result.success) {
      setTimeout(() => {
        setSelectedColor('');
        setSelectedSize('');
        setDate(null);
        setNotification(null);
      }, 3000);
    }

    setTimeout(() => setNotification(null), 5000);
  };

  const showNavBackground = isClient && scrollY > 200;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <div className="text-center">
          <p className="mb-4">Ürün bulunamadı</p>
          <Link href="/portfolio" className="text-blue-500 hover:underline">
            Elbise koleksiyonuna dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900/90 backdrop-blur border-b border-gray-700' : 'bg-white/90 backdrop-blur border-b border-gray-200') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full max-w-7xl mx-auto">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-2 sm:mb-3 md:mb-4 gap-3">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
              aria-label="Tema Değiştir"
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-base sm:text-lg`}></i>
            </button>

            <div className="text-center flex-1">
              <h1 className={`text-base sm:text-lg md:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic break-words ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : 'text-white'}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
                aria-label="Sepet"
              >
                <i className={`ri-shopping-bag-line text-base sm:text-lg ${hasCartItems ? 'animate-bounce' : ''}`}></i>
              </Link>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
                aria-label="Giriş"
              >
                <i className="ri-user-line text-base sm:text-lg"></i>
              </button>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-30 p-4 rounded-lg border max-w-md w-full mx-4 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
          : notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
          <div className="flex items-center space-x-3">
            <i className={`${notification.type === 'success' ? 'ri-check-circle-line'
              : notification.type === 'error' ? 'ri-error-warning-line'
                : 'ri-information-line'
              } text-lg`}></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={product.images[currentImageIndex]}
            alt={product.title}
            className="max-h-screen w-auto object-contain"
          />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-white text-3xl"
          >
            ×
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <section className={`px-8 py-4 border-b pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`flex items-center text-sm transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Link href="/" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Anasayfa</Link>
            <i className="ri-arrow-right-s-line mx-2"></i>
            <Link href="/portfolio" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Elbiseler</Link>
            <i className="ri-arrow-right-s-line mx-2"></i>
            <span className={`transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.title}</span>
          </div>
        </div>
      </section>

      {/* Product Detail */}
      <section className={`py-6 px-4 sm:px-6 md:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {/* GRID: sol = görsel, sağ = detaylar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Images Section */}
            <div className="flex flex-col lg:flex-row gap-4 relative">

              {/* 🖥️ Desktop görünüm - Sol tarafta thumbnails */}
              <div className="hidden lg:flex flex-col gap-3 w-24">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`border-2 ${currentImageIndex === index
                      ? isDarkMode
                        ? "border-white"
                        : "border-black"
                      : isDarkMode
                        ? "border-gray-600"
                        : "border-gray-200"
                      } hover:border-gray-400 transition-all rounded-md overflow-hidden`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-32 object-cover object-top"
                    />
                  </button>
                ))}
              </div>

              {/* Ana resim (desktop) */}
              <div className="hidden lg:block flex-1">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-cover object-top rounded-md cursor-pointer"
                  onClick={() => setFullscreen(true)}
                />
              </div>

              {/* 📱 Mobil görünüm */}
              <div
                className="block lg:hidden relative overflow-hidden w-full"
                onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
                onTouchMove={(e) => (touchEndX.current = e.touches[0].clientX)}
                onTouchEnd={() => {
                  const distance = touchStartX.current - touchEndX.current;
                  if (distance > 50 && currentImageIndex < product.images.length - 1) {
                    setCurrentImageIndex((prev) => prev + 1);
                  } else if (distance < -50 && currentImageIndex > 0) {
                    setCurrentImageIndex((prev) => prev - 1);
                  }
                }}
              >
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-[55vh] sm:h-[65vh] md:h-[70vh] object-cover object-top cursor-pointer transition-all duration-500 ease-out"
                  onClick={() => setFullscreen(true)}
                />

                {/* Noktalar (dots) */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {product.images.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIndex
                        ? "bg-black dark:bg-white scale-110"
                        : "bg-gray-400 dark:bg-gray-600"
                        }`}
                    ></span>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info (sağ sütun) */}
            <div className="space-y-6">
              <div>
                <h1 className={`text-3xl font-light tracking-wide mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.title}</h1>

                <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.price.toLocaleString('tr-TR')} ₺</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vergi dahil. Kargo ücreti ödeme sırasında hesaplanır.</p>
              </div>

              {/* Color Selection */}
              <div>
                <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Renk:  {selectedColor || 'Seçiniz'}</h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-medium ${selectedColor === color
                        ? (isDarkMode ? 'border-white bg-gray-700 text-white' : 'border-black bg-gray-100')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-400' : 'border-gray-300 hover:border-gray-400')
                        } cursor-pointer`}
                    >
                      {color.substring(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Beden</h3>
                <div className="grid grid-cols-4 gap-3">
                  {product.size.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 text-center border ${selectedSize === size
                        ? (isDarkMode ? 'border-white bg-white text-black' : 'border-black bg-black text-white')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-400 text-white' : 'border-gray-300 hover:border-gray-400')
                        } cursor-pointer whitespace-nowrap rounded-full`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Tarih</h3>
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  locale={tr}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  excludeDates={disabledDates}
                  placeholderText="Tarihinizi seçiniz"
                  className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none ${isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                    : 'bg-white border-gray-300 text-black focus:border-black'
                    }`}
                  popperPlacement="bottom-start"
                  todayButton="Bugün"
                  clearButtonTitle="Temizle"
                  calendarClassName="custom-calendar"
                />
              </div>
              {/* Terms and Conditions */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={() => setAcceptedTerms(!acceptedTerms)}
                  className="w-4 h-4 mr-2 accent-black cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className={`text-sm cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Kiralama şartlarını <Link href="/kiralama-sozlesmesi" className="underline hover:opacity-80">okudum ve onayladım</Link>
                </label>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor || !date}
                className={`w-full py-4 text-center font-medium tracking-wide transition-colors whitespace-nowrap rounded-full ${selectedSize && selectedColor && date
                  ? (isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800') + ' cursor-pointer'
                  : (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500') + ' cursor-not-allowed'
                  }`}
              >
                Sepete ekle
              </button>
              {/* Description */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  <span className="font-medium">Açıklama</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <div className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>{product.description}</p>
                  <ul className="mt-4 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Beden Ölçme */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowSizeImage(!showSizeImage)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="font-medium">Bedenimi Nasıl Ölçerim?</span>
                  <i className={`ri-arrow-${showSizeImage ? 'up' : 'down'}-s-line`}></i>
                </button>
                {showSizeImage && (
                  <div className="mt-4">
                    <img src="/images/AnaSayfa/Beden.jpg" alt="Beden Ölçme Tablosu" className="rounded-lg shadow-md" />
                  </div>
                )}
              </div>
              {/* Takvim Bilgisi */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowCalendarInfo(!showCalendarInfo)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="font-medium">Takvimde Hangi Tarihi Seçmeliyim?</span>
                  <i className={`ri-arrow-${showCalendarInfo ? 'up' : 'down'}-s-line`}></i>
                </button>
                {showCalendarInfo && (
                  <div className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>
                      Takvimde tarih seçerken elbiseyi giyeceğiniz günü seçmeniz gerekir.
                      <br />
                      Elbiseniz seçtiğiniz kiralama tarihinden <strong>2 gün önce</strong> elinize ulaşacak şekilde kargoya verilmektedir.
                    </p>
                  </div>
                )}
              </div>
              {/* Teslimat ve İade */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="font-medium">Teslimat ve iade bilgileri</span>
                  <i className={`ri-arrow-${showDeliveryInfo ? 'up' : 'down'}-s-line`}></i>
                </button>
                {showDeliveryInfo && (
                  <div className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>
                      <strong>Teslimat:</strong> Takvimde tarih seçerken giyeceğiniz günü seçmeniz gerekir.
                      Siparişleriniz seçtiğiniz kiralama tarihinden <strong>2 gün önce</strong> elinize ulaşacak şekilde kargoya verilmektedir.
                      <br />
                      Elbiseniz kargoya verildiğinde kargo takip numarası tarafınıza iletilecektir.
                      <br /><br />
                      <strong>İade:</strong> Kiraladığınız elbiseyi giyindikten sonraki ilk iş günü içinde geri teslim etmeniz gerekir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section >
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section
          className={`py-12 px-8 border-t ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            }`}
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`text-2xl font-light tracking-wide mb-8 text-center ${isDarkMode ? "text-white" : "text-black"
                }`}
            >
              Benzer Ürünler
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
              {relatedProducts.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
                    transition: { duration: 0.3 },
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                    ease: "easeOut",
                  }}
                  viewport={{ once: true }}
                  className="bg-transparent rounded-xl overflow-hidden"
                >
                  <Link
                    href={`/portfolio/${item.slug}`}
                    className="group cursor-pointer flex flex-col items-center text-center"
                  >
                    <div className="relative overflow-hidden mb-3 w-full rounded-lg shadow-sm group">
                      {/* Ürün Görseli */}
                      <motion.img
                        src={item.images}
                        alt={item.title}
                        className="w-full h-80 object-cover object-top transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Arka plan karartma (hover’da görünür) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Ortalanmış "Göz At" butonu */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <button
                          className="flex items-center gap-2 bg-white/90 text-black px-5 py-2 rounded-full text-sm font-medium tracking-wide backdrop-blur-sm shadow-md hover:bg-white hover:scale-105 transition-all duration-300"
                        >
                          Göz At
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </motion.div>
                    </div>
                    <h3 className={`text-base font-normal tracking-wide mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm font-light ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {item.price.toLocaleString("tr-TR")} ₺
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Footer */}
      <footer className={`py-16 px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h4 className="text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-6 leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
                  <i className="ri-instagram-line text-lg"></i>
                </a>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide">KURUMSAL</h5>
              <ul className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li><Link href="/hakkimda" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Hakkımızda</Link></li>
                <li><Link href="/iletisim" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Randevu Al</Link></li>
                <li><Link href="/gizlilik-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>KVKK</Link></li>
                <li><Link href="/aydinlatma-metni" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Aydınlatma Metni</Link></li>
                <li><Link href="/kiralama-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Kiralama Sözleşmesi ve Yükümlülükleri</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">İLETİŞİM</h5>
              <ul className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatölye@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className={`border-t mt-12 pt-8 text-center text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
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
    </div >

  );
}
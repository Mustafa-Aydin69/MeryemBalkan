'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import LoginModal from '../../components/LoginModal';
import { addToCart } from '../../utils/cartUtils';
import { motion } from "framer-motion";
import CustomCalendar from '../../components/CustomCalendar';

// Cloudflare R2 URL oluşturma (Portfolio sayfasıyla uyumlu)
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

const getImageUrl = (images: string[] | null, index = 0) => {
  const R2_BASE = getR2BaseUrl();
  
  if (!images || !images[index]) {
    return `${R2_BASE}1760034813002_Meryem_Balkan_Logo.jpg`;
  }
  const img = images[index];
  // ZATEN TAM URL İSE
  if (img.startsWith("http")) {
    return img;
  }
  // SADECE DOSYA ADI İSE
  return `${R2_BASE}${img}`;
};

// Video dosyası mı kontrol et
const isVideoFile = (fileName: string | null | undefined) => {
  if (!fileName) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

// Medya URL'i al (video veya resim)
const getMediaUrl = (images: string[] | null, index = 0) => {
  return getImageUrl(images, index);
};

// Belirli bir index'teki medya video mu?
const isMediaVideo = (images: string[] | null, index = 0) => {
  if (!images || !images[index]) return false;
  return isVideoFile(images[index]);
};
// Renk isimleri -> CSS renk kodu eşleştirmesi
const colorMap: Record<string, string> = {
  // Temel renkler
  'Siyah': '#000000',
  'Beyaz': '#FFFFFF',
  'Kırmızı': '#DC2626',
  'Mavi': '#2563EB',
  'Lacivert': '#1E3A5F',
  'Yeşil': '#16A34A',
  'Sarı': '#EAB308',
  'Turuncu': '#EA580C',
  'Mor': '#9333EA',
  'Pembe': '#EC4899',
  'Gri': '#6B7280',
  'Kahverengi': '#92400E',
  'Bej': '#D4B896',
  'Krem': '#FFFDD0',
  'Bordo': '#800020',
  'Altın': '#FFD700',
  'Gümüş': '#C0C0C0',
  'Bronz': '#CD7F32',
  'Turkuaz': '#40E0D0',
  'Eflatun': '#9966CC',
  'Fuşya': '#FF00FF',
  'Mercan': '#FF7F50',
  'Zümrüt': '#50C878',
  'Mürdüm': '#6B3A6B',
  'Petrol': '#006064',
  'Hardal': '#FFDB58',
  'Kiremit': '#CB4154',
  'Şampanya': '#F7E7CE',
  'Pudra': '#F5D0C5',
  'Mint': '#98FF98',
  'Lila': '#C8A2C8',
  'İndigo': '#4B0082',
  'Kobalt': '#0047AB',
  'Vizon': '#8B7355',
};

// Renk adından CSS renk kodunu al
const getColorCode = (colorName: string): string => {
  // Tam eşleşme ara
  if (colorMap[colorName]) return colorMap[colorName];

  // Küçük harfle ara
  const lowerName = colorName.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (key.toLowerCase() === lowerName) return value;
  }

  // Kısmi eşleşme ara (ör: "Açık Mavi" -> "Mavi")
  for (const [key, value] of Object.entries(colorMap)) {
    if (colorName.includes(key) || key.includes(colorName)) return value;
  }

  // Varsayılan gri
  return '#9CA3AF';
};

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

interface RelatedProduct {
  id: number;
  title: string;
  collection: string;
  price: number;
  images: string;
  slug: string;
}

interface ProductDetailProps {
  product: Product | null;
  relatedProducts: RelatedProduct[];
  disabledDates: string[]; // ISO string formatında
}

export default function ProductDetail({
  product,
  relatedProducts,
  disabledDates: disabledDatesStr
}: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [hasCartItems, setHasCartItems] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSizeImage, setShowSizeImage] = useState(false);
  const [showCalendarInfo, setShowCalendarInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(0);
  const wasDragging = useRef(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // String tarihlerini Date objelerine çevir (memoized)
  const disabledDates = useMemo(() => {
    return disabledDatesStr.map(d => new Date(d));
  }, [disabledDatesStr]);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    const checkCartItems = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItemCount(cartItems.length);
      setHasCartItems(cartItems.length > 0);
    };

    checkCartItems();
    window.addEventListener('storage', checkCartItems);
    window.addEventListener('cartUpdated', checkCartItems);

    // Favori durumu
    if (product) {
      const savedFavs: number[] = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(savedFavs.includes(product.id));
    }

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

  const closeFullscreen = () => {
    setFullscreen(false);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Reset zoom when image changes while in fullscreen
  useEffect(() => {
    if (fullscreen) { setZoom(1); setPanOffset({ x: 0, y: 0 }); }
  }, [currentImageIndex]);

  // Keyboard + scroll wheel handlers for fullscreen
  useEffect(() => {
    if (!fullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => prev === 0 ? product!.images.length - 1 : prev - 1);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => prev === product!.images.length - 1 ? 0 : prev + 1);
      }
    };

    const el = fullscreenRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom(prev => Math.min(Math.max(prev + factor, 0.5), 5));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDistRef.current = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDistRef.current > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const ratio = newDist / pinchDistRef.current;
        setZoom(prev => Math.min(Math.max(prev * ratio, 0.5), 5));
        pinchDistRef.current = newDist;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (el) {
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [fullscreen, product!.images.length]);

  const toggleFavorite = () => {
    if (!product) return;
    const savedFavs: number[] = JSON.parse(localStorage.getItem('favorites') || '[]');
    const adding = !isFavorite;
    const newFavs = adding
      ? [...savedFavs, product.id]
      : savedFavs.filter((id) => id !== product.id);
    localStorage.setItem('favorites', JSON.stringify(newFavs));
    setIsFavorite(adding);
    if (adding) {
      setNotification({ message: 'Favorilere eklendi! Sepet sayfasından görüntüleyebilirsiniz.', type: 'success' });
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    // Mobil: native share sheet
    if (navigator.share) {
      try {
        await navigator.share({ title: `Meryem Balkan - ${product?.title}`, url });
        return;
      } catch {
        // Kullanıcı iptal etti, bir şey yapma
        return;
      }
    }
    // Masaüstü: clipboard
    try {
      await navigator.clipboard.writeText(url);
      setNotification({ message: 'Bağlantı kopyalandı!', type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setShowShareMenu(prev => !prev);
    }
  };

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
    // ⚖️ Mesafeli Satış Sözleşmesi onayı kontrolü
    if (!acceptedTerms) {
      setNotification({
        message: "Mesafeli Satış Sözleşmesi'ni kabul etmeniz gerekmektedir.",
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
      date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : "",
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
          ref={fullscreenRef}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden"
          onClick={() => { if (!wasDragging.current) closeFullscreen(); wasDragging.current = false; }}
          onMouseDown={(e) => {
            if (zoom <= 1) return;
            wasDragging.current = false;
            setIsPanning(true);
            panStart.current = { x: e.clientX, y: e.clientY };
            panOffsetStart.current = { ...panOffset };
          }}
          onMouseMove={(e) => {
            if (!isPanning) return;
            wasDragging.current = true;
            setPanOffset({
              x: panOffsetStart.current.x + (e.clientX - panStart.current.x),
              y: panOffsetStart.current.y + (e.clientY - panStart.current.y),
            });
          }}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => setIsPanning(false)}
          style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        >
          {/* Ana resim veya video */}
          {isMediaVideo(product.images, currentImageIndex) ? (
            <video
              src={getMediaUrl(product.images, currentImageIndex)}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={getImageUrl(product.images, currentImageIndex)}
              alt={product.title}
              className="max-h-[85vh] max-w-[90vw] object-contain select-none"
              draggable={false}
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                transition: isPanning ? 'none' : 'transform 0.12s ease-out',
                cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Zoom kontrolleri */}
          {!isMediaVideo(product.images, currentImageIndex) && (
            <div
              className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.5, 5))}
                className="w-9 h-9 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                title="Yakınlaştır"
              >
                <i className="ri-zoom-in-line text-base"></i>
              </button>
              <button
                onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
                className={`h-9 px-3 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xs transition-all ${zoom === 1 ? 'bg-white/5 opacity-50' : 'bg-white/10 hover:bg-white/25'}`}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.5, 0.5))}
                className="w-9 h-9 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                title="Uzaklaştır"
              >
                <i className="ri-zoom-out-line text-base"></i>
              </button>
            </div>
          )}

          {/* Önceki buton */}
          {product.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => prev === 0 ? product.images.length - 1 : prev - 1);
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <i className="ri-arrow-left-s-line text-2xl sm:text-3xl"></i>
            </button>
          )}

          {/* Sonraki buton */}
          {product.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => prev === product.images.length - 1 ? 0 : prev + 1);
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <i className="ri-arrow-right-s-line text-2xl sm:text-3xl"></i>
            </button>
          )}

          {/* Kapatma butonu */}
          <button
            onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all z-10"
          >
            <i className="ri-close-line text-xl sm:text-2xl"></i>
          </button>

          {/* Sayaç */}
          {product.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm z-10">
              {currentImageIndex + 1} / {product.images.length}
            </div>
          )}

          {/* Dot'lar */}
          {product.images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                    currentImageIndex === i ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <section className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b pt-24 sm:pt-28 md:pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`flex items-center text-xs sm:text-sm transition-colors overflow-x-auto whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Link href="/" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Anasayfa</Link>
            <i className="ri-arrow-right-s-line mx-1 sm:mx-2"></i>
            <Link href="/portfolio" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Elbiseler</Link>
            <i className="ri-arrow-right-s-line mx-1 sm:mx-2"></i>
            <span className={`transition-colors truncate max-w-[150px] sm:max-w-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.title}</span>
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
                      } hover:border-gray-400 transition-all rounded-md overflow-hidden relative`}
                  >
                    {isMediaVideo(product.images, index) ? (
                      <>
                        <video
                          src={getMediaUrl(product.images, index)}
                          className="w-full h-32 object-cover object-top"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <i className="ri-play-circle-line text-2xl text-white"></i>
                        </div>
                      </>
                    ) : (
                      <img
                        src={getImageUrl(product.images, index)}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-32 object-cover object-top"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Ana resim/video (desktop) */}
              <div className="hidden lg:block flex-1">
                {isMediaVideo(product.images, currentImageIndex) ? (
                  <video
                    src={getMediaUrl(product.images, currentImageIndex)}
                    className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-contain rounded-md cursor-pointer"
                    style={{ background: isDarkMode ? '#111827' : '#f9fafb' }}
                    onClick={() => setFullscreen(true)}
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={getImageUrl(product.images, currentImageIndex)}
                    alt={product.title}
                    className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-contain rounded-md cursor-pointer"
                    style={{ background: isDarkMode ? '#111827' : '#f9fafb' }}
                    onClick={() => setFullscreen(true)}
                  />
                )}
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
                {isMediaVideo(product.images, currentImageIndex) ? (
                  <video
                    src={getMediaUrl(product.images, currentImageIndex)}
                    className="w-full h-[55vh] sm:h-[65vh] md:h-[70vh] object-contain cursor-pointer transition-all duration-500 ease-out"
                    style={{ background: isDarkMode ? '#111827' : '#f9fafb' }}
                    onClick={() => setFullscreen(true)}
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={getImageUrl(product.images, currentImageIndex)}
                    alt={product.title}
                    className="w-full h-[55vh] sm:h-[65vh] md:h-[70vh] object-contain cursor-pointer transition-all duration-500 ease-out"
                    style={{ background: isDarkMode ? '#111827' : '#f9fafb' }}
                    onClick={() => setFullscreen(true)}
                  />
                )}

                {/* Noktalar (dots) - video ise play ikonu göster */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {product.images.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all flex items-center justify-center ${i === currentImageIndex
                        ? "bg-black dark:bg-white scale-110"
                        : "bg-gray-400 dark:bg-gray-600"
                        }`}
                    >
                      {isMediaVideo(product.images, i) && i === currentImageIndex && (
                        <i className="ri-play-fill text-[8px]"></i>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info (sağ sütun) */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className={`text-xl sm:text-2xl md:text-3xl font-light tracking-wide mb-1 sm:mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.title}</h1>

                <p className={`text-lg sm:text-xl md:text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.price.toLocaleString('tr-TR')} ₺</p>
                <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vergi dahil. Kargo ücreti ödeme sırasında hesaplanır.</p>
              </div>

              {/* Color Selection */}
              <div>
                <h3 className={`text-sm sm:text-base font-medium mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Renk: {selectedColor || 'Seçiniz'}</h3>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {product.colors.map((color) => {
                    const colorCode = getColorCode(color);
                    const isLight = ['Beyaz', 'Krem', 'Şampanya', 'Sarı', 'Pudra', 'Bej'].some(
                      c => color.toLowerCase().includes(c.toLowerCase())
                    );

                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative
                          ${selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-black dark:ring-white'
                            : 'hover:scale-110'
                          }`}
                        style={{
                          backgroundColor: colorCode,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)'
                        }}
                      >
                        {/* Seçili işareti */}
                        {selectedColor === color && (
                          <i className={`ri-check-line text-sm sm:text-lg ${isLight ? 'text-black' : 'text-white'}`} style={{ textShadow: isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}></i>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className={`text-sm sm:text-base font-medium mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Beden</h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {product.size.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 sm:py-3 text-xs sm:text-sm text-center border ${selectedSize === size
                        ? (isDarkMode ? 'border-white bg-white text-black' : 'border-black bg-black text-white')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-400 text-white' : 'border-gray-300 hover:border-gray-400 text-black')
                        } cursor-pointer whitespace-nowrap rounded-full`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <h3 className={`text-sm sm:text-base font-medium mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Etkinlik Tarihi</h3>
                <CustomCalendar
                  selectedDate={date}
                  onDateSelect={setDate}
                  disabledDates={disabledDates}
                  isDarkMode={isDarkMode}
                  placeholder="Tarih seçiniz"
                />
              </div>
              {/* Terms and Conditions - Mesafeli Satış Sözleşmesi */}
              <div className="flex items-start sm:items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={() => setAcceptedTerms(!acceptedTerms)}
                  className="w-4 h-4 mr-2 mt-0.5 sm:mt-0 accent-black cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="terms"
                  className={`text-xs sm:text-sm cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <Link href="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Mesafeli Satış Sözleşmesi</Link>
                  &apos;ni okudum ve kabul ediyorum.
                </label>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor || !date || !acceptedTerms}
                className={`w-full py-3 sm:py-4 text-sm sm:text-base text-center font-medium tracking-wide transition-colors whitespace-nowrap rounded-full ${selectedSize && selectedColor && date && acceptedTerms
                  ? (isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800') + ' cursor-pointer'
                  : (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500') + ' cursor-not-allowed'
                  }`}
              >
                Sepete ekle
              </button>

              {/* Share & Favorite */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <button
                    onClick={handleShare}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      isDarkMode
                        ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black'
                    }`}
                  >
                    <i className="ri-share-line text-sm"></i>
                    Paylaş
                  </button>
                  {showShareMenu && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-20 overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setShowShareMenu(false);
                          setNotification({ message: 'Bağlantı kopyalandı!', type: 'success' });
                          setTimeout(() => setNotification(null), 2000);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <i className="ri-link text-sm"></i> Bağlantıyı Kopyala
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Meryem Balkan - ${product.title}\n${window.location.href}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className={`flex items-center gap-2.5 px-4 py-3 text-sm transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <i className="ri-whatsapp-line text-green-500 text-sm"></i> WhatsApp'ta Paylaş
                      </a>
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleFavorite}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    isFavorite
                      ? isDarkMode
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                        : 'border-rose-400 bg-rose-50 text-rose-500'
                      : isDarkMode
                        ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black'
                  }`}
                  aria-label={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                >
                  <i className={`text-base ${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                </button>
              </div>

              {/* Description */}
              <div className={`border-t pt-4 sm:pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  <span className="text-sm sm:text-base font-medium">Açıklama</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <div className={`mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>{product.description}</p>
                  <div className="mt-3 sm:mt-4 space-y-1">
                    {product.features.map((feature, index) => (
                      <p key={index}>{feature}</p>
                    ))}
                  </div>
                </div>
              </div>
              {/* Beden Ölçme */}
              <div
                className={`border-t pt-4 sm:pt-6 ${isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
              >
                <button
                  onClick={() => setShowSizeImage(!showSizeImage)}
                  aria-expanded={showSizeImage}
                  aria-controls="size-guide"
                  className={`flex justify-between items-center w-full text-left transition-colors ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  <span className="text-sm sm:text-base font-medium">
                    Bedenimi Nasıl Ölçerim?
                  </span>

                  <i
                    className={`ri-arrow-down-s-line transition-transform duration-300 ${showSizeImage ? "rotate-180" : ""
                      }`}
                  />
                </button>

                <div
                  id="size-guide"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${showSizeImage ? "max-h-[600px] mt-3 sm:mt-4" : "max-h-0"
                    }`}
                >
                  <img
                    src="https://cdn.meryembalkan.com.tr/urunler/Bedenimi_Nasil_Olcerim.jpeg"
                    alt="Beden Ölçme Tablosu"
                    loading="lazy"
                    className="rounded-lg shadow-md w-full"
                  />
                </div>
              </div>

              {/* Takvim Bilgisi */}
              <div className={`border-t pt-4 sm:pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowCalendarInfo(!showCalendarInfo)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="text-sm sm:text-base font-medium">Takvimde Hangi Tarihi Seçmeliyim?</span>
                  <i className={`ri-arrow-${showCalendarInfo ? 'up' : 'down'}-s-line`}></i>
                </button>
                {showCalendarInfo && (
                  <div className={`mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>
                      Takvimde tarih seçerken elbiseyi giyeceğiniz günü seçmeniz gerekir.
                      <br />
                      Elbiseniz seçtiğiniz kiralama tarihinden <strong>2 gün önce</strong> elinize ulaşacak şekilde kargoya verilmektedir.
                    </p>
                  </div>
                )}
              </div>
              {/* Teslimat ve İade */}
              <div className={`border-t pt-4 sm:pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="text-sm sm:text-base font-medium">Teslimat ve iade bilgileri</span>
                  <i className={`ri-arrow-${showDeliveryInfo ? 'up' : 'down'}-s-line`}></i>
                </button>
                {showDeliveryInfo && (
                  <div className={`mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
          className={`py-8 sm:py-12 px-4 sm:px-8 border-t ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
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
                        src={item.images.startsWith("http")
                          ? item.images
                          : `${getR2BaseUrl()}${item.images}`
                        }
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
      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
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
                <li><Link href="/mesafeli-satis-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link href="/teslimat-ve-iade-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Teslimat ve İade Politikası</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">İLETİŞİM</h5>
              <ul className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatolye@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className={`border-t mt-12 pt-8 text-center text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; 2026 Meryem Balkan Tüm hakları saklıdır.</p>
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
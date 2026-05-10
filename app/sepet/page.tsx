'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginModal from '../components/LoginModal';
import { useState, useEffect } from 'react';
import { checkCartConflicts } from '../utils/rentalConflict';

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

// Sepet öğesi için tip tanımı
interface CartItem {
  id: string; // Unique identifier (productId_variantId_date)
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

export default function Sepet() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [removedItem, setRemovedItem] = useState<CartItem | null>(null);
  const [showUndoMessage, setShowUndoMessage] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(true);
  const [conflictMessages, setConflictMessages] = useState<ConflictInfo[]>([]);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<ConflictInfo[]>([]);
  const [hasValidItemsRemaining, setHasValidItemsRemaining] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // 🔹 İlk açılışta cartItems'ı yükle ve çakışma kontrolü yap
    const loadAndCheckCart = async () => {
      const initialCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      if (initialCartItems.length === 0) {
        setCartItems([]);
        setIsCheckingConflicts(false);
        return;
      }

      setIsCheckingConflicts(true);
      
      try {
        // Çakışma kontrolü yap
        const { conflicts, validItems } = await checkCartConflicts(initialCartItems);
        
        if (conflicts.length > 0) {
          // Çakışan ürünleri göster
          setConflictMessages(conflicts.map(c => ({
            itemTitle: c.item.title,
            reason: c.reason
          })));
          
          // Sadece geçerli ürünleri sepette tut
          setCartItems(validItems);
          localStorage.setItem('cartItems', JSON.stringify(validItems));
        } else {
          setCartItems(initialCartItems);
        }
      } catch (error) {
        console.error('Çakışma kontrolü hatası:', error);
        setCartItems(initialCartItems);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    loadAndCheckCart();

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    // Portfolio sayfasından sepete ekleme için event listener
    const handleCartUpdate = () => {
      const updatedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItems(updatedCartItems);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Sepet güncellendiğinde localStorage'a kaydet (sadece değişiklik varsa)
  useEffect(() => {
    if (isClient && cartItems.length >= 0) {
      const currentCartString = JSON.stringify(cartItems);
      const savedCartString = localStorage.getItem('cartItems') || '[]';

      // Sadece değişiklik varsa localStorage'ı güncelle
      if (currentCartString !== savedCartString) {
        localStorage.setItem('cartItems', currentCartString);
      }
    }
  }, [cartItems, isClient]);

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

  const showNavBackground = isClient && scrollY > 50;

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (itemToRemove) {
      setRemovedItem(itemToRemove);
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);

      // localStorage'ı güncelle ve event gönder
      localStorage.setItem('cartItems', JSON.stringify(updatedItems));
      window.dispatchEvent(new Event('cartUpdated'));

      setShowUndoMessage(true);

      // 5 saniye sonra geri al mesajını gizle
      setTimeout(() => {
        setShowUndoMessage(false);
        setRemovedItem(null);
      }, 5000);
    }
  };

  const handleUndoRemove = () => {
    if (removedItem) {
      const updatedItems = [...cartItems, removedItem];
      setCartItems(updatedItems);

      // localStorage'ı güncelle ve event gönder
      localStorage.setItem('cartItems', JSON.stringify(updatedItems));
      window.dispatchEvent(new Event('cartUpdated'));

      setRemovedItem(null);
      setShowUndoMessage(false);
    }
  };

  // Tarih formatını düzenle
  const formatDate = (date: string) => {
    if (!date || date === 'Invalid Date') {
      return 'Tarih belirtilmemiş';
    }

    try {
      const dateObj = new Date(date);

      // Geçerli tarih kontrolü
      if (isNaN(dateObj.getTime())) {
        return 'Geçersiz tarih';
      }

      return dateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Tarih formatı hatası';
    }
  };

  // ✅ Güvenli toplam hesaplama (string veya noktalı değerleri de destekler)
  const totalPrice = cartItems.reduce((sum, item) => {
    const cleanPrice = Number(String(item.price).replace(/\./g, '').replace(',', '.'));
    return sum + (isNaN(cleanPrice) ? 0 : cleanPrice);
  }, 0);

  // Ödeme yap butonu - checkout'a gitmeden önce çakışma kontrolü yap
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsProcessingCheckout(true);
    setConflictMessages([]);
    
    try {
      // Çakışma kontrolü yap
      const { conflicts, validItems } = await checkCartConflicts(cartItems);
      
      if (conflicts.length > 0) {
        // Çakışma var - modal göster
        const conflictMsgs = conflicts.map(c => ({
          itemTitle: c.item.title,
          reason: c.reason
        }));
        
        setPendingConflicts(conflictMsgs);
        setHasValidItemsRemaining(validItems.length > 0);
        
        // Geçerli ürünleri güncelle (ama henüz localStorage'a kaydetme - modal sonucuna göre)
        setCartItems(validItems);
        localStorage.setItem('cartItems', JSON.stringify(validItems));
        
        // Modal göster
        setShowConflictModal(true);
        setIsProcessingCheckout(false);
        return;
      }
      
      // Çakışma yoksa checkout'a git
      router.push('/checkout');
    } catch (error) {
      console.error('Checkout hatası:', error);
      setIsProcessingCheckout(false);
    }
  };

  // Modal'da "Evet" - Checkout'a devam et
  const handleConflictContinue = () => {
    setShowConflictModal(false);
    setPendingConflicts([]);
    
    if (hasValidItemsRemaining) {
      router.push('/checkout');
    }
  };

  // Modal'da "Hayır" - Sepette kal ve uyarıyı göster
  const handleConflictStay = () => {
    setShowConflictModal(false);
    setConflictMessages(pendingConflicts);
    setPendingConflicts([]);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'
        }`}
      suppressHydrationWarning={true}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground
          ? isDarkMode
            ? 'bg-gray-900/90 backdrop-blur border-b border-gray-700'
            : 'bg-white/90 backdrop-blur border-b border-gray-200'
          : 'bg-transparent'
          }`}
      >
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center w-full mb-2 sm:mb-3 md:mb-4 gap-3">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground
                ? isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
                : 'text-white hover:text-gray-300'
                }`}
              aria-label="Tema Değiştir"
            >
              <i
                className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'
                  } text-base sm:text-lg`}
              ></i>
            </button>

            <div className="text-center flex-1">
              <h1
                className={`text-base sm:text-lg md:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic break-words ${showNavBackground
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : 'text-white'
                  }`}
              >
                MERYEM BALKAN
              </h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : 'text-white hover:text-gray-300'
                  }`}
                aria-label="Sepet"
              ></Link>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : 'text-white hover:text-gray-300'
                  }`}
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


      {/* Main Content */}
      <div className="pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className={`text-2xl sm:text-4xl font-light tracking-wide font-serif transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Sepet</h1>
          </div>

          {/* Conflict Messages */}
          {conflictMessages.length > 0 && (
            <div className={`mb-6 p-4 rounded-lg border transition-colors ${isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start space-x-3">
                <i className={`ri-error-warning-line text-xl flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}></i>
                <div className="flex-1">
                  <p className={`font-medium mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                    Bazı ürünler sepetten kaldırıldı
                  </p>
                  <ul className="space-y-2">
                    {conflictMessages.map((conflict, index) => (
                      <li key={index} className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-600'}`}>
                        <span className="font-medium">{conflict.itemTitle}:</span> {conflict.reason}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setConflictMessages([])}
                    className={`mt-3 text-sm underline ${isDarkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-700'}`}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state for conflict check */}
          {isCheckingConflicts && (
            <div className={`mb-6 p-4 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Ürün müsaitlik durumu kontrol ediliyor...
                </span>
              </div>
            </div>
          )}

          {/* Undo Message */}
          {showUndoMessage && removedItem && (
            <div className={`mb-6 p-4 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <i className={`ri-information-line text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                  <span className={`transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Ürün sepetten kaldırıldı.
                  </span>
                </div>
                <button
                  onClick={handleUndoRemove}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  Geri Al
                </button>
              </div>
            </div>
          )}

          {/* Cart Items */}
          {cartItems.length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              {cartItems.map((item) => (
                <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 sm:p-6 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="w-full sm:w-32 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900/20">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-auto max-h-64 object-contain sm:h-full sm:max-h-none sm:object-cover sm:object-top mx-auto"
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="mb-4 sm:mb-0">
                        <h3 className={`text-lg sm:text-xl font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm mb-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.color} / {item.size}
                        </p>
                        <p className={`text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Tarih: {formatDate(item.date)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                        <div className="text-left sm:text-right">
                          <p className={`text-lg font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {item.price.toLocaleString('tr-TR')}TL
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty Cart State
            <div className="text-center py-16">
              <div className={`mb-6 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="ri-shopping-bag-line text-6xl"></i>
              </div>
              <h2 className={`text-2xl font-medium mb-4 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Sepetiniz boş
              </h2>
              <p className={`mb-8 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Koleksiyonumuzu incelemek için elbise sayfasına göz atın
              </p>
              <Link
                href="/portfolio"
                className={`inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
              >
                ELBİSELERE GÖZ AT
              </Link>
            </div>
          )}

          {/* Cart Summary - Only show if there are items */}
          {cartItems.length > 0 && (
            <div className={`mt-8 sm:mt-12 p-6 sm:p-8 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h2 className={`text-xl sm:text-2xl font-medium mb-4 sm:mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Ara toplam {totalPrice.toLocaleString('tr-TR')}TL
              </h2>

              <p className={`text-sm mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Ödeme sırasında hesaplanan gönderim ve vergiler
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  disabled={isProcessingCheckout || cartItems.length === 0}
                  className={`w-full py-3 sm:py-4 px-6 sm:px-8 rounded-full font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${
                    isProcessingCheckout || cartItems.length === 0
                      ? isDarkMode 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDarkMode 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  {isProcessingCheckout ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Kontrol ediliyor...
                    </>
                  ) : (
                    'Ödeme yap'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/portfolio"
                    className={`inline-flex items-center space-x-2 cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}
                  >
                    <i className="ri-arrow-left-line"></i>
                    <span>Alışverişe devam et</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
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
                <li><Link href="/iletisim" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>İletişime Geç</Link></li>
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

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; 2026 Meryem Balkan Tüm hakları saklıdır.</p>
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
            </div>

            <div className={`max-h-48 overflow-y-auto mb-6 space-y-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg p-4`}>
              {pendingConflicts.map((conflict, index) => (
                <div key={index} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{conflict.itemTitle}:</span>
                  <p className="mt-0.5">{conflict.reason}</p>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Bu ürün sepetinizden kaldırılacaktır.
                  </p>
                </div>
              ))}
            </div>

            {hasValidItemsRemaining ? (
              <>
                <p className={`text-sm mb-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Kalan ürünlerle devam etmek istiyor musunuz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConflictStay}
                    className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'border border-gray-600 text-white hover:bg-gray-700' : 'border border-gray-300 text-black hover:bg-gray-100'}`}
                  >
                    Hayır, Sepette Kal
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
                  onClick={handleConflictStay}
                  className={`w-full py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  Tamam
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
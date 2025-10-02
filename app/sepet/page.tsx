'use client';
import Link from 'next/link';
import LoginModal from '../components/LoginModal';
import { useState, useEffect } from 'react';

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

export default function Sepet() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [removedItem, setRemovedItem] = useState<CartItem | null>(null);
  const [showUndoMessage, setShowUndoMessage] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // 🔹 İlk açılışta cartItems'ı yükle
    const initialCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(initialCartItems);

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

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning={true}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-6">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-4">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-lg`}></i>
            </button>

            <div className="text-center">
              <h1 className={`text-lg sm:text-xl font-light tracking-[0.3em] font-serif transition-colors italic ${isDarkMode ? 'text-white' : 'text-black'}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/sepet"
                className={`relative w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}
              >
                <i className={`ri-shopping-bag-line text-lg ${cartItems.length > 0 ? 'animate-bounce' : ''}`}></i>
              </Link>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}
              >
                <i className="ri-user-line text-lg"></i>
              </button>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex flex-wrap justify-center space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>İLETİŞİM</Link>
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
                  <div className="w-full sm:w-32 h-40 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover object-top"
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
                <Link
                  href="/checkout"
                  className={`w-full py-3 sm:py-4 px-6 sm:px-8 rounded-full font-medium transition-colors whitespace-nowrap block text-center ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
                >
                  Ödeme yap
                </Link>

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
                <li><Link href="/kvkv" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>KVKK</Link></li>
                <li><Link href="/aydinlatma-metni" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Aydınlatma Metni</Link></li>
                <li><Link href="/kiralama-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Kiralama Sözleşmesi ve Yükümlülükleri</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">İLETİŞİM</h5>
              <ul className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarımatölyesi@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
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
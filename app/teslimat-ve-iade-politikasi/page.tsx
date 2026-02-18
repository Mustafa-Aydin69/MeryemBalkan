'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

export default function TeslimatVeIadePolitikasi() {
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
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

  const showNavBackground = isClient && scrollY > 50;

  const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const headingClass = isDarkMode ? 'text-white' : 'text-black';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning>
      
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button onClick={toggleTheme} className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`} />
            </button>
            <div className="text-center">
              <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic ${headingClass}`}>MERYEM BALKAN</h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link href="/sepet" className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>
                <i className="ri-shopping-bag-line text-sm sm:text-lg" />
              </Link>
              <button onClick={() => setShowLoginModal(true)} className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>
                <i className="ri-user-line text-sm sm:text-lg" />
              </button>
            </div>
          </div>
          <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className={`pt-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 transition-colors duration-300 ${headingClass}`}>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-8">TESLİMAT VE İADE POLİTİKASI</h1>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">TESLİMAT KOŞULLARI</h2>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Kiralanan ürün, sözleşmede belirtilen teslim tarihinde, mağazadan elden teslim edilir veya yazılı onay verilmesi halinde kargo ile gönderilir.
            </p>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Mağazadan teslimlerde, teslim formu imzalanmadan ürün teslim edilmez.
            </p>
            <p className={`leading-relaxed mb-2 ${textClass}`}>Kargo ile gönderim yapılması halinde:</p>
            <ul className={`list-disc pl-6 space-y-2 ${textClass}`}>
              <li>Ürün sözleşmede belirtilen tarihte kargoya verilir.</li>
              <li>Kargo süresinden kaynaklanan gecikmelerden Meryem Balkan Tasarım Atölyesi sorumlu değildir.</li>
              <li>Ürün teslim alındığında kontrol edilmelidir.</li>
              <li>Teslim anında bildirilmeyen hasarlardan firma sorumlu değildir.</li>
              <li>Kargo ücreti aksi belirtilmedikçe kiracıya aittir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">İADE KOŞULLARI</h2>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Kiralama süresi teslim tarihinden itibaren 4 gündür.
            </p>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Ürün, 4. gün mesai bitimine kadar:
            </p>
            <ul className={`list-disc pl-6 space-y-2 mb-4 ${textClass}`}>
              <li>Mağazaya elden teslim edilmeli</li>
              <li>veya kargo ile gönderilmelidir.</li>
            </ul>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Kargo ile iadelerde iade tarihi, ürünün kargoya verildiği gündür.
            </p>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Ürün iade sırasında kontrol edilir ve iade formu düzenlenir.
            </p>
            <p className={`leading-relaxed ${textClass}`}>
              İade formu imzalanmadan ürün teslim edilmiş sayılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">HASAR VE GECİKME DURUMU</h2>
            <ul className={`list-disc pl-6 space-y-2 ${textClass}`}>
              <li>Kullanım süresince oluşan her türlü zarar kiracı sorumluluğundadır.</li>
              <li>İade sırasında tespit edilen hasarlar için tamir bedeli talep edilir.</li>
              <li>Geç iade durumunda günlük %20 cezai şart uygulanır.</li>
              <li>5 günü aşan gecikmelerde hukuki işlem başlatılabilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">CAYMA HAKKI</h2>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Kiralama hizmeti için yapılan rezervasyonlarda kapora bedeli, tarih ve ürünün kiracı adına ayrılması sebebiyle hizmete hazırlık niteliğindedir.
            </p>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Teslim tarihinden 14 gün öncesine kadar yapılan iptallerde, kapora haricindeki ödemeler iade edilir.
            </p>
            <p className={`leading-relaxed mb-4 ${textClass}`}>
              Teslim tarihine 3 günden az kala yapılan iptallerde sözleşmede belirtilen cezai şart uygulanır.
            </p>
            <p className={`leading-relaxed ${textClass}`}>
              Ürün teslim alındıktan sonra cayma hakkı kullanılamaz.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base ${textClass}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
                  <i className="ri-instagram-line text-lg" />
                </a>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">KURUMSAL</h5>
              <ul className={`space-y-2 text-sm ${textClass}`}>
                <li><Link href="/hakkimda" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Hakkımızda</Link></li>
                <li><Link href="/iletisim" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>İletişime Geç</Link></li>
                <li><Link href="/gizlilik-politikasi" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>KVKK</Link></li>
                <li><Link href="/aydinlatma-metni" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Aydınlatma Metni</Link></li>
                <li><Link href="/kiralama-sozlesmesi" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Kiralama Sözleşmesi ve Yükümlülükleri</Link></li>
                <li><Link href="/mesafeli-satis-sozlesmesi" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link href="/teslimat-ve-iade-politikasi" className={`cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Teslimat ve İade Politikası</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">İLETİŞİM</h5>
              <ul className={`space-y-2 text-sm ${textClass}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatölye@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; Meryem Balkan.</p>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} isDarkMode={isDarkMode} />
    </div>
  );
}

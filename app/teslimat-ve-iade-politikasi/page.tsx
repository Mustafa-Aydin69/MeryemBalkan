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
  const nc = `w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`;
  const li = `flex items-start gap-3 text-sm leading-6 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
  const dot = `mt-2 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`;
  const body = `text-sm leading-7 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
  const sh = `text-xs font-semibold tracking-widest mb-4 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning>
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button onClick={toggleTheme} className={nc}><i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i></button>
            <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>MERYEM BALKAN</h1>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="hidden sm:contents"><Link href="/sepet" className={nc}><i className="ri-shopping-bag-line text-sm sm:text-lg"></i></Link></span>
              <button onClick={() => setShowLoginModal(true)} className={nc}><i className="ri-user-line text-sm sm:text-lg"></i></button>
            </div>
          </div>
          <div className="hidden sm:flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            {[['/', 'ANASAYFA'], ['/portfolio', 'ELBİSELER'], ['/hakkimda', 'HAKKIMDA'], ['/iletisim', 'İLETİŞİM']].map(([href, label]) => (
              <Link key={href} href={href} className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>{label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <div className={`pt-28 sm:pt-32 pb-20 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`pb-8 mb-10 border-b transition-colors ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className={`text-xs tracking-[0.35em] mb-3 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>MERYEM BALKAN</p>
            <h1 className={`text-2xl sm:text-3xl font-light tracking-wide mb-3 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>TESLİMAT VE İADE POLİTİKASI</h1>
            <p className={`text-xs transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Meryem Balkan Tasarım Atölyesi kiralama hizmeti teslimat ve iade koşulları</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className={sh}>1. TESLİMAT KOŞULLARI</h2>
              <p className={`${body} mb-3`}>Kiralanan ürün, sözleşmede belirtilen teslim tarihinde mağazadan elden teslim edilir veya yazılı onay verilmesi halinde kargo ile gönderilir. Mağazadan teslimlerde teslim formu imzalanmadan ürün teslim edilmez.</p>
              <p className={`${body} mb-3`}>Kargo ile gönderim yapılması halinde:</p>
              <ul className="space-y-2">
                {['Ürün sözleşmede belirtilen tarihte kargoya verilir', 'Kargo süresinden kaynaklanan gecikmelerden Meryem Balkan Tasarım Atölyesi sorumlu değildir', 'Ürün teslim alındığında derhal kontrol edilmelidir', 'Teslim anında bildirilmeyen hasarlardan firma sorumlu değildir', 'Kargo ücreti aksi belirtilmedikçe kiracıya aittir'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>2. İADE KOŞULLARI</h2>
              <p className={`${body} mb-3`}>Kiralama süresi teslim tarihinden itibaren 4 gündür. Ürün 4. gün mesai bitimine kadar mağazaya elden teslim edilmeli veya kargo ile gönderilmelidir.</p>
              <ul className="space-y-2 mb-4">
                {['Kargo ile iadelerde iade tarihi, ürünün kargoya verildiği gündür', 'Ürün iade sırasında kontrol edilir ve iade formu düzenlenir', 'İade formu imzalanmadan ürün teslim edilmiş sayılmaz'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>3. HASAR VE GECİKME DURUMU</h2>
              <ul className="space-y-2">
                {['Kullanım süresince oluşan her türlü zarar kiracı sorumluluğundadır', 'İade sırasında tespit edilen hasarlar için tamir bedeli talep edilir', 'Geç iade durumunda günlük satış bedelinin %20\'si cezai şart olarak uygulanır', '5 günü aşan gecikmelerde hukuki işlem başlatılabilir'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>4. CAYMA HAKKI</h2>
              <p className={`${body} mb-3`}>Kiralama hizmeti için yapılan rezervasyonlarda kapora bedeli, tarih ve ürünün kiracı adına ayrılması sebebiyle hizmete hazırlık niteliğindedir.</p>
              <ul className="space-y-2">
                {['Teslim tarihinden 14 gün öncesine kadar yapılan iptallerde, kapora haricindeki ödemeler iade edilir', 'Teslim tarihine 3 günden az kala yapılan iptallerde sözleşmedeki cezai şart uygulanır', 'Ürün teslim alındıktan sonra cayma hakkı kullanılamaz'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>5. İADE TALEBİ</h2>
              <p className={body}>İade taleplerinizi iletişim sayfamızdaki formu kullanarak veya doğrudan e-posta ile iletebilirsiniz. Talepleriniz en geç 2 iş günü içinde yanıtlanacaktır.</p>
              <p className={`${body} mt-3`}>E-posta: meryembalkantasarimatolye@gmail.com</p>
            </section>
          </div>
        </div>
      </div>

      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları</p>
              <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}><i className="ri-instagram-line text-lg"></i></a>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm">KURUMSAL</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {[['Hakkımızda', '/hakkimda'], ['İletişime Geç', '/iletisim'], ['Gizlilik Politikası', '/gizlilik-politikasi'], ['KVKK', '/kvkk'], ['Aydınlatma Metni', '/aydinlatma-metni'], ['Kiralama Sözleşmesi', '/kiralama-sozlesmesi'], ['Mesafeli Satış Sözleşmesi', '/mesafeli-satis-sozlesmesi'], ['Teslimat ve İade Politikası', '/teslimat-ve-iade-politikasi']].map(([label, href]) => (
                  <li key={href}><Link href={href} className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm">İLETİŞİM</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatolye@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; {new Date().getFullYear()} Meryem Balkan Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} isDarkMode={isDarkMode} />
    </div>
  );
}

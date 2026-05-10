'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

export default function GizlilikPolitikasi() {
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
  const sub = `text-sm font-medium mb-3 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning>
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button onClick={toggleTheme} className={nc}><i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i></button>
            <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>MERYEM BALKAN</h1>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link href="/sepet" className={nc}><i className="ri-shopping-bag-line text-sm sm:text-lg"></i></Link>
              <button onClick={() => setShowLoginModal(true)} className={nc}><i className="ri-user-line text-sm sm:text-lg"></i></button>
            </div>
          </div>
          <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
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
            <h1 className={`text-2xl sm:text-3xl font-light tracking-wide mb-3 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>GİZLİLİK POLİTİKASI</h1>
            <p className={`text-xs transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Son güncelleme: 1 Ocak 2026</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className={sh}>1. GENEL BİLGİLER</h2>
              <p className={body}>Meryem Balkan Moda Tasarımı olarak, kişisel verilerinizin güvenliği ve gizliliği bizim için son derece önemlidir. Bu gizlilik politikası, web sitemizi ziyaret ettiğinizde ve hizmetlerimizi kullandığınızda kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.</p>
            </section>

            <section>
              <h2 className={sh}>2. TOPLADĞIMIZ BİLGİLER</h2>
              <p className={sub}>Kişisel Bilgiler</p>
              <ul className="space-y-2 mb-5">
                {['Ad ve soyad', 'E-posta adresi', 'Telefon numarası', 'Adres bilgileri'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
              <p className={sub}>Teknik Bilgiler</p>
              <ul className="space-y-2">
                {['IP adresi', 'Tarayıcı türü ve sürümü', 'İşletim sistemi', 'Web sitesi kullanım istatistikleri'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>3. BİLGİLERİN KULLANIM AMAÇLARI</h2>
              <ul className="space-y-2">
                {['Hizmet sağlama ve müşteri desteği', 'Randevu ve sipariş yönetimi', 'İletişim ve bilgilendirme', 'Web sitesi performansının iyileştirilmesi', 'Yasal yükümlülüklerin yerine getirilmesi'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>4. BİLGİ GÜVENLİĞİ</h2>
              <p className={body}>Kişisel bilgilerinizi yetkisiz erişim, kullanım, değişiklik veya ifşa edilmeye karşı korumak için uygun teknik ve organizasyonel güvenlik önlemleri almaktayız. SSL şifreleme teknolojisi kullanarak veri aktarımlarını güvenli hale getirmekteyiz.</p>
            </section>

            <section>
              <h2 className={sh}>5. ÇEREZLER (COOKIES)</h2>
              <p className={body}>Web sitemiz, kullanıcı deneyimini iyileştirmek ve site performansını analiz etmek amacıyla çerezler kullanmaktadır. Tarayıcınızın ayarlarından çerezleri devre dışı bırakabilirsiniz; ancak bu durumda bazı site özelliklerinin çalışmaması söz konusu olabilir.</p>
            </section>

            <section>
              <h2 className={sh}>6. ÜÇÜNCÜ TARAF PAYLAŞIMLARI</h2>
              <p className={body}>Kişisel bilgilerinizi, yasal zorunluluklar haricinde üçüncü taraflarla paylaşmamaktayız. Hizmet sağlayıcılarımızla (ödeme işleyicileri, kargo şirketleri) paylaştığımız bilgiler yalnızca hizmet sağlama amacıyla sınırlıdır.</p>
            </section>

            <section>
              <h2 className={sh}>7. HAKLARINIZ</h2>
              <p className={`${body} mb-3`}>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="space-y-2">
                {['Kişisel verilerinizin işlenip işlenmediğini öğrenme', 'İşlenen kişisel verileriniz hakkında bilgi talep etme', 'Kişisel verilerinizin düzeltilmesini isteme', 'Kişisel verilerinizin silinmesini isteme', 'Kişisel veri işlemeye itiraz etme'].map((item) => (
                  <li key={item} className={li}><span className={dot}></span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={sh}>8. İLETİŞİM</h2>
              <p className={`${body} mb-1`}>Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz.</p>
              <p className={body}>E-posta: meryembalkantasarimatolye@gmail.com</p>
              <p className={body}>Adres: Atatürk Mahallesi, Muhsin Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan</p>
            </section>

            <section>
              <h2 className={sh}>9. POLİTİKA GÜNCELLEMELERİ</h2>
              <p className={body}>Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olması durumunda sizi bilgilendireceğiz. Bu sayfayı düzenli olarak kontrol etmenizi öneririz.</p>
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
            <p>&copy; 2026 Meryem Balkan Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} isDarkMode={isDarkMode} />
    </div>
  );
}

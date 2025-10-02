
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

export default function GizlilikPolitikasi() {
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning={true}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button 
              onClick={toggleTheme}
              className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i>
            </button>

            <div className="text-center">
              <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : (isDarkMode ? 'text-white' : 'text-black')}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/sepet"
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}
              >
                <i className="ri-shopping-bag-line text-sm sm:text-lg"></i>
              </Link>
              <button 
                onClick={() => setShowLoginModal(true)}
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}
              >
                <i className="ri-user-line text-sm sm:text-lg"></i>
              </button>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600')}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className={`pt-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-black'}`}>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-6 sm:mb-8">GİZLİLİK POLİTİKASI</h2>

        <div className="prose prose-gray max-w-none">
          <p className={`text-base sm:text-lg mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Son Güncelleme Tarihi: 1 Ocak 2025
          </p>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">1. Genel Bilgiler</h3>
            <p className={`leading-relaxed mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Meryem Balkan Moda Tasarımı olarak, kişisel verilerinizin güvenliği ve gizliliği bizim için son derece önemlidir. Bu gizlilik politikası, web sitemizi ziyaret ettiğinizde ve hizmetlerimizi kullandığınızda kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">2. Topladığımız Bilgiler</h3>
            <h4 className="text-lg font-medium mb-3">2.1 Kişisel Bilgiler</h4>
            <ul className={`list-disc pl-6 mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Ad ve soyad</li>
              <li>E-posta adresi</li>
              <li>Telefon numarası</li>
              <li>Adres bilgileri</li>
              <li>Ödeme bilgileri (güvenli ödeme işleyiciler aracılığıyla)</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">2.2 Teknik Bilgiler</h4>
            <ul className={`list-disc pl-6 mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>IP adresi</li>
              <li>Tarayıcı türü ve sürümü</li>
              <li>İşletim sistemi</li>
              <li>Web sitesi kullanım istatistikleri</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">3. Bilgilerin Kullanım Amaçları</h3>
            <ul className={`list-disc pl-6 text-gray-700 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Hizmet sağlama ve müşteri desteği</li>
              <li>Randevu ve sipariş yönetimi</li>
              <li>İletişim ve bilgilendirme</li>
              <li>Web sitesi performansının iyileştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">4. Bilgi Güvenliği</h3>
            <p className={`text-gray-700 leading-relaxed mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Kişisel bilgilerinizi yetkisiz erişim, kullanım, değişiklik veya ifşa edilmeye karşı korumak için uygun teknik ve organizasyonel güvenlik önlemleri almaktayız. SSL şifreleme teknolojisi kullanarak veri aktarımlarını güvenli hale getirmekteyiz.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">5. Çerezler (Cookies)</h3>
            <p className={`text-gray-700 leading-relaxed mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Web sitemiz, kullanıcı deneyimini iyileştirmek ve site performansını analiz etmek amacıyla çerezler kullanmaktadır. Tarayıcınızın ayarlarından çerezleri devre dışı bırakabilirsiniz, ancak bu durumda bazı site özelliklerinin çalışmaması söz konusu olabilir.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">6. Üçüncü Taraf Paylaşımları</h3>
            <p className={`text-gray-700 leading-relaxed mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Kişisel bilgilerinizi, yasal zorunluluklar haricinde üçüncü taraflarla paylaşmamaktayız. Hizmet sağlayıcılarımızla (ödeme işleyicileri, kargo şirketleri) paylaştığımız bilgiler sadece hizmet sağlama amacıyla sınırlıdır.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">7. Haklarınız</h3>
            <p className={`text-gray-700 leading-relaxed mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              KVKK kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className={`list-disc pl-6 text-gray-700 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenen kişisel verileriniz hakkında bilgi talep etme</li>
              <li>Kişisel verilerinizin düzeltilmesini isteme</li>
              <li>Kişisel verilerinizin silinmesini isteme</li>
              <li>Kişisel veri işlemeye itiraz etme</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">8. İletişim</h3>
            <p className={`text-gray-700 leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              <br />
              E-posta: meryembalkantasarımatölyesi@gmail.com
              <br />
              Adres: Atatürk Mahallesi, Muhis Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">9. Politika Güncellemeleri</h3>
            <p className={`text-gray-700 leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olması durumunda sizi bilgilendireceğiz. Bu sayfayı düzenli olarak kontrol etmenizi öneririz.
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
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
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
                <li>meryembalkantasarımatölyesi@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; 2025 Meryem Balkan.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

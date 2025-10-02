
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

export default function AydinlatmaMetni() {
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
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-6 sm:mb-8">KİŞİSEL VERİLERİN İŞLENMESİ AYDINLATMA METNİ</h2>
        
        <div className="prose prose-gray max-w-none">
          <p className={`text-base sm:text-lg mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında hazırlanmıştır.
          </p>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">1. Veri Sorumlusu</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Veri Sorumlusu:</strong> Meryem Balkan Moda Tasarımı
              <br />
              <strong>Adres:</strong> Atatürk Mahallesi, Muhis Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan
              <br />
              <strong>E-posta:</strong> meryembalkantasarımatölyesi@gmail.com
              
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">2. Kişisel Verilerin Hangi Amaçla İşleneceği</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Hizmetlerimizin sunulması ve geliştirilmesi</li>
              <li>Müşteri ilişkileri yönetimi ve müşteri memnuniyetinin sağlanması</li>
              <li>Randevu ve sipariş süreçlerinin yönetimi</li>
              <li>Faturalandırma ve muhasebe işlemleri</li>
              <li>İletişim faaliyetleri ve bilgilendirme</li>
              <li>Pazarlama ve tanıtım faaliyetleri</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>İş operasyonlarının yürütülmesi</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">3. Toplanan Kişisel Veri Türleri</h3>
            <h4 className="text-lg font-medium mb-3">3.1 Kimlik ve İletişim Verileri</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Ad, soyad</li>
              <li>E-posta adresi</li>
              <li>Telefon numarası</li>
              <li>Adres bilgileri</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">3.2 İşlem ve Hizmet Verileri</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Randevu bilgileri</li>
              <li>Sipariş geçmişi</li>
              <li>Ödeme bilgileri</li>
              <li>Tasarım tercihleri</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">3.3 Teknik Veriler</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>IP adresi</li>
              <li>Çerez bilgileri</li>
              <li>Tarayıcı bilgileri</li>
              <li>Site kullanım verileri</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">4. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</h3>
            <h4 className="text-lg font-medium mb-3">4.1 Toplama Yöntemleri</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Web sitesi üzerinden form doldurma</li>
              <li>E-posta ile iletişim</li>
              <li>Telefon görüşmeleri</li>
              <li>Yüz yüze görüşmeler</li>
              <li>Çerezler ve benzer teknolojiler</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">4.2 Hukuki Sebepler</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Sözleşmenin kurulması veya ifasının gerekliliği</li>
              <li>Hukuki yükümlülüğün yerine getirilmesi</li>
              <li>Meşru menfaatin varlığı</li>
              <li>Açık rızanın bulunması</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">5. Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kişisel verileriniz aşağıdaki durumlarda üçüncü kişilerle paylaşılabilir:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Yasal yükümlülüklerin yerine getirilmesi (vergi daireleri, mahkemeler vb.)</li>
              <li>Hizmet sağlayıcılar (ödeme sistemleri, kargo şirketleri, IT hizmet sağlayıcıları)</li>
              <li>İş ortakları (sadece hizmet sunumu için gerekli olan kısmı)</li>
              <li>Yetkili kamu kurum ve kuruluşları</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">6. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kişisel verileriniz, otomatik ve manuel yöntemlerle, web sitemiz, mobil uygulamamız, çağrı merkezi, fiziksel mağazalarımız veya diğer dijital kanallarımız aracılığıyla toplanmaktadır.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">7. Kişisel Veri Sahibinin Hakları</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              KVKK'nın 11. maddesi uyarınca kişisel veri sahipleri olarak haklarınız:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Kişisel veri işlenip işlenmediğini öğrenme</li>
              <li>Kişisel veriler işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerin işlenme amacını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
              <li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme işlemlerinin üçüncü kişilere bildirilmesini isteme</li>
              <li>Otomatik sistemlerle analiz sonuçlarına itiraz etme</li>
              <li>Kanuna aykırı işleme sebebiyle zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">8. Başvuru Yolları</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Haklarınızı kullanmak için aşağıdaki yollarla başvurabilirsiniz:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Yazılı başvuru: Atatürk Mahallesi, Muhis Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan</li>
              <li>Kayıtlı elektronik posta: meryembalkantasarımatölyesi@gmail.com</li>
              <li>Web sitesi iletişim formu</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">9. Veri Güvenliği</h3>
            <p className="text-gray-700 leading-relaxed">
              Kişisel verilerinizin güvenliği bizim için çok önemlidir. Uygun teknik ve idari tedbirleri alarak, kişisel verilerinizi yetkisiz erişim, kayıp, değişiklik ve ifşa edilme gibi risklere karşı korumaktayız.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">10. İletişim</h3>
            <p className="text-gray-700 leading-relaxed">
              Bu aydınlatma metni ile ilgili sorularınız için:
              <br />
              E-posta: meryembalkantasarımatölyesi@gmail.com
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

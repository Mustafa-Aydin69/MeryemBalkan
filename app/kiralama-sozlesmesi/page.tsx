
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

export default function KiralamaSozlesmesi() {
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Initialize client‑side only features (theme & client flag)
  useEffect(() => {
    setIsClient(true);
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // Gracefully handle environments where localStorage is unavailable
      console.warn('Unable to access localStorage:', e);
    }
  }, []);

  // Track scroll position once we know we are on the client
  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  // Theme toggle with safe localStorage access
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    try {
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.warn('Unable to write theme to localStorage:', e);
    }
  };

  const showNavBackground = isClient && scrollY > 50;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'dark bg-gray-900' : 'bg-white'
      }`}
      suppressHydrationWarning={true}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${
          showNavBackground
            ? isDarkMode
              ? 'bg-gray-900 shadow-sm'
              : 'bg-white shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button
              onClick={toggleTheme}
              className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${
                showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              <i
                className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}
              ></i>
            </button>

            <div className="text-center">
              <h1
                className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic ${
                  showNavBackground
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-black'
                    : isDarkMode
                    ? 'text-white'
                    : 'text-black'
                }`}
              >
                MERYEM BALKAN
              </h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${
                  showNavBackground
                    ? isDarkMode
                      ? 'text-white hover:text-gray-300'
                      : 'text-black hover:text-gray-600'
                    : isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                }`}
              >
                <i className="ri-shopping-bag-line text-sm sm:text-lg"></i>
              </Link>
              <button
                onClick={() => setShowLoginModal(true)}
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${
                  showNavBackground
                    ? isDarkMode
                      ? 'text-white hover:text-gray-300'
                      : 'text-black hover:text-gray-600'
                    : isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                }`}
              >
                <i className="ri-user-line text-sm sm:text-lg"></i>
              </button>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link
              href="/"
              className={`cursor-pointer transition-colors font-light whitespace-nowrap ${
                showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              ANASAYFA
            </Link>
            <Link
              href="/portfolio"
              className={`cursor-pointer transition-colors font-light whitespace-nowrap ${
                showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              ELBİSELER
            </Link>
            <Link
              href="/hakkimda"
              className={`cursor-pointer transition-colors font-light whitespace-nowrap ${
                showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              HAKKIMDA
            </Link>
            <Link
              href="/iletisim"
              className={`cursor-pointer transition-colors font-light whitespace-nowrap ${
                showNavBackground
                  ? isDarkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-black hover:text-gray-600'
                  : isDarkMode
                  ? 'text-white hover:text-gray-300'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              İLETİŞİM
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div
        className={`pt-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}
      >
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-6 sm:mb-8">
          KİRALAMA SÖZLEŞMESİ VE YÜKÜMLÜLÜKLERİ
        </h2>

        <div className="prose prose-gray max-w-none">
          <p
            className={`text-base sm:text-lg mb-6 sm:mb-8 transition-colors ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Meryem Balkan Moda Tasarımı özel tasarım kıyafet kiralama hizmetleri
            için geçerli şartlar ve koşullar
          </p>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              1. Genel Hükümler
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bu sözleşme, Meryem Balkan Moda Tasarımı (bundan sonra
              "Kiralayan" olarak anılacaktır) ile kıyafet kiralama hizmeti alan
              müşteri (bundan sonra "Kiracı" olarak anılacaktır) arasında
              imzalanmıştır.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Kiracı, bu sözleşmeyi imzalamakla aşağıda belirtilen tüm şart ve
              koşulları kabul ettiğini beyan eder.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              2. Kiralama Süreci
            </h3>
            <h4 className="text-lg font-medium mb-3">2.1 Rezervasyon</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Kıyafet rezervasyonu en az 7 gün önceden yapılmalıdır</li>
              <li>Rezervasyon için %50 peşin ödeme gereklidir</li>
              <li>
                Son fitting tarihi, etkinlik tarihinden en az 3 gün önce
                olmalıdır
              </li>
              <li>Kalan tutar, kıyafet teslim alınırken ödenmelidir</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">2.2 Teslim Alma</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Kıyafet, etkinlik gününden 1 gün önce teslim alınmalıdır</li>
              <li>
                Teslim sırasında kıyafet detaylı olarak kontrol edilmelidir
              </li>
              <li>Varsa hasarlar tespit tutanağına yazılmalıdır</li>
              <li>Kıyafet ile birlikte verilen aksesuarlar da kontrol edilmelidir</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              3. Kiralama Süreleri ve Ücretler
            </h3>
            <h4 className="text-lg font-medium mb-3">3.1 Standart Kiralama Süreleri</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>1 günlük kiralama: Ürün değerinin %15'i</li>
              <li>3 günlük kiralama: Ürün değerinin %25'i</li>
              <li>7 günlük kiralama: Ürün değerinin %35'i</li>
              <li>Uzun dönem kiralama: Özel fiyatlandırma</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">3.2 Ek Ücretler</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Temizlik ücreti: Kiralama bedelinin %10'u</li>
              <li>Geç teslim cezası: Günlük kiralama bedelinin %50'si</li>
              <li>Hasar tazminatı: Hasarın türü ve boyutuna göre değişken</li>
              <li>Kayıp tazminatı: Ürünün tam satış değeri</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              4. Kiracının Yükümlülükleri
            </h3>
            <h4 className="text-lg font-medium mb-3">4.1 Kullanım Kuralları</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Kıyafeti özenli ve dikkatli kullanmak</li>
              <li>Sigara, alkol ve yoğun parfüm kullanırken dikkatli olmak</li>
              <li>Yemek yerken önlük kullanmak</li>
              <li>Keskin cisimlerden uzak tutmak</li>
              <li>Kıyafeti başka kişilere kiraya vermemek</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">4.2 Yasaklanan Durumlar</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Kıyafeti değiştirmek, kesmek veya üzerinde tadilat yapmak</li>
              <li>Profesyonel fotoğraf çekimi için ticari amaçla kullanmak</li>
              <li>Kıyafeti yurt dışına çıkarmak</li>
              <li>Nemli ve kirli ortamlarda bekletmek</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              5. İade ve Teslim
            </h3>
            <h4 className="text-lg font-medium mb-3">5.1 İade Zamanı</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kıyafet, belirlenen son teslim tarihinde saat 18:00'a kadar iade
              edilmelidir. Geç teslimde günlük ceza uygulanır.
            </p>

            <h4 className="text-lg font-medium mb-3">5.2 İade Durumu</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Kıyafet temiz ve bakımlı şekilde iade edilmelidir</li>
              <li>Teslim alınan tüm aksesuarlar eksiksiz iade edilmelidir</li>
              <li>Görünür kirlilik temizlik ücreti doğurur</li>
              <li>Hasar tespit edilirse tazminat hesaplanır</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              6. Hasar ve Tazminat
            </h3>
            <h4 className="text-lg font-medium mb-3">6.1 Hasar Türleri</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Küçük leke ve hafif kirlilik: Temizlik ücreti</li>
              <li>Kalıcı leke ve renk solması: Ürün değerinin %25-50'si</li>
              <li>Yırtık ve kopmalar: Onarım maliyeti + işçilik</li>
              <li>Büyük hasar: Ürün değerinin %50-100'ü</li>
              <li>Kullanılamaz hale gelme: Ürünün tam değeri</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">6.2 Tazminat Süreci</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Hasar tespit edildiğinde, uzman değerlendirmesi yapılır ve tazminat
              miktarı belirlenir. Kiracı, tazminat tutarını 7 gün içinde ödemekle
              yükümlüdür.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              7. İptal ve Değişiklik
            </h3>
            <h4 className="text-lg font-medium mb-3">7.1 İptal Koşulları</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Etkinlik tarihinden 7 gün önceki iptaller: %50 ücret iadesi</li>
              <li>3-7 gün arası iptaller: %25 ücret iadesi</li>
              <li>Son 3 gün içindeki iptaller: İade yapılmaz</li>
              <li>Force majeure durumları: Özel değerlendirme</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">7.2 Değişiklik Talepleri</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tarih ve ürün değişiklikleri müsaitlik durumuna göre yapılabilir.
              Ek ücret ve fark ödemesi gerekebilir.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              8. Güvence ve Depozito
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kıyafet değerinin %30'u kadar güvence alınır. Bu tutar, ürün
              sağlam şekilde iade edildiğinde 3 iş günü içinde iade edilir.
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Nakit, kredi kartı veya havale ile ödenebilir</li>
              <li>Hasarsız iade durumunda tam iade</li>
              <li>Hasar varsa, hasar bedeli düşülerek kalan iade edilir</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              9. Özel Durumlar
            </h3>
            <h4 className="text-lg font-medium mb-3">9.1 Ölçü Uyumsuzluğu</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Son fitting sonrası ölçü uyumsuzluğu tespit edilirse, mümkün olan
              düzeltmeler yapılır. Büyük değişiklik gerekirse alternatif ürün
              önerilir.
            </p>

            <h4 className="text-lg font-medium mb-3">9.2 Etkinlik İptali</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kiracının etkinliğinin iptal olması durumunda, kiralama sözleşmesi
              de iptal edilebilir. İptal koşulları yukarıdaki maddeler
              geçerlidir.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              10. Yasal Hükümler
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bu sözleşme Türk Hukuku'na tabidir. Sözleşmeden doğacak
              uyuşmazlıklarda Erzincan mahkemeleri yetkilidir.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Sözleşme her iki tarafça da okunmuş, anlaşılmış ve kabul edilmiştir.
              Değişiklikler yazılı olarak yapılmalıdır.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-medium mb-3 sm:mb-4">
              11. İletişim Bilgileri
            </h3>
            <p className="text-gray-700 leading-relaxed">
              <strong>Meryem Balkan Moda Tasarımı</strong>
              <br />
              Adres: Atatürk Mahallesi, Muhis Yazıcıoğlu Caddesi No: 15/B, Merkez / Erzincan
              <br />
              E-posta: meryembalkantasarımatölyesi@gmail.com
              <br />
              Çalışma Saatleri: Pazartesi-Cuma 09:00-18:00, Cumartesi
              10:00-16:00
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-900 text-white border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">
                MERYEM BALKAN
              </h4>
              <p
                className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve
                sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/meryembalkan_ateiler/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'border-gray-600 hover:bg-gray-700'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <i className="ri-instagram-line text-lg"></i>
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">
                KURUMSAL
              </h5>
              <ul
                className={`space-y-2 text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <li>
                  <Link
                    href="/hakkimda"
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:text-white' : 'hover:text-black'
                    }`}
                  >
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/iletisim"
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:text-white' : 'hover:text-black'
                    }`}
                  >
                    İletişime Geç
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gizlilik-politikasi"
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:text-white' : 'hover:text-black'
                    }`}
                  >
                    Gizlilik Politikası
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kvkk"
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:text-white' : 'hover:text-black'
                    }`}
                  >
                    KVKK
                  </Link>
                </li>
                <li>
                  <Link
                    href="/aydinlatma-metni"
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:text-white' : 'hover:text-black'
                    }`}
                  >
                    Aydınlatma Metni
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kiralama-sozlesmesi"
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:text-white' : 'hover:text-black'
                    }`}
                  >
                    Kiralama Sözleşmesi ve Yükümlülükleri
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">
                İLETİŞİM
              </h5>
              <ul
                className={`space-y-2 text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarımatölyesi@gmail.com</li>
              </ul>
            </div>
          </div>

          <div
            className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${
              isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
            }`}
          >
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

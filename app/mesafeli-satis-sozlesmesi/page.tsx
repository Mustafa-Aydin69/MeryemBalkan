"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LoginModal from "../components/LoginModal";

export default function MesafeliSatisSozlesmesi() {
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isClient]);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const showNavBackground = isClient && scrollY > 50;

  const textClass = (isDark: boolean) =>
    isDark ? "text-gray-300" : "text-gray-600";
  const headingClass = (isDark: boolean) =>
    isDark ? "text-white" : "text-black";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-white"
        }`}
      suppressHydrationWarning
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground
            ? isDarkMode
              ? "bg-gray-900 shadow-sm"
              : "bg-white shadow-sm"
            : "bg-transparent"
          }`}
      >
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button
              onClick={toggleTheme}
              className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground
                  ? isDarkMode
                    ? "text-white hover:text-gray-300"
                    : "text-black hover:text-gray-600"
                  : isDarkMode
                    ? "text-white hover:text-gray-300"
                    : "text-black hover:text-gray-600"
                }`}
            >
              <i
                className={`${isDarkMode ? "ri-sun-line" : "ri-moon-line"} text-sm sm:text-lg`}
              />
            </button>
            <div className="text-center">
              <h1
                className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic ${headingClass(isDarkMode)}`}
              >
                MERYEM BALKAN
              </h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}
              >
                <i className="ri-shopping-bag-line text-sm sm:text-lg" />
              </Link>
              <button
                onClick={() => setShowLoginModal(true)}
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}
              >
                <i className="ri-user-line text-sm sm:text-lg" />
              </button>
            </div>
          </div>
          <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}>
              ANASAYFA
            </Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}>
              ELBİSELER
            </Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}>
              HAKKIMDA
            </Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}>
              İLETİŞİM
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div
        className={`pt-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 transition-colors duration-300 ${headingClass(isDarkMode)}`}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-6 sm:mb-8">
          MESAFELİ SATIŞ SÖZLEŞMESİ
        </h1>

        <div className="prose prose-gray max-w-none space-y-8">

          {/* 1 - Taraflar ve Konu */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              1- Taraflar ve Konu
            </h2>
            <p className={`leading-relaxed ${textClass(isDarkMode)}`}>
              İşbu Genel Kiralama Şartları ile, merkezi &quot;Atatürk Mahallesi,
              Muhsin Yazıcıoğlu Caddesi No:15/B Merkez ERZİNCAN&quot; adresinde
              bulunan Meryem Balkan Tasarım Atölyesi tarafından sağlanan kiralama
              hizmeti ile ilgili tabi olunan şart ve hükümler düzenlenmiştir.
              Bundan sonra kiralanan eşya &quot;ÜRÜN&quot;, Ürünü Kiraya Veren
              Meryem Balkan Tasarım Atölyesi &quot;KİRAYA VEREN&quot; ve ürünü
              kullanmak üzere kiralayan &quot;KİRACI&quot; olarak anılacaktır.
            </p>
          </section>

          {/* 2 - Sözleşme Bedeli ve Süresi */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              2- Sözleşme Bedeli ve Süresi
            </h2>
            <div className={`space-y-4 ${textClass(isDarkMode)}`}>
              <p className="leading-relaxed">
                <span className="font-medium">2.1.</span> Sözleşme toplam bedeli,
                ürünün kiralama bedeli ve varsa kargo bedelinin toplamıdır. Bahse
                konu tutarın %75&apos;i kiralama bedeli, %25&apos;i randevu ve
                elbise tarihinin ayırtılması hizmetlerini kapsayan kapora
                bedelidir. KİRACI sözleşme bedelini en geç teslim tarihine dek
                ödemekle yükümlüdür. Ödemenin tamamı yapılmadığı takdirde KİRAYA
                VEREN ürünü teslim etmeyebilir. KİRACI ürünü herhangi bir sebeple
                kullanamasa dahi kapora bedelini ödemekten kaçınamaz.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">2.2.</span> Kiralama süresi teslim
                tarihinden itibaren 4 gündür. Açık izin olmadığı sürece 4. gün
                mesai bitimine kadar iade zorunludur.
              </p>
            </div>
          </section>

          {/* 3 - KİRAYA VEREN'in Yükümlülükleri */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              3- KİRAYA VEREN&apos;in Yükümlülükleri
            </h2>
            <div className={`space-y-4 ${textClass(isDarkMode)}`}>
              <p className="leading-relaxed">
                <span className="font-medium">3.1.</span> ÜRÜN temiz ve hasarsız
                teslim edilir. Teslim anında bildirilmeyen hasarlardan KİRAYA
                VEREN sorumlu değildir.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">3.2.</span> İade sırasında kontrol
                yapılır ve forma yazılır.
              </p>
            </div>
          </section>

          {/* 4 - KİRACI'nın Yükümlülükleri */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              4- KİRACI&apos;nın Yükümlülükleri
            </h2>
            <div className={`space-y-4 ${textClass(isDarkMode)}`}>
              <p className="leading-relaxed">
                <span className="font-medium">4.1.</span> Teslimde kontrol yapıp
                hasar bildirmek zorundadır.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">4.2.</span> Kullanım süresince
                oluşan tüm zararlardan sorumludur.
              </p>
            </div>
          </section>

          {/* 5 - ÜRÜN'ün Teslimi ve İadesi */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              5- ÜRÜN&apos;ün Teslimi ve İadesi
            </h2>
            <div className={`space-y-4 ${textClass(isDarkMode)}`}>
              <p className="leading-relaxed">
                <span className="font-medium">5.1.</span> Tarihler değiştirilemez
                (yazılı onay hariç).
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.2.</span> Ödeme şekli teslimde
                değiştirilemez. Nakit sözleşmenin kartla teslim alınması halinde
                %5 cezai bedel uygulanır.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.3.</span> Teslim formu
                imzalanmadan ürün verilmez.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.4.</span> İade formu
                imzalanmazsa ürün teslim edilmemiş sayılır.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.5.</span> Yazılı onay ile kargo
                yapılabilir; taşıma riskleri KİRACI&apos;ya aittir.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.6.</span> Kargo ile iadede tarih,
                kargoya veriliş günüdür.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.7.</span> Farklı ürün iade
                edilirse satış bedelinin tamamı alınır.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.8.</span> Teslim formunda olmayan
                fakat iade sırasında görülen hasarlar için tamir bedeli (en fazla
                satış bedeline kadar) KİRACI tarafından ödenir.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.9.</span> Geç iade halinde satış
                bedelinin %20&apos;si günlük cezai şart uygulanır.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">5.10.</span> 5 günden fazla
                gecikmede suç duyurusu ve tazminat hakkı doğar.
              </p>
            </div>
          </section>

          {/* 6 - Sözleşmenin Feshi */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              6- Sözleşmenin Feshi
            </h2>
            <div className={`space-y-4 ${textClass(isDarkMode)}`}>
              <p className="leading-relaxed">
                <span className="font-medium">6.1.</span> KİRAYA VEREN
                feshedebilir, kiracı hak talep edemez.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">6.2.</span> KİRACI feshederse madde
                7 ve 8 geçerlidir.
              </p>
            </div>
          </section>

          {/* 7 - Kapora */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">7- Kapora</h2>
            <div className={`space-y-4 ${textClass(isDarkMode)}`}>
              <p className="leading-relaxed">
                <span className="font-medium">7.1.</span> Toplam bedelin
                %25&apos;idir.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">7.2.</span> Kiracı feshederse iade
                edilmez.
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">7.3.</span> Kiraya veren haksız
                feshederse iade edilir.
              </p>
            </div>
          </section>

          {/* 8 - Cezai Şart */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              8- Cezai Şart
            </h2>
            <p className={`leading-relaxed ${textClass(isDarkMode)}`}>
              Teslime 3 günden az kala fesihte toplam bedelin %50&apos;si alınır
              ve indirim talep edilemez. Ek masraflar ayrıca istenebilir.
            </p>
          </section>

          {/* 9 - Devir Yasağı */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              9- Devir Yasağı
            </h2>
            <p className={`leading-relaxed ${textClass(isDarkMode)}`}>
              Yazılı izin olmadan devredilemez.
            </p>
          </section>

          {/* 10 - Yetkili Mahkeme */}
          <section>
            <h2 className="text-xl sm:text-2xl font-medium mb-4">
              10- Yetkili Mahkeme
            </h2>
            <p className={`leading-relaxed ${textClass(isDarkMode)}`}>
              İşbu sözleşmeden kaynaklanacak uyuşmazlıklarda Erzincan Mahkeme ve
              İcra Daireleri yetkilidir. İşbu sözleşme taraflarca okunmuş,
              anlaşılmış ve imza altına alınmıştır.
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer
        className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">
                MERYEM BALKAN
              </h4>
              <p
                className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base ${textClass(isDarkMode)}`}
              >
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve
                sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/meryembalkan_ateiler/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}`}
                >
                  <i className="ri-instagram-line text-lg" />
                </a>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">
                KURUMSAL
              </h5>
              <ul className={`space-y-2 text-sm ${textClass(isDarkMode)}`}>
                <li>
                  <Link href="/hakkimda" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link href="/iletisim" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    İletişime Geç
                  </Link>
                </li>
                <li>
                  <Link href="/gizlilik-politikasi" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    Gizlilik Politikası
                  </Link>
                </li>
                <li>
                  <Link href="/kvkk" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    KVKK
                  </Link>
                </li>
                <li>
                  <Link href="/aydinlatma-metni" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    Aydınlatma Metni
                  </Link>
                </li>
                <li>
                  <Link href="/kiralama-sozlesmesi" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    Kiralama Sözleşmesi ve Yükümlülükleri
                  </Link>
                </li>
                <li>
                  <Link href="/mesafeli-satis-sozlesmesi" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    Mesafeli Satış Sözleşmesi
                  </Link>
                </li>
                <li>
                  <Link href="/teslimat-ve-iade-politikasi" className={`cursor-pointer ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
                    Teslimat ve İade Politikası
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">
                İLETİŞİM
              </h5>
              <ul className={`space-y-2 text-sm ${textClass(isDarkMode)}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatölye@gmail.com</li>
              </ul>
            </div>
          </div>
          <div
            className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
          >
            <p>&copy; 2026 Meryem Balkan Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
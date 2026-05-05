
'use client';
import Link from 'next/link';
import CounterSection from '../components/CounterSection';
import LoginModal from '../components/LoginModal';
import { useState, useEffect } from 'react';

export default function Hakkimda() {
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Sepet durumunu kontrol et
    const checkCartItems = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setHasCartItems(cartItems.length > 0);
    };

    checkCartItems();

    // Storage değişikliklerini dinle
    window.addEventListener('storage', checkCartItems);

    // Custom event dinle
    window.addEventListener('cartUpdated', checkCartItems);

    return () => {
      window.removeEventListener('storage', checkCartItems);
      window.removeEventListener('cartUpdated', checkCartItems);
    };
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

  const showNavBackground = isClient && scrollY > 200;

  return (
  <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
    {/* Navigation */}
    <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-lg' : 'bg-white shadow-lg') : 'bg-transparent'}`}>
      <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
        {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
        <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
          <button
            onClick={toggleTheme}
            className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
          >
            <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i>
          </button>

          <div className="text-center">
            <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : 'text-white'}`}>MERYEM BALKAN</h1>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/sepet"
              className={`relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
            >
              <i className={`ri-shopping-bag-line text-sm sm:text-lg ${hasCartItems ? 'animate-bounce' : ''}`}></i>
            </Link>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
            >
              <i className="ri-user-line text-sm sm:text-lg"></i>
            </button>
          </div>
        </div>

        {/* Alt Satır: Menü Öğeleri */}
        <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
          <Link href="/" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
          <Link href="/portfolio" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
          <Link href="/hakkimda" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
          <Link href="/iletisim" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <section className={`pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className={`text-xs tracking-[0.4em] mb-3 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>HAKKIMDA</p>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light font-serif italic tracking-wide transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Meryem Balkan Tasarım Atölyesi</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <div>
            <p className={`text-base sm:text-lg leading-relaxed mb-5 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Zarafetin ve ihtişamın buluştuğu özel bir moda evi olarak Erzincan'da hizmet vermektedir. Gelinlik, haute couture ve özel kiralama koleksiyonlarımızla her kadının benzersiz güzelliğini ortaya çıkarmayı ilke edindik.
            </p>
            <p className={`text-sm sm:text-base leading-relaxed mb-5 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Her tasarımımız, özenle seçilmiş kumaşlar, kusursuz işçilik ve estetik detaylarla hayat bulur. Atölyemizde yalnızca bir kıyafet değil; asalet, şıklık ve hayallerinize dokunan bir sanat eseri tasarlıyoruz.
            </p>
            <p className={`text-sm sm:text-base leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Misyonumuz; en özel anlarınıza değer katmak, size ayrıcalıklı bir deneyim yaşatmak ve hayallerinizdeki görünüme sizi kavuşturmaktır.
            </p>
          </div>
          <div className={`border-l-2 pl-8 py-2 transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-lg sm:text-xl font-light font-serif italic leading-relaxed mb-8 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              "Gerçek zarafet, detaylarda gizlidir."
            </p>
            <div className={`space-y-4 text-sm transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-3">
                <i className="ri-map-pin-line"></i>
                <span>Erzincan, Türkiye</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="ri-scissors-line"></i>
                <span>13+ yıl deneyim</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="ri-global-line"></i>
                <span>Milano & Stuttgart koleksiyonları</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>


      {/* Counter Section */}
      <CounterSection />

      {/* Experience Timeline */}
      <section className={`py-12 sm:py-16 lg:py-20 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h3 className={`text-2xl sm:text-3xl font-light tracking-wide text-center mb-12 sm:mb-16 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>DENEYİM</h3>

          <div className="space-y-0">
            <div className="flex gap-5 sm:gap-8">
              <div className="text-right w-14 sm:w-20 shrink-0 pt-1">
                <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2025</span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                <div className={`w-px flex-1 mt-2 transition-colors ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex-1 pb-10">
                <h4 className={`text-base sm:text-lg font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Uluslararası Adım</h4>
                <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Koleksiyonlarımız, Milano ve Stuttgart'ta düzenlenen özel etkinliklerde sergilendi. Markamızın uluslararası arenada ilk kez kendini gösterdiği bu adım, tasarımlarımızın sınırları aştığını kanıtladı.</p>
              </div>
            </div>

            <div className="flex gap-5 sm:gap-8">
              <div className="text-right w-14 sm:w-20 shrink-0 pt-1">
                <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2025</span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                <div className={`w-px flex-1 mt-2 transition-colors ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex-1 pb-10">
                <h4 className={`text-base sm:text-lg font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Kişisel Atölye Açılışı</h4>
                <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tutku ve emekle büyüyen markam, daha büyük ve modern bir mekânda sizlerle buluşuyor. Yaratıcılığımı daha özgür ifade edebildiğim bu alan, her detayıyla özenle planlandı.</p>
              </div>
            </div>

            <div className="flex gap-5 sm:gap-8">
              <div className="text-right w-14 sm:w-20 shrink-0 pt-1">
                <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2022</span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                <div className={`w-px flex-1 mt-2 transition-colors ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex-1 pb-10">
                <h4 className={`text-base sm:text-lg font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>İlk Atölye Açılışı</h4>
                <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>10 yıl süren emek, deneyim ve tutkuyu bir araya getirerek Erzincan'da kendi tasarım atölyemi hayata geçirdim. Her parçaya ruhumu ve zarafet anlayışımı yansıtarak kadınların kendilerini özel hissetmesini hedefledim.</p>
              </div>
            </div>

            <div className="flex gap-5 sm:gap-8">
              <div className="text-right w-14 sm:w-20 shrink-0 pt-1">
                <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2019</span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                <div className={`w-px flex-1 mt-2 transition-colors ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex-1 pb-10">
                <h4 className={`text-base sm:text-lg font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>İlk Marka Koleksiyonu</h4>
                <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Kendi markam altında ilk hazır giyim koleksiyonumu çıkararak ticari başarı elde ettim.</p>
              </div>
            </div>

            <div className="flex gap-5 sm:gap-8">
              <div className="text-right w-14 sm:w-20 shrink-0 pt-1">
                <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2019</span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                <div className={`w-px flex-1 mt-2 transition-colors ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex-1 pb-10">
                <h4 className={`text-base sm:text-lg font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Eğitim</h4>
                <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aldığım eğitimle moda tasarımı bilgimi derinleştirdim. Modern teknikler ve geleneksel el işçiliğini harmanlayarak tasarımlarımda hem şıklığı hem kalıcılığı ön plana çıkarmayı öğrendim.</p>
              </div>
            </div>

            <div className="flex gap-5 sm:gap-8">
              <div className="text-right w-14 sm:w-20 shrink-0 pt-1">
                <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2013</span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
              </div>
              <div className="flex-1 pb-2">
                <h4 className={`text-base sm:text-lg font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Kariyer Başlangıcı</h4>
                <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Erzincan'da kendi imkânlarıyla dikime başlayarak moda yolculuğuna adım atıldı.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className={`text-2xl sm:text-3xl font-light tracking-wide mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>TASARIM FELSEFESİ</h3>
          <p className={`text-base sm:text-lg lg:text-xl leading-relaxed mb-8 sm:mb-12 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            "Her kadın eşsizdir ve bu eşsizlik kıyafetlerinde de yansımalıdır. Tasarımlarımda sadece güzellik değil, kadının içindeki gücü ve özgüveni ortaya çıkarmayı hedefliyorum."
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-center mt-2">
            <div className={`p-6 sm:p-8 rounded-2xl border transition-colors ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
              <div className={`w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                <i className={`ri-leaf-line text-xl transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
              </div>
              <h4 className={`text-xs font-medium mb-3 tracking-widest transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>SÜRDÜRÜLEBİLİRLİK</h4>
              <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Çevre dostu kumaşlar ve etik üretim süreçleri</p>
            </div>

            <div className={`p-6 sm:p-8 rounded-2xl border transition-colors ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
              <div className={`w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                <i className={`ri-heart-line text-xl transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
              </div>
              <h4 className={`text-xs font-medium mb-3 tracking-widest transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>EL İŞÇİLİĞİ</h4>
              <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Geleneksel teknikler ve modern yorumlar</p>
            </div>

            <div className={`p-6 sm:p-8 rounded-2xl border transition-colors ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
              <div className={`w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                <i className={`ri-star-line text-xl transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
              </div>
              <h4 className={`text-xs font-medium mb-3 tracking-widest transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>KİŞİSELLİK</h4>
              <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Her kadının tarzına özel tasarımlar</p>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className={`py-12 sm:py-16 lg:py-20 text-white transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-black'}`}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-4 sm:mb-6">BİRLİKTE ÇALIŞALIM</h3>
          <p className="text-base sm:text-lg lg:text-xl opacity-90 mb-8 sm:mb-12">
            Size özel tasarımlar için benimle iletişime geçin
          </p>
          <Link href="/iletisim" className="inline-block bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap rounded-full">
            İLETİŞİME GEÇ
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="col-span-1">
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
                <li><Link href="/mesafeli-satis-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link href="/teslimat-ve-iade-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Teslimat ve İade Politikası</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">İLETİŞİM</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatölye@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
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
    </div>
  );
}

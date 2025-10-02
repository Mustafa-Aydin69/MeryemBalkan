
'use client';
import Link from 'next/link';
import LoginModal from './components/LoginModal';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
  const [visibleProducts, setVisibleProducts] = useState<Set<number>>(new Set());
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('GELİNLİK'); // Başlangıç değeri sabit
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [typingStarted, setTypingStarted] = useState(false); // Yazı başlama kontrolü
  const [hasCartItems, setHasCartItems] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const productObserverRef = useRef<IntersectionObserver | null>(null);

  const typingWords = [
    { text: 'GELİNLİK', color: 'text-pink-400' },
    { text: 'ABİYE', color: 'text-yellow-400' },
    { text: 'NİSANLIK', color: 'text-purple-400' },
    { text: 'KINALIK', color: 'text-orange-400' },
    { text: 'AFTER PARTY', color: 'text-red-400' },
    { text: 'ÖZEL DİKİM', color: 'text-blue-400' }
  ];

  const heroImages = [
    {
      id: 0,
      title: "Meryem Balkan",
      subtitle: "Moda Tasarımcısı",
      description: "Hayallerinizdeki özel günler için şıklığı ve zarafeti bir araya getiriyorum",
      buttonText: "Koleksiyonları Keşfet",
      buttonLink: "/portfolio",
      secondButtonText: "İletişime Geç",
      secondButtonLink: "/iletisim",
      video: "images/Anasayfa/Giris_Kismi_Video.mp4"
    },
    {
      id: 1,
      title: "Hayalinizdeki\nGelinlik",
      description: "Düğün gününüzü unutulmaz kılacak, size özel tasarımlar.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=gelinlik",
      image: "images/Anasayfa/Gelinlik.jpg"
    },
    {
      id: 2,
      title: "Nişan Günü\nZarafeti",
      description: "Nişan günü için özel tasarlanmış zarif ve romantik elbiselerle unutulmaz anlar yaşayın.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=nisanlik",
      image: "images/Anasayfa/Nişanlık.jpg"
    },
    {
      id: 3,
      title: "Kına Gecesi\nIşıltısı",
      description: "Özel tasarımlar, zarif detaylarla birleşiyor. Kına gecenizde sizi yansıtan benzersiz parçalar.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=kinalik",
      image: "images/Anasayfa/Kınalık.jpg"
    },
    {
      id: 4,
      title: "Eşsiz Abiye\nTasarımları",
      description: "Özel anlarında dikkatleri üzerinizde toplamak için tasarlanmış abiyeler.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=abiye",
      image: "images/Anasayfa/Abiye.jpg"
    },
    {
      id: 5,
      title: "Geceyi Sarmalayan Şıklık\nAFTER PARTY Koleksiyonu",
      description: "Gecenin ritmini yakalayın! After party koleksiyonumuz, şıklığı ve rahatlığı bir araya getiriyor.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=after-party",
      image: "images/Anasayfa/First.jpg"
    },
    
    
  ];

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
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

    // Typing efektini başlat
    setTimeout(() => {
      setTypingStarted(true);
    }, 1000);

    return () => {
      window.removeEventListener('storage', checkCartItems);
      window.removeEventListener('cartUpdated', checkCartItems);
    };
  }, []);

  useEffect(() => {
    if (!isClient || !typingStarted) return;

    const currentWord = typingWords[currentWordIndex];
    const targetText = currentWord.text;

    const typeWriter = () => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < targetText.length) {
          setDisplayText(targetText.substring(0, displayText.length + 1));
        } else {
          // Word complete, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.substring(0, displayText.length - 1));
        } else {
          // Deletion complete, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
        }
      }
    };

    const speed = isDeleting ? 100 : 150;
    const timer = setTimeout(typeWriter, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentWordIndex, isClient, typingStarted]);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const imageId = parseInt(entry.target.getAttribute('data-image-id') || '0');
          if (entry.isIntersecting) {
            setVisibleImages((prev) => new Set([...prev, imageId]));
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -20% 0px'
      }
    );

    productObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const productId = parseInt(entry.target.getAttribute('data-product-id') || '0');
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleProducts((prev) => new Set([...prev, productId]));
            }, productId * 200);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    const imageElements = document.querySelectorAll('[data-image-id]');
    imageElements.forEach((el) => {
      observerRef.current?.observe(el);
    });

    const productElements = document.querySelectorAll('[data-product-id]');
    productElements.forEach((el) => {
      productObserverRef.current?.observe(el);
    });

    setTimeout(() => {
      setVisibleImages((prev) => new Set([...prev, 0]));
    }, 800);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (productObserverRef.current) {
        productObserverRef.current.disconnect();
      }
    };
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

  // Hydration hatası için güvenli scroll kontrolü
  const showNavBackground = isClient && scrollY > (typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800);

  // Hydration hatası düzeltmesi için suppressHydrationWarning
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning={true}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button
              onClick={toggleTheme}
              className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i>
            </button>

            <div className="text-center">
              <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : 'text-white'}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
              >
                <i className={`ri-shopping-bag-line text-sm sm:text-lg ${hasCartItems ? 'animate-bounce' : ''}`}></i>
              </Link>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
              >
                <i className="ri-user-line text-sm sm:text-lg"></i>
              </button>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Hero Images - Vertical Scroll */}
      <section className="relative">
        {heroImages.map((image, index) => (
          <div
            key={image.id}
            data-image-id={image.id}
            className="relative h-screen overflow-hidden"
          >
            {/* Background Video or Image with Reveal Animation */}
            <div className="absolute inset-0">
              <div
                className={`absolute inset-0 bg-black transition-all duration-[4000ms] ease-out z-10 ${visibleImages.has(image.id) ? 'opacity-0' : 'opacity-100'}`}
              ></div>
              {image.video ? (
                <video
                  src={image.video}
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className={`w-full h-full object-cover object-center transition-all duration-[4000ms] ease-out ${visibleImages.has(image.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                />
              ) : (
                <img
                  src={image.image}
                  alt={image.title}
                  className={`w-full h-full object-cover object-center transition-all duration-[4000ms] ease-out ${visibleImages.has(image.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                />
              )}
              <div className="absolute inset-0 bg-black/30"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center h-full">
              <div className={`text-center text-white max-w-2xl px-4 sm:px-8 transition-all duration-[4000ms] delay-[1000ms] ease-out ${visibleImages.has(image.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {image.id === 0 ? (
                  <>
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light tracking-wide mb-2 font-serif transform -skew-x-[20deg] text-left italic">
                      {image.title}
                    </h2>
                    <p className={`text-lg sm:text-xl lg:text-2xl opacity-80 mb-6 sm:mb-8 font-light tracking-wider text-left font-serif italic ${typingWords[currentWordIndex].color}`} suppressHydrationWarning={true}>
                      {displayText}
                      {typingStarted && <span className="animate-pulse">|</span>}
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl opacity-90 mb-8 sm:mb-12 leading-relaxed font-light text-left">
                      {image.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start">
                      <Link
                        href={image.buttonLink}
                        className="inline-block bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap rounded-full"
                      >
                        {image.buttonText}
                      </Link>
                      <Link
                        href={image.secondButtonLink!}
                        className="inline-block border border-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-white hover:text-black transition-colors cursor-pointer whitespace-nowrap rounded-full"
                      >
                        {image.secondButtonText}
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light tracking-wide mb-4 sm:mb-6 whitespace-pre-line font-serif">
                      {image.title}
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl opacity-90 mb-8 sm:mb-12 leading-relaxed font-light">
                      {image.description}
                    </p>
                    <Link
                      href={image.buttonLink}
                      className="inline-block bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap rounded-full"
                    >
                      {image.buttonText}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      

      {/* Contact CTA */}
      <section className={`py-12 sm:py-16 lg:py-20 text-white transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-black'}`}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-4 sm:mb-6 font-serif">HAYALLERINIZI GERÇEKLEŞTIRIN</h3>
          <p className="text-base sm:text-lg lg:text-xl opacity-90 mb-8 sm:mb-12">
            Size özel tasarımlar için iletişime geçin ve hayalinizdeki kıyafete kavuşun
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/iletisim" className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap rounded-full">
              İLETİŞİME GEÇ
            </Link>
            <Link href="/portfolio" className="border border-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-white hover:text-black transition-colors cursor-pointer whitespace-nowrap rounded-full">
              KOLEKSİYONLARI GÖZDEN GEÇİR
            </Link>
          </div>
        </div>
      </section>

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
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

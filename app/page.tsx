'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LoginModal from './components/LoginModal';
import { useState, useEffect, useRef } from 'react';

// Admin login bileşenini lazy load yap - sadece tetik varsa yüklensin
const SecureAdminLogin = dynamic(
  () => import('./components/SecureAdminLogin'),
  { ssr: false, loading: () => null }
);

export default function Home() {
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
  const [visibleProducts, setVisibleProducts] = useState<Set<number>>(new Set());
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('GELİNLİK');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [typingStarted, setTypingStarted] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminTriggerActive, setAdminTriggerActive] = useState(false);
  const [instagramPosts, setInstagramPosts] = useState<{ id: number; image_path: string; instagram_link?: string | null }[]>([]);
  const [instagramIndex, setInstagramIndex] = useState(0);
  const [sliderMode, setSliderMode] = useState<'mobile' | 'desktop'>('desktop');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const productObserverRef = useRef<IntersectionObserver | null>(null);
  const touchStartX = useRef(0);
  

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
      image: "images/Anasayfa/GelinlikYeni.jpg"
    },
    {
      id: 2,
      title: "Nişan Günü\nZarafeti",
      description: "Nişan günü için özel tasarlanmış zarif ve romantik elbiselerle unutulmaz anlar yaşayın.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=nisanlik",
      image: "images/Anasayfa/NisanlikYeni.jpg"
    },
    {
      id: 3,
      title: "Kına Gecesi\nIşıltısı",
      description: "Özel tasarımlar, zarif detaylarla birleşiyor. Kına gecenizde sizi yansıtan benzersiz parçalar.",
      buttonText: "Hemen İncele",
      buttonLink: "/portfolio?category=kinalik",
      image: "images/Anasayfa/Kinalik.jpg"
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
      image: "images/Anasayfa/FirstYeni.jpg"
    },
  ];

  // Admin tetik kontrolü - cookie ile (middleware'den gelir)
  useEffect(() => {
    // Cookie kontrolü - admin_entry_verified varsa aktif et
    const cookies = document.cookie.split(';');
    const hasAdminEntry = cookies.some(cookie => 
      cookie.trim().startsWith('admin_entry_verified=true')
    );
    
    if (hasAdminEntry) {
      setAdminTriggerActive(true);
      // Cookie'yi temizle (tek kullanımlık)
      document.cookie = 'admin_entry_verified=; path=/; max-age=0';
    }
  }, []);

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

    const checkCartItems = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setHasCartItems(cartItems.length > 0);
    };

    checkCartItems();
    window.addEventListener('storage', checkCartItems);
    window.addEventListener('cartUpdated', checkCartItems);

    setTimeout(() => {
      setTypingStarted(true);
    }, 1000);

    fetch('/api/instagram')
      .then((r) => r.json())
      .then(({ posts }) => setInstagramPosts(posts || []))
      .catch(() => {});

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
        if (displayText.length < targetText.length) {
          setDisplayText(targetText.substring(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.substring(0, displayText.length - 1));
        } else {
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

  useEffect(() => {
    if (!isClient) return;
    const check = () => setSliderMode(window.innerWidth < 640 ? 'mobile' : 'desktop');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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

  const showNavBackground = isClient && scrollY > (typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800);
  
  if (!isClient) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning={true}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900/90 backdrop-blur border-b border-gray-700' : 'bg-white/90 backdrop-blur border-b border-gray-200') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center w-full mb-2 sm:mb-3 md:mb-4 gap-3">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
              aria-label="Tema Değiştir"
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-base sm:text-lg`}></i>
            </button>

            <div className="text-center flex-1">
              <h1 className={`text-base sm:text-lg md:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic break-words ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : 'text-white'}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`w-6 h-6 sm:w-7 sm:h-7 hidden sm:flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
                aria-label="Sepet"
              >
                <i className={`ri-shopping-bag-line text-base sm:text-lg ${hasCartItems ? 'animate-bounce' : ''}`}></i>
              </Link>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
                aria-label="Giriş"
              >
                <i className="ri-user-line text-base sm:text-lg"></i>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex flex-wrap justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Hero Images */}
      <section className="relative">
        {heroImages.map((image, index) => (
          <div
            key={image.id}
            data-image-id={image.id}
            className="relative h-[100dvh] sm:h-screen overflow-hidden"
          >
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
              <div className="absolute inset-0 bg-black/40 sm:bg-black/30"></div>
            </div>

            <div className="relative z-10 flex items-center justify-center h-full px-4 sm:px-6 md:px-8">
              <div className={`text-center text-white max-w-[90%] sm:max-w-2xl mx-auto px-0 sm:px-2 md:px-4 transition-all duration-[4000ms] delay-[1000ms] ease-out ${visibleImages.has(image.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} break-words`}>
                {image.id === 0 ? (
                  <>
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light tracking-wide mb-2 font-serif transform -skew-x-[20deg] sm:transform-none text-left italic leading-tight">
                      {image.title}
                    </h2>
                    <p className={`text-lg sm:text-xl lg:text-2xl opacity-90 mb-6 sm:mb-8 font-light tracking-wider text-left font-serif italic ${typingWords[currentWordIndex].color}`} suppressHydrationWarning={true}>
                      {displayText}
                      {typingStarted && <span className="animate-pulse">|</span>}
                    </p>
                    <p className="text-sm sm:text-base lg:text-xl opacity-90 mb-6 sm:mb-8 lg:mb-10 leading-relaxed font-light">
                      {image.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
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
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light tracking-wide mb-4 sm:mb-6 whitespace-pre-line font-serif leading-tight">
                      {image.title}
                    </h2>
                    <p className="text-sm sm:text-base lg:text-xl opacity-90 mb-6 sm:mb-8 lg:mb-10 leading-relaxed font-light">
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

      {/* Instagram Feed — Coverflow Slider */}
      {instagramPosts.length > 0 && (() => {
        const total = instagramPosts.length;
        const r2Base = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://cdn.meryembalkan.com.tr').replace(/\/$/, '');
        const r2Bucket = (process.env.NEXT_PUBLIC_R2_BUCKET_NAME || 'urunler').replace(/^\//, '');

        return (
          <section className={`relative py-12 sm:py-16 transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Dekoratif MB monogram — sadece masaüstü */}
            <span
              aria-hidden="true"
              className={`hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/4 font-serif italic leading-none select-none pointer-events-none ${isDarkMode ? 'text-white' : 'text-black'}`}
              style={{ fontSize: '26vw', opacity: 0.04 }}
            >
              MB
            </span>
            <span
              aria-hidden="true"
              className={`hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 font-serif italic leading-none select-none pointer-events-none ${isDarkMode ? 'text-white' : 'text-black'}`}
              style={{ fontSize: '26vw', opacity: 0.04 }}
            >
              MB
            </span>

            {/* Başlık */}
            <div className="text-center mb-8 sm:mb-10 px-4">
              <p className={`text-xs tracking-[0.3em] mb-2 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>SOSYAL MEDYA</p>
              <h3 className={`text-2xl sm:text-3xl font-light tracking-wide font-serif mb-3 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                BİZİ TAKIP EDİN
              </h3>
              <a
                href="https://www.instagram.com/meryembalkan_ateiler/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-sm transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
              >
                <i className="ri-instagram-line" />
                @meryembalkan_ateiler
              </a>
            </div>

            {/* Coverflow */}
            <div className="relative w-full sm:w-[80vw] sm:mx-auto h-[310px] sm:h-[430px] flex items-center justify-center">
              {/* Sol ok — sadece masaüstü */}
              <button
                onClick={() => setInstagramIndex((p) => (p - 1 + total) % total)}
                className={`hidden sm:block absolute left-3 z-50 p-2 rounded-full border transition-all ${isDarkMode ? 'bg-gray-900/80 border-white/10 text-white/70 hover:text-white hover:bg-white/10' : 'bg-white/80 border-black/10 text-gray-600 hover:text-black hover:bg-white'} backdrop-blur-md`}
              >
                <i className="ri-arrow-left-s-line text-xl" />
              </button>

              {/* Kartlar — mobilde swipe ile kaydırma */}
              <div
                className="relative w-full h-full flex items-center justify-center"
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  const delta = e.changedTouches[0].clientX - touchStartX.current;
                  if (delta < -50) setInstagramIndex((p) => (p + 1) % total);
                  else if (delta > 50) setInstagramIndex((p) => (p - 1 + total) % total);
                }}
              >
                {instagramPosts.map((post, index) => {
                  let offset = index - instagramIndex;
                  if (offset > Math.floor(total / 2)) offset -= total;
                  if (offset < -Math.floor(total / 2)) offset += total;

                  let transform = '';
                  let zIndex = 0;
                  let opacity = 0;
                  let filter = 'none';

                  const dir = offset > 0 ? 1 : -1;

                  if (offset === 0) {
                    transform = 'translateX(0) scale(1)';
                    zIndex = 50; opacity = 1;
                  } else if (Math.abs(offset) === 1) {
                    if (sliderMode === 'desktop') {
                      transform = `translateX(${dir * 22}vw) scale(0.82)`;
                      zIndex = 40; opacity = 0.65; filter = 'blur(1.5px)';
                    } else {
                      transform = `translateX(${dir * 62}%) scale(0.78)`;
                      zIndex = 40; opacity = 0.5; filter = 'blur(1px)';
                    }
                  } else if (Math.abs(offset) === 2 && sliderMode === 'desktop') {
                    transform = `translateX(${dir * 38}vw) scale(0.62)`;
                    zIndex = 30; opacity = 0.35; filter = 'blur(3px)';
                  } else {
                    transform = `translateX(${dir * (sliderMode === 'desktop' ? 58 : 110)}vw) scale(0.5)`;
                    zIndex = 10; opacity = 0;
                  }

                  const src = `${r2Base}/${r2Bucket}/${post.image_path}`;
                  const isCenter = offset === 0;
                  const isVid = /\.(mp4|webm|mov|avi|mkv)$/i.test(post.image_path);

                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        if (offset === 1) setInstagramIndex((p) => (p + 1) % total);
                        if (offset === -1) setInstagramIndex((p) => (p - 1 + total) % total);
                      }}
                      className={`absolute w-[180px] h-[260px] sm:w-[250px] sm:h-[365px] rounded-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        !isCenter ? 'cursor-pointer' : `group shadow-2xl shadow-black/40 ${isDarkMode ? 'ring-1 ring-white/10' : 'ring-1 ring-black/10'}`
                      }`}
                      style={{ transform, zIndex, opacity, filter }}
                    >
                      {isVid ? (
                        <video
                          src={src}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ) : (
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* Merkez kart — Instagram linkine yönlendir */}
                      {isCenter && (
                        <a
                          href={post.instagram_link || 'https://www.instagram.com/meryembalkan_ateiler/'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center"
                        >
                          <i className="ri-instagram-line text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sağ ok — sadece masaüstü */}
              <button
                onClick={() => setInstagramIndex((p) => (p + 1) % total)}
                className={`hidden sm:block absolute right-3 z-50 p-2 rounded-full border transition-all ${isDarkMode ? 'bg-gray-900/80 border-white/10 text-white/70 hover:text-white hover:bg-white/10' : 'bg-white/80 border-black/10 text-gray-600 hover:text-black hover:bg-white'} backdrop-blur-md`}
              >
                <i className="ri-arrow-right-s-line text-xl" />
              </button>
            </div>

            {/* Nokta göstergesi */}
            <div className="flex justify-center gap-1.5 mt-5">
              {instagramPosts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setInstagramIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === instagramIndex
                      ? `w-4 h-1.5 ${isDarkMode ? 'bg-white' : 'bg-black'}`
                      : `w-1.5 h-1.5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`
                  }`}
                />
              ))}
            </div>

            {/* Instagram'a git */}
            <div className="text-center mt-6">
              <a
                href="https://www.instagram.com/meryembalkan_ateiler/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-[11px] tracking-widest transition-colors ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-black'}`}
              >
                <i className="ri-instagram-line" /> INSTAGRAM'DA GÖR
              </a>
            </div>
          </section>
        );
      })()}

      {/* Contact CTA */}
      <section className={`py-12 sm:py-16 lg:py-20 text-white transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-black'}`}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-4 sm:mb-6 font-serif">HAYALLERINIZI GERÇEKLEŞTIRIN</h3>
          <p className="text-sm sm:text-base lg:text-xl opacity-90 mb-6 sm:mb-8 lg:mb-10">
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
      <footer className={`py-12 sm:py-16 px-4 sm:px-6 md:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer rounded-full ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`} aria-label="Instagram">
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
                <li className="break-all">meryembalkantasarimatolye@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; 2026 Meryem Balkan Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Normal Login Modal - Admin butonu kaldırıldı */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Secure Admin Login - SADECE ?mb-admin=true ile açılır */}
      {adminTriggerActive && (
        <SecureAdminLogin
          isOpen={showAdminLogin}
          onClose={() => setShowAdminLogin(false)}
        />
      )}
      
      {/* Gizli admin tetikleyici - sadece URL parametresi varsa görünür */}
      {adminTriggerActive && !showAdminLogin && (
        <button
          onClick={() => setShowAdminLogin(true)}
          className="fixed bottom-4 right-4 w-12 h-12 opacity-10 hover:opacity-100 transition-opacity z-50 flex items-center justify-center"
          aria-label="Yetkili Erişim"
        >
          <img 
            src="/images/Anasayfa/Meryem_Balkan_Logo.jpg" 
            alt="" 
            className="w-full h-full object-contain rounded-full"
          />
        </button>
      )}
    </div>
  );
}

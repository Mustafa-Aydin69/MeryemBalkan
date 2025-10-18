'use client';
import Link from 'next/link';
import LoginModal from '../components/LoginModal';
import { useState, useEffect, useRef } from 'react';
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://orplwznpdpwnyflkbuoy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycGx3em5wZHB3bnlmbGtidW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM5MzksImV4cCI6MjA3NTM0OTkzOX0.vjYN3-jHAJknRjOFv2V21MyQR8KrG6zFRmEJ6PoVW0c"
)

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState(new Set());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const imageIntervalRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const hasCompletedCycle = useRef<{ [key: number]: boolean }>({});

  // Tek bir useEffect ile veri çekme
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("urunler")
        .select("*")
        .eq("status", "Yayında")
        .order("createdDate", { ascending: false });

      if (error) {
        console.error("Ürünler alınamadı:", error.message);
        console.error("Hata detayı:", error);
        setLoading(false);
        return;
      }

      console.log("Çekilen veri:", data); // Debug için

      if (!data || data.length === 0) {
        console.log("Hiç veri bulunamadı");
        setProducts([]);
        setLoading(false);
        return;
      }

      const IMAGE_BASE_URL =
        "https://orplwznpdpwnyflkbuoy.supabase.co/storage/v1/object/public/urunler/";

      const mapped = data.map((item: any) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        collection: item.collection,
        year: item.year,
        price: `${item.price.toLocaleString('tr-TR')} ₺`,
        images: item.images && Array.isArray(item.images) ? item.images : [],
        image:
          item.images && Array.isArray(item.images) && item.images.length > 0
            ? `${IMAGE_BASE_URL}${item.images[0]}`
            : "/images/AnaSayfa/Meryem_Balkan_Logo.jpg",
      }));

      console.log("Mapped data:", mapped); // Debug için
      setProducts(mapped);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const createSlug = (id: number, title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${id}-${slug}`;
  };

  const filteredItems = activeFilter === 'all'
    ? products
    : products.filter(item => item.category === activeFilter);

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

  useEffect(() => {
    if (!isClient) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const productId = parseInt(entry.target.getAttribute('data-product-id') || '0');
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleProducts(prev => new Set([...prev, productId]));
            }, 100);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px'
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !observerRef.current) return;

    const productElements = document.querySelectorAll('[data-product-id]');
    productElements.forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => {
      const productElements = document.querySelectorAll('[data-product-id]');
      productElements.forEach(el => {
        observerRef.current?.unobserve(el);
      });
    };
  }, [filteredItems, isClient]);

  // Image slider cleanup
  useEffect(() => {
    return () => {
      Object.values(imageIntervalRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  const handleMouseEnter = (productId: number, images: string[]) => {
    if (!images || images.length <= 1) return;

    setHoveredProduct(productId);
    setCurrentImageIndex(prev => ({ ...prev, [productId]: 0 }));
    hasCompletedCycle.current[productId] = false;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        const currentIndex = prev[productId] || 0;
        const nextIndex = (currentIndex + 1) % images.length;

        // Eğer başa döndüyse (0'a geldiyse) ve daha önce döngü tamamlanmışsa
        if (nextIndex === 0 && hasCompletedCycle.current[productId]) {
          // Interval'i temizle ve ilk resimde kal
          if (imageIntervalRef.current[productId]) {
            clearInterval(imageIntervalRef.current[productId]);
            delete imageIntervalRef.current[productId];
          }
          return { ...prev, [productId]: 0 };
        }

        // İlk kez başa dönüyorsa, döngüyü tamamlandı olarak işaretle
        if (nextIndex === 0) {
          hasCompletedCycle.current[productId] = true;
        }

        return { ...prev, [productId]: nextIndex };
      });
    }, 1000);

    imageIntervalRef.current[productId] = interval;
  };

  const handleMouseLeave = (productId: number) => {
    setHoveredProduct(null);

    if (imageIntervalRef.current[productId]) {
      clearInterval(imageIntervalRef.current[productId]);
      delete imageIntervalRef.current[productId];
    }

    setCurrentImageIndex(prev => ({ ...prev, [productId]: 0 }));
    hasCompletedCycle.current[productId] = false;
  };

  const getImageUrl = (item: any, index: number) => {
    const IMAGE_BASE_URL = "https://orplwznpdpwnyflkbuoy.supabase.co/storage/v1/object/public/urunler/";
    if (!item.images || !item.images[index]) {
      return "/images/AnaSayfa/Meryem_Balkan_Logo.jpg";
    }
    return `${IMAGE_BASE_URL}${item.images[index]}`;
  };

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

  useEffect(() => {
    if (!isClient) return;

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category && ['Gelinlik', 'Nisanlik', 'Kinalik', 'After-Party'].includes(category)) {
      setActiveFilter(category);
    }
  }, [isClient]);

  const filterButtons = [
    { key: 'all', label: 'TÜM KOLEKSİYON' },
    { key: 'Abiye', label: 'ABİYE' },
    { key: 'Gelinlik', label: 'GELİNLİK' },
    { key: 'Nisanlik', label: 'NİŞANLIK' },
    { key: 'Kinalik', label: 'KINALIK' },
    { key: 'After-Party', label: 'AFTER PARTY' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      <style jsx>{`
        @keyframes fillSegment {
          from {
            background-color: rgba(156, 163, 175, 0.3);
          }
          to {
            background-color: rgb(255, 255, 255);
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900/90 backdrop-blur border-b border-gray-700' : 'bg-white/90 backdrop-blur border-b border-gray-200') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full max-w-7xl mx-auto">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
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
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
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

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Filter Menu */}
      <section className={`pb-8 sm:pb-12 px-4 sm:px-8 pt-28 sm:pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div
            className="flex sm:flex-wrap items-center justify-start sm:justify-center gap-3 sm:gap-6 overflow-x-auto scrollbar-hide whitespace-nowrap px-2 sm:px-0 pb-1"
          >
            {filterButtons.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`pb-2 cursor-pointer whitespace-nowrap transition-colors ${activeFilter === filter.key
                    ? `border-b-2 ${isDarkMode
                      ? 'border-white text-white'
                      : 'border-black text-black'
                    }`
                    : `${isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-black'
                    }`
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Portfolio Grid */}
      <section className={`pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <p className={isDarkMode ? 'text-white' : 'text-black'}>Yükleniyor...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className={isDarkMode ? 'text-white' : 'text-black'}>Henüz ürün bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredItems.map((item, index) => {
                const currentIndex = currentImageIndex[item.id] || 0;
                const hasMultipleImages = item.images && item.images.length > 1;
                const imageCount = item.images?.length || 1;

                return (
                  <Link
                    key={item.id}
                    href={`/portfolio/${createSlug(item.id, item.title)}`}
                    className={`group cursor-pointer transition-all duration-1000 ease-out ${visibleProducts.has(item.id) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                    data-product-shop
                    data-product-id={item.id}
                    onMouseEnter={() => handleMouseEnter(item.id, item.images)}
                    onMouseLeave={() => handleMouseLeave(item.id)}
                  >
                    <div className="relative overflow-hidden mb-4">
                      <div className={`absolute inset-0 bg-black transition-all duration-[3000ms] ease-out z-10 ${visibleProducts.has(item.id) ? 'opacity-0' : 'opacity-100'}`}></div>

                      {/* Image Container with Crossfade */}
                      <div className="relative w-full h-80 sm:h-96">
                        {item.images && item.images.length > 0 ? (
                          item.images.map((img: string, imgIndex: number) => (
                            <img
                              key={imgIndex}
                              src={getImageUrl(item, imgIndex)}
                              alt={`${item.title} - ${imgIndex + 1}`}
                              className={`absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-[1500ms] ease-out ${imgIndex === currentIndex
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-105'
                                } ${visibleProducts.has(item.id) ? '' : 'scale-110'}`}
                            />
                          ))
                        ) : (
                          <img
                            src="/images/AnaSayfa/Meryem_Balkan_Logo.jpg"
                            alt={item.title}
                            className={`absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-[3000ms] ease-out ${visibleProducts.has(item.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                          />
                        )}
                      </div>

                      {/* Segmented Progress Bar - Sadece birden fazla resim varsa göster */}
                      {hasMultipleImages && hoveredProduct === item.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-50 z-20 flex gap-[2px] px-2 py-[2px]">
                          {Array.from({ length: imageCount }).map((_, segmentIndex) => (
                            <div
                              key={segmentIndex}
                              className={`flex-1 transition-all duration-300 ${segmentIndex < currentIndex
                                ? 'bg-white'
                                : segmentIndex === currentIndex
                                  ? 'bg-white animate-fill'
                                  : 'bg-gray-400 bg-opacity-30'
                                }`}
                              style={{
                                animation: segmentIndex === currentIndex ? 'fillSegment 1s linear forwards' : 'none'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className={`text-base sm:text-lg font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                    <p className={`text-xs sm:text-sm mb-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.collection}</p>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.year}</p>
                      <p className={`text-base sm:text-lg font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className={`py-12 sm:py-16 lg:py-20 text-white transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-black'}`}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-4 sm:mb-6 font-serif">SİZE ÖZEL TASARIM</h3>
          <p className="text-base sm:text-lg lg:text-xl opacity-90 mb-8 sm:mb-12">
            Hayalinizdeki kıyafeti birlikte tasarlayalım
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/iletisim" className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base tracking-wide font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap rounded-full">
              İLETİŞİME GEÇ
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
                <li>meryembalkantasarimatölye@gmail.com</li>
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
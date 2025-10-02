
'use client';
import Link from 'next/link';
import LoginModal from '../components/LoginModal';
import { useState, useEffect, useRef } from 'react';

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState(new Set());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const productObserverRef = useRef<IntersectionObserver | null>(null);

  const portfolioItems = [
    // Abiye Koleksiyonu
    {
      id: 1,
      category: 'abiye',
      title: 'Siyah Gece Elbisesi',
      collection: 'Abiye Koleksiyonu',
      year: '2024',
      price: '18.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20black%20evening%20gown%20on%20fashion%20model%2C%20sophisticated%20haute%20couture%20design%2C%20luxury%20fashion%20photography%2C%20minimalist%20studio%20background%2C%20professional%20fashion%20shoot%2C%20dramatic%20lighting%2C%20modern%20elegance&width=600&height=800&seq=portfolio-1&orientation=portrait'
    },
    {
      id: 5,
      category: 'abiye',
      title: 'Zümrüt Kokteyl Elbisesi',
      collection: 'Abiye Koleksiyonu',
      year: '2023',
      price: '16.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20cocktail%20dress%20in%20emerald%20green%2C%20sophisticated%20party%20wear%2C%20modern%20evening%20fashion%2C%20luxurious%20fabric%20texture%2C%20professional%20fashion%20photography%2C%20clean%20studio%20background&width=600&height=800&seq=portfolio-5&orientation=portrait'
    },
    {
      id: 7,
      category: 'abiye',
      title: 'Bordo Kadife Elbise',
      collection: 'Abiye Koleksiyonu',
      year: '2023',
      price: '14.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20burgundy%20velvet%20dress%2C%20luxurious%20evening%20wear%2C%20sophisticated%20party%20fashion%2C%20rich%20fabric%20texture%2C%20professional%20fashion%20photography%2C%20dramatic%20lighting%2C%20clean%20background&width=600&height=800&seq=portfolio-7&orientation=portrait'
    },
    {
      id: 10,
      category: 'abiye',
      title: 'Altın Payetli Abiye',
      collection: 'Abiye Koleksiyonu',
      year: '2024',
      price: '20.000TL',
      image: 'https://readdy.ai/api/search-image?query=glamorous%20gold%20sequin%20evening%20dress%2C%20luxury%20party%20wear%2C%20sophisticated%20gala%20fashion%2C%20shimmering%20fabric%20texture%2C%20professional%20fashion%20photography%2C%20dramatic%20lighting%2C%20minimal%20background&width=600&height=800&seq=portfolio-10&orientation=portrait'
    },
    {
      id: 11,
      category: 'abiye',
      title: 'Lacivert Dantel Abiye',
      collection: 'Abiye Koleksiyonu',
      year: '2024',
      price: '17.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20navy%20lace%20evening%20dress%2C%20sophisticated%20formal%20wear%2C%20luxury%20fashion%20photography%2C%20professional%20fashion%20model%2C%20haute%20couture%20styling%2C%20minimalist%20studio%20background&width=600&height=800&seq=portfolio-11&orientation=portrait'
    },
    {
      id: 12,
      category: 'abiye',
      title: 'Pembe Saten Abiye',
      collection: 'Abiye Koleksiyonu',
      year: '2023',
      price: '19.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20pink%20satin%20evening%20gown%2C%20sophisticated%20party%20dress%2C%20luxury%20fashion%20photography%2C%20professional%20fashion%20model%2C%20glamorous%20styling%2C%20clean%20background&width=600&height=800&seq=portfolio-12&orientation=portrait'
    },

    // Gelinlik Koleksiyonu
    {
      id: 4,
      category: 'gelinlik',
      title: 'Modern Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2024',
      price: '50.000TL',
      image: 'https://readdy.ai/api/search-image?query=luxurious%20wedding%20dress%20with%20modern%20design%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20white%20gown%2C%20haute%20couture%20wedding%20attire%2C%20clean%20studio%20photography%2C%20minimal%20background&width=600&height=800&seq=portfolio-4&orientation=portrait'
    },
    {
      id: 13,
      category: 'gelinlik',
      title: 'Prenses Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2024',
      price: '45.000TL',
      image: 'https://readdy.ai/api/search-image?query=princess%20style%20wedding%20dress%20with%20voluminous%20skirt%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20white%20ball%20gown%2C%20luxury%20wedding%20attire%2C%20clean%20studio%20photography%2C%20romantic%20styling&width=600&height=800&seq=portfolio-13&orientation=portrait'
    },
    {
      id: 14,
      category: 'gelinlik',
      title: 'Vintage Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2023',
      price: '35.000TL',
      image: 'https://readdy.ai/api/search-image?query=vintage%20inspired%20wedding%20dress%20with%20lace%20details%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20retro%20style%20gown%2C%20luxury%20wedding%20attire%2C%20clean%20studio%20photography%2C%20classic%20styling&width=600&height=800&seq=portfolio-14&orientation=portrait'
    },
    {
      id: 15,
      category: 'gelinlik',
      title: 'Minimalist Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2024',
      price: '40.000TL',
      image: 'https://readdy.ai/api/search-image?query=minimalist%20wedding%20dress%20with%20clean%20lines%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20simple%20gown%2C%20luxury%20wedding%20attire%2C%20clean%20studio%20photography%2C%20modern%20styling&width=600&height=800&seq=portfolio-15&orientation=portrait'
    },
    {
      id: 16,
      category: 'gelinlik',
      title: 'Romantik Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2023',
      price: '38.000TL',
      image: 'https://readdy.ai/api/search-image?query=romantic%20wedding%20dress%20with%20flowing%20fabric%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20dreamy%20gown%2C%20luxury%20wedding%20attire%2C%20clean%20studio%20photography%2C%20soft%20styling&width=600&height=800&seq=portfolio-16&orientation=portrait'
    },
    {
      id: 17,
      category: 'gelinlik',
      title: 'Bohemian Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2024',
      price: '42.000TL',
      image: 'https://readdy.ai/api/search-image?query=bohemian%20style%20wedding%20dress%20with%20flowing%20design%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20boho%20gown%2C%20luxury%20wedding%20attire%2C%20clean%20studio%20photography%2C%20free-spirited%20styling&width=600&height=800&seq=portfolio-17&orientation=portrait'
    },

    // Nişanlık Koleksiyonu
    {
      id: 19,
      category: 'nisanlik',
      title: 'Pudra Nişan Elbisesi',
      collection: 'Nişanlık Koleksiyonu',
      year: '2024',
      price: '25.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20powder%20pink%20engagement%20dress%20with%20delicate%20lace%20details%2C%20romantic%20special%20occasion%20wear%2C%20sophisticated%20bridal%20fashion%2C%20soft%20fabric%20textures%2C%20professional%20fashion%20photography%2C%20clean%20background&width=600&height=800&seq=portfolio-19&orientation=portrait'
    },
    {
      id: 20,
      category: 'nisanlik',
      title: 'Ekru Dantel Nişanlık',
      collection: 'Nişanlık Koleksiyonu',
      year: '2024',
      price: '28.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20ecru%20lace%20engagement%20dress%20with%20intricate%20embroidery%2C%20sophisticated%20special%20occasion%20wear%2C%20romantic%20bridal%20fashion%2C%20delicate%20fabric%20details%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-20&orientation=portrait'
    },
    {
      id: 21,
      category: 'nisanlik',
      title: 'Şampanya Midi Nişanlık',
      collection: 'Nişanlık Koleksiyonu',
      year: '2024',
      price: '22.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20champagne%20midi%20engagement%20dress%20with%20modern%20cut%2C%20sophisticated%20special%20occasion%20wear%2C%20contemporary%20bridal%20fashion%2C%20luxury%20fabric%20texture%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-21&orientation=portrait'
    },
    {
      id: 22,
      category: 'nisanlik',
      title: 'Pembe Tül Nişanlık',
      collection: 'Nişanlık Koleksiyonu',
      year: '2023',
      price: '26.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20pink%20tulle%20engagement%20dress%20with%20romantic%20design%2C%20sophisticated%20special%20occasion%20wear%2C%20dreamy%20bridal%20fashion%2C%20soft%20fabric%20texture%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-22&orientation=portrait'
    },
    {
      id: 23,
      category: 'nisanlik',
      title: 'Krem İncili Nişanlık',
      collection: 'Nişanlık Koleksiyonu',
      year: '2024',
      price: '30.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20cream%20pearl%20embellished%20engagement%20dress%2C%20sophisticated%20special%20occasion%20wear%2C%20luxurious%20bridal%20fashion%2C%20pearl%20details%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-23&orientation=portrait'
    },
    {
      id: 24,
      category: 'nisanlik',
      title: 'Beyaz Sade Nişanlık',
      collection: 'Nişanlık Koleksiyonu',
      year: '2023',
      price: '24.000TL',
      image: 'https://readdy.ai/api/search-image?query=elegant%20white%20simple%20engagement%20dress%20with%20clean%20lines%2C%20sophisticated%20special%20occasion%20wear%2C%20minimalist%20bridal%20fashion%2C%20modern%20design%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-24&orientation=portrait'
    },

    // Kınalık Koleksiyonu
    {
      id: 25,
      category: 'kinalik',
      title: 'Kırmızı Kına Elbisesi',
      collection: 'Kınalık Koleksiyonu',
      year: '2024',
      price: '15.000TL',
      image: 'https://readdy.ai/api/search-image?query=traditional%20red%20henna%20night%20dress%20with%20modern%20elegant%20design%2C%20cultural%20celebration%20fashion%2C%20sophisticated%20traditional%20wear%2C%20embroidered%20details%2C%20professional%20fashion%20photography%2C%20clean%20studio%20background&width=600&height=800&seq=portfolio-25&orientation=portrait'
    },
    {
      id: 26,
      category: 'kinalik',
      title: 'Bordo İşlemeli Kınalık',
      collection: 'Kınalık Koleksiyonu',
      year: '2024',
      price: '18.000TL',
      image: 'https://readdy.ai/api/search-image?query=burgundy%20embroidered%20henna%20ceremony%20dress%20with%20gold%20details%2C%20traditional%20celebration%20fashion%2C%20sophisticated%20cultural%20wear%2C%20luxury%20embroidery%20work%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-26&orientation=portrait'
    },
    {
      id: 27,
      category: 'kinalik',
      title: 'Pembe Dantel Kınalık',
      collection: 'Kınalık Koleksiyonu',
      year: '2024',
      price: '16.500TL',
      image: 'https://readdy.ai/api/search-image?query=pink%20lace%20henna%20ceremony%20dress%20with%20traditional%20elements%2C%20elegant%20cultural%20celebration%20wear%2C%20sophisticated%20traditional%20fashion%2C%20delicate%20lace%20details%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-27&orientation=portrait'
    },
    {
      id: 28,
      category: 'kinalik',
      title: 'Yeşil Altın Detaylı Kınalık',
      collection: 'Kınalık Koleksiyonu',
      year: '2023',
      price: '17.000TL',
      image: 'https://readdy.ai/api/search-image?query=green%20henna%20dress%20with%20gold%20traditional%20details%2C%20elegant%20cultural%20ceremony%20wear%2C%20sophisticated%20celebration%20fashion%2C%20metallic%20embroidery%20accents%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-28&orientation=portrait'
    },
    {
      id: 29,
      category: 'kinalik',
      title: 'Mor Kadife Kınalık',
      collection: 'Kınalık Koleksiyonu',
      year: '2024',
      price: '19.500TL',
      image: 'https://readdy.ai/api/search-image?query=purple%20velvet%20henna%20ceremony%20dress%20with%20elegant%20cut%2C%20luxurious%20cultural%20celebration%20wear%2C%20sophisticated%20traditional%20fashion%2C%20rich%20fabric%20texture%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-29&orientation=portrait'
    },
    {
      id: 30,
      category: 'kinalik',
      title: 'Lacivert Brokar Kınalık',
      collection: 'Kınalık Koleksiyonu',
      year: '2023',
      price: '20.000TL',
      image: 'https://readdy.ai/api/search-image?query=navy%20brocade%20henna%20ceremony%20dress%20with%20traditional%20patterns%2C%20elegant%20cultural%20celebration%20wear%2C%20sophisticated%20festive%20fashion%2C%20intricate%20fabric%20design%2C%20professional%20fashion%20photography&width=600&height=800&seq=portfolio-30&orientation=portrait'
    },

    // After Party Koleksiyonu
    {
      id: 31,
      category: 'after-party',
      title: 'Altın Payetli Mini Elbise',
      collection: 'After Party Koleksiyonu',
      year: '2024',
      price: '12.000TL',
      image: 'https://readdy.ai/api/search-image?query=sparkling%20gold%20sequin%20mini%20dress%20for%20after%20party%2C%20glamorous%20celebration%20wear%2C%20sophisticated%20party%20fashion%2C%20shimmering%20fabric%20texture%2C%20professional%20fashion%20photography%2C%20dramatic%20party%20lighting&width=600&height=800&seq=portfolio-31&orientation=portrait'
    },
    {
      id: 32,
      category: 'after-party',
      title: 'Gümüş Metalik Elbise',
      collection: 'After Party Koleksiyonu',
      year: '2024',
      price: '14.000TL',
      image: 'https://readdy.ai/api/search-image?query=silver%20metallic%20party%20dress%20for%20celebrations%2C%20glamorous%20after%20party%20wear%2C%20sophisticated%20nightlife%20fashion%2C%20reflective%20fabric%20texture%2C%20professional%20fashion%20photography%2C%20modern%20party%20styling&width=600&height=800&seq=portfolio-32&orientation=portrait'
    },
    {
      id: 33,
      category: 'after-party',
      title: 'Siyah Taşlı Kokteyl Elbisesi',
      collection: 'After Party Koleksiyonu',
      year: '2024',
      price: '16.000TL',
      image: 'https://readdy.ai/api/search-image?query=black%20cocktail%20dress%20with%20crystal%20embellishments%2C%20elegant%20after%20party%20fashion%2C%20sophisticated%20celebration%20wear%2C%20luxury%20stone%20details%2C%20professional%20fashion%20photography%2C%20glamorous%20party%20atmosphere&width=600&height=800&seq=portfolio-33&orientation=portrait'
    },
    {
      id: 34,
      category: 'after-party',
      title: 'Rose Gold Midi Elbise',
      collection: 'After Party Koleksiyonu',
      year: '2023',
      price: '13.500TL',
      image: 'https://readdy.ai/api/search-image?query=rose%20gold%20midi%20party%20dress%20for%20celebrations%2C%20elegant%20after%20party%20wear%2C%20sophisticated%20celebration%20fashion%2C%20metallic%20fabric%20finish%2C%20professional%20fashion%20photography%2C%20chic%20party%20styling&width=600&height=800&seq=portfolio-34&orientation=portrait'
    },
    {
      id: 35,
      category: 'after-party',
      title: 'Mavi İncili After Party Elbise',
      collection: 'After Party Koleksiyonu',
      year: '2024',
      price: '15.500TL',
      image: 'https://readdy.ai/api/search-image?query=blue%20pearl%20embellished%20after%20party%20dress%2C%20glamorous%20celebration%20wear%2C%20sophisticated%20party%20fashion%2C%20pearl%20detail%20work%2C%20professional%20fashion%20photography%2C%20elegant%20party%20atmosphere&width=600&height=800&seq=portfolio-35&orientation=portrait'
    },
    {
      id: 36,
      category: 'after-party',
      title: 'Bronz Asimetrik Elbise',
      collection: 'After Party Koleksiyonu',
      year: '2024',
      price: '17.500TL',
      image: 'https://readdy.ai/api/search-image?query=bronze%20asymmetric%20party%20dress%20for%20celebrations%2C%20modern%20after%20party%20fashion%2C%20sophisticated%20contemporary%20wear%2C%20unique%20cut%20design%2C%20professional%20fashion%20photography%2C%20trendy%20party%20styling&width=600&height=800&seq=portfolio-36&orientation=portrait'
    }
  ];

  const filteredItems = activeFilter === 'all'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === activeFilter);

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
            }, productId * 80);
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
    if (category && ['abiye', 'gelinlik', 'nisanlik', 'kinalik', 'after-party'].includes(category)) {
      setActiveFilter(category);
    }
  }, [isClient]);

  const filterButtons = [
    { key: 'all', label: 'TÜM KOLEKSİYON' },
    { key: 'abiye', label: 'ABİYE' },
    { key: 'gelinlik', label: 'GELİNLİK' },
    { key: 'nisanlik', label: 'NİSANLIK' },
    { key: 'kinalik', label: 'KINALIK' },
    { key: 'after-party', label: 'AFTER PARTY' }
  ];

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

      {/* Filter Menu */}
      <section className={`pb-8 sm:pb-12 px-4 sm:px-8 pt-28 sm:pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center flex-wrap gap-3 sm:gap-4 lg:gap-8 text-xs sm:text-sm font-medium tracking-wide">
            {filterButtons.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`pb-2 cursor-pointer whitespace-nowrap transition-colors ${activeFilter === filter.key ? `border-b-2 ${isDarkMode ? 'border-white text-white' : 'border-black text-black'}` : `${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredItems.map((item, index) => (
              <Link
                key={item.id}
                href={`/portfolio/${item.id}`}
                className={`group cursor-pointer transition-all duration-1000 ease-out ${visibleProducts.has(index) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                data-product-shop
                data-product-id={index}
              >
                <div className="relative overflow-hidden mb-4">
                  <div className={`absolute inset-0 bg-black transition-all duration-[3000ms] ease-out z-10 ${visibleProducts.has(index) ? 'opacity-0' : 'opacity-100'}`}></div>
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full h-80 sm:h-96 object-cover object-top group-hover:scale-105 transition-all duration-[3000ms] ease-out ${visibleProducts.has(index) ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                  />
                </div>
                <h3 className={`text-base sm:text-lg font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                <p className={`text-xs sm:text-sm mb-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.collection}</p>
                <div className="flex justify-between items-center">
                  <p className={`text-xs transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.year}</p>
                  <p className={`text-base sm:text-lg font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
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

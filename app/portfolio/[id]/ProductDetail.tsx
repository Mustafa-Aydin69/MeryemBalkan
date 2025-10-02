'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { addToCart } from '../../utils/cartUtils';
interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [date, setDate] = useState(''); // 🔹 tek tarih
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSizeImage, setShowSizeImage] = useState(false);
  const [showCalendarInfo, setShowCalendarInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

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
      setCartItemCount(cartItems.length);
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

  const portfolioItems = [
    // Abiye Koleksiyonu
    {
      id: '1',
      title: 'Siyah Gece Elbisesi',
      collection: 'Abiye Koleksiyonu',
      year: '2024',
      price: 18000,
      description: 'Zarif siyah gece elbisesi. Modern kesim ve kaliteli kumaş ile özel anlarınızda size eşsiz bir görünüm kazandırır.',
      features: [
        'Premium saten kumaş',
        'Zarif kesim',
        'Ayarlanabilı bel kemeri',
        'Astarlı ve rahat kesim',
        'Profesyonel temizleme önerilir'
      ],
      sizes: ['36-42'],
      colors: ['Siyah', 'Kahverengi'],

      images: [
        'https://readdy.ai/api/search-image?query=elegant%20black%20evening%20gown%20on%20fashion%20model%2C%20sophisticated%20haute%20couture%20design%2C%20luxury%20fashion%20photography%2C%20minimalist%20studio%20background%2C%20professional%20fashion%20shoot%2C%20dramatic%20lighting%2C%20modern%20elegance&width=600&height=800&seq=product-1-main&orientation=portrait',
        'https://readdy.ai/api/search-image?query=elegant%20black%20evening%20gown%20back%20view%2C%20sophisticated%20haute%20couture%20design%2C%20luxury%20fashion%20photography%2C%20minimalist%20studio%20background%2C%20professional%20fashion%20shoot%2C%20dramatic%20lighting&width=600&height=800&seq=product-1-back&orientation=portrait',
        'https://readdy.ai/api/search-image?query=elegant%20black%20evening%20gown%20detail%20shot%2C%20sophisticated%20haute%20couture%20design%2C%20luxury%20fashion%20photography%2C%20minimalist%20studio%20background%2C%20close%20up%20details&width=600&height=800&seq=product-1-detail&orientation=portrait',
        'https://readdy.ai/api/search-image?query=elegant%20black%20evening%20gown%20full%20length%20view%2C%20sophisticated%20haute%20couture%20design%2C%20luxury%20fashion%20photography%2C%20minimalist%20studio%20background%2C%20professional%20fashion%20shoot&width=600&height=800&seq=product-1-full&orientation=portrait'
      ]
    },
    {
      id: '2',
      title: 'Lacivert İş Takımı',
      collection: 'İş Kıyafetleri',
      year: '2024',
      price: 12000,
      description: 'Modern iş hayatının dinamik kadınları için tasarlanmış şık takım. Profesyonel görünüm ve konfor bir arada.',
      features: [
        'Premium yün karışımı kumaş',
        'Slim fit kesim',
        'İç cep detayları',
        'Ütüsüz teknoloji',
        '4 mevsim kullanım'
      ],
      sizes: ['36', '38', '40', '42', '44'],
      colors: ['Lacivert', 'Antrasit', 'Siyah'],
      images: [
        'https://readdy.ai/api/search-image?query=professional%20navy%20blue%20business%20suit%20for%20women%2C%20elegant%20corporate%20fashion%2C%20modern%20workwear%20design%2C%20clean%20studio%20photography%2C%20sophisticated%20professional%20attire%2C%20minimalist%20background&width=600&height=800&seq=product-2-main&orientation=portrait',
        'https://readdy.ai/api/search-image?query=professional%20navy%20blue%20business%20suit%20back%20view%2C%20elegant%20corporate%20fashion%2C%20modern%20workwear%20design%2C%20clean%20studio%20photography%2C%20sophisticated%20professional%20attire&width=600&height=800&seq=product-2-back&orientation=portrait',
        'https://readdy.ai/api/search-image?query=professional%20navy%20blue%20business%20suit%20detail%20shot%2C%20elegant%20corporate%20fashion%2C%20modern%20workwear%20design%2C%20clean%20studio%20photography%2C%20close%20up%20fabric%20details&width=600&height=800&seq=product-2-detail&orientation=portrait',
        'https://readdy.ai/api/search-image?query=professional%20navy%20blue%20business%20suit%20full%20body%2C%20elegant%20corporate%20fashion%2C%20modern%20workwear%20design%2C%20clean%20studio%20photography%2C%20sophisticated%20professional%20attire&width=600&height=800&seq=product-2-full&orientation=portrait'
      ]
    },
    {
      id: '4',
      title: 'Modern Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      year: '2024',
      price: 50000,
      description: 'Modern gelinlik tasarımı. Zarif detaylar ve mükemmel kesim ile hayalinizdeki düğün günü için özel olarak tasarlandı.',
      features: [
        'İthal dantel detayları',
        'El işçiliği inciler',
        'Ayarlanabilir korse',
        'Saten astar',
        'Özel saklama çantası dahil'
      ],
      sizes: ['36', '38', '40', '42'],
      colors: ['Beyaz', 'Ekru', 'Şampanya'],
      images: [
        'https://readdy.ai/api/search-image?query=luxurious%20wedding%20dress%20with%20modern%20design%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20white%20gown%2C%20haute%20couture%20wedding%20attire%2C%20clean%20studio%20photography%2C%20minimal%20background&width=600&height=800&seq=product-4-main&orientation=portrait',
        'https://readdy.ai/api/search-image?query=luxurious%20wedding%20dress%20back%20view%20with%20modern%20design%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20white%20gown%2C%20haute%20couture%20wedding%20attire&width=600&height=800&seq=product-4-back&orientation=portrait',
        'https://readdy.ai/api/search-image?query=luxurious%20wedding%20dress%20detail%20shot%20modern%20design%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20white%20gown%2C%20close%20up%20lace%20details&width=600&height=800&seq=product-4-detail&orientation=portrait',
        'https://readdy.ai/api/search-image?query=luxurious%20wedding%20dress%20full%20length%20modern%20design%2C%20elegant%20bridal%20fashion%2C%20sophisticated%20white%20gown%2C%20haute%20couture%20wedding%20attire&width=600&height=800&seq=product-4-full&orientation=portrait'
      ]
    },
    {
      id: '15',
      title: 'Sparkle Mini Elbise',
      collection: 'After Party Koleksiyonu',
      year: '2024',
      price: 12000,
      description: 'Işıltılı after party elbisesi. Gecenin yıldızı olmak için tasarlanmış, modern ve çarpıcı bir tasarım.',
      features: [
        'Yüksek kaliteli payetler',
        'Streç kumaş',
        'Mini boy kesim',
        'Rahat hareket imkanı',
        'Özel saklama çantası'
      ],
      sizes: ['36', '38', '40', '42'],
      colors: ['Altın', 'Gümüş', 'Rose Gold'],
      images: [
        'https://readdy.ai/api/search-image?query=sparkling%20mini%20dress%20with%20sequins%2C%20glamorous%20party%20wear%2C%20sophisticated%20after%20party%20fashion%2C%20shimmering%20fabric%20texture%2C%20professional%20fashion%20photography%2C%20dramatic%20lighting&width=600&height=800&seq=product-15-main&orientation=portrait',
        'https://readdy.ai/api/search-image?query=sparkling%20mini%20dress%20back%20view%20with%20sequins%2C%20glamorous%20party%20wear%2C%20sophisticated%20after%20party%20fashion%2C%20shimmering%20fabric%20texture&width=600&height=800&seq=product-15-back&orientation=portrait',
        'https://readdy.ai/api/search-image?query=sparkling%20mini%20dress%20detail%20shot%20sequins%2C%20glamorous%20party%20wear%2C%20sophisticated%20after%20party%20fashion%2C%20close%20up%20sequin%20details&width=600&height=800&seq=product-15-detail&orientation=portrait',
        'https://readdy.ai/api/search-image?query=sparkling%20mini%20dress%20full%20length%20sequins%2C%20glamorous%20party%20wear%2C%20sophisticated%20after%20party%20fashion%2C%20shimmering%20fabric%20texture&width=600&height=800&seq=product-15-full&orientation=portrait'
      ]
    },
    {
      id: '19',
      title: 'Pudra Nişan Elbisesi',
      collection: 'Nişanlık Koleksiyonu',
      year: '2024',
      price: 25000,
      description: 'Romantik pudra rengi nişan elbisesi. Zarif dantel detayları ve modern kesim ile nişan gününüzde unutulmaz anlar yaşatacak.',
      features: [
        'İthal fransız dantel',
        'Pudra pembe renk',
        'A-line kesim',
        'El işi boncuk detayları',
        'İpek astar'
      ],
      sizes: ['36', '38', '40', '42'],
      colors: ['Pudra', 'Ekru', 'Şampanya'],
      images: [
        'https://readdy.ai/api/search-image?query=elegant%20powder%20pink%20engagement%20dress%20with%20delicate%20lace%20details%2C%20romantic%20special%20occasion%20wear%2C%20sophisticated%20bridal%20fashion%2C%20soft%20fabric%20textures%2C%20professional%20fashion%20photography%2C%20clean%20background&width=600&height=800&seq=product-19-main&orientation=portrait',
        'https://readdy.ai/api/search-image?query=elegant%20powder%20pink%20engagement%20dress%20back%20view%2C%20romantic%20special%20occasion%20wear%2C%20sophisticated%20bridal%20fashion%2C%20soft%20fabric%20textures&width=600&height=800&seq=product-19-back&orientation=portrait',
        'https://readdy.ai/api/search-image?query=elegant%20powder%20pink%20engagement%20dress%20detail%20shot%2C%20romantic%20special%20occasion%20wear%2C%20close%20up%20lace%20details&width=600&height=800&seq=product-19-detail&orientation=portrait',
        'https://readdy.ai/api/search-image?query=elegant%20powder%20pink%20engagement%20dress%20full%20length%2C%20romantic%20special%20occasion%20wear%2C%20sophisticated%20bridal%20fashion&width=600&height=800&seq=product-19-full&orientation=portrait'
      ]
    },
    {
      id: '22',
      title: 'Kırmızı Kına Elbisesi',
      collection: 'Kınalık Koleksiyonu',
      year: '2024',
      price: 15000,
      description: 'Geleneksel kına geceniz için özel tasarlanmış kırmızı elbise. Modern çizgiler ve geleneksel renk uyumu ile unutulmaz anlar.',
      features: [
        'Kırmızı saten kumaş',
        'Altın işleme detayları',
        'Kına gecelerine özel tasarım',
        'Rahat hareket imkanı',
        'Özel saklama çantası dahil'
      ],
      sizes: ['36', '38', '40', '42'],
      colors: ['Kırmızı', 'Bordo', 'Pembe'],
      images: [
        'https://readdy.ai/api/search-image?query=traditional%20red%20henna%20night%20dress%20with%20modern%20elegant%20design%2C%20cultural%20celebration%20fashion%2C%20sophisticated%20traditional%20wear%2C%20embroidered%20details%2C%20professional%20fashion%20photography&width=600&height=800&seq=product-22-main&orientation=portrait',
        'https://readdy.ai/api/search-image?query=traditional%20red%20henna%20night%20dress%20back%20view%2C%20cultural%20celebration%20fashion%2C%20sophisticated%20traditional%20wear&width=600&height=800&seq=product-22-back&orientation=portrait',
        'https://readdy.ai/api/search-image?query=traditional%20red%20henna%20night%20dress%20detail%20shot%2C%20cultural%20celebration%20fashion%2C%20close%20up%20embroidery%20details&width=600&height=800&seq=product-22-detail&orientation=portrait',
        'https://readdy.ai/api/search-image?query=traditional%20red%20henna%20night%20dress%20full%20length%2C%20cultural%20celebration%20fashion%2C%20sophisticated%20traditional%20wear&width=600&height=800&seq=product-22-full&orientation=portrait'
      ]
    }
  ];

  const defaultProduct = {
    id: productId,
    title: 'Özel Tasarım Elbise',
    collection: 'Özel Koleksiyon',
    year: '2024',
    price: 15000,
    description: 'Size özel tasarlanmış zarif elbise. Modern kesim ve kaliteli kumaş ile özel anlarınızda size eşsiz bir görünüm kazandırır.',
    features: [
      'Özel tasarım',
      'Kaliteli kumaş',
      'Profesyonel işçilik',
      'Mükemmel kesim',
      'Bakım kolaylığı'
    ],
    sizes: ['36', '38', '40', '42'],
    colors: ['Siyah', 'Lacivert', 'Bordo'],
    images: [
      'https://readdy.ai/api/search-image?query=elegant%20evening%20dress%20with%20sophisticated%20design%2C%20luxury%20fashion%20photography%2C%20professional%20fashion%20model%2C%20haute%20couture%20styling%2C%20minimalist%20studio%20background&width=600&height=800&seq=product-default-1&orientation=portrait',
      'https://readdy.ai/api/search-image?query=elegant%20evening%20dress%20back%20view%2C%20luxury%20fashion%20photography%2C%20professional%20fashion%20model%2C%20haute%20couture%20styling%2C%20minimalist%20studio%20background&width=600&height=800&seq=product-default-2&orientation=portrait',
      'https://readdy.ai/api/search-image?query=elegant%20evening%20dress%20detail%20shot%2C%20luxury%20fashion%20photography%2C%20close%20up%20fabric%20details%2C%20haute%20couture%20styling&width=600&height=800&seq=product-default-3&orientation=portrait',
      'https://readdy.ai/api/search-image?query=elegant%20evening%20dress%20full%20length%2C%20luxury%20fashion%20photography%2C%20professional%20fashion%20model%2C%20haute%20couture%20styling&width=600&height=800&seq=product-default-4&orientation=portrait'
    ]
  };

  const product = portfolioItems.find(item => item.id === productId) || defaultProduct;

  const handleAddToCart = () => {
    // Form validation
    if (!selectedSize || !selectedColor || !date) {
      setNotification({
        message: 'Lütfen tüm alanları doldurun.',
        type: 'warning'
      });
      return;
    }

    // Tarih validation
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      setNotification({
        message: 'Başlangıç tarihi bugünden önce olamaz.',
        type: 'error'
      });
      return;
    }


    // Sepete ekleme işlemi
    const result = addToCart(
      product.id,
      product.title,
      product.price,
      selectedColor,
      selectedSize,
      date,
      product.images[0]
    );

    // Sonucu göster
    setNotification({
      message: result.message,
      type: result.type
    });

    // Başarılı ise formu temizle
    if (result.success) {
      setTimeout(() => {
        setSelectedColor('');
        setSelectedSize('');
        setDate(''),
          setNotification(null);
      }, 3000);
    }

    // Notification'ı 5 saniye sonra gizle
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const relatedProducts = portfolioItems.filter(item => item.id !== productId).slice(0, 4);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-lg' : 'bg-white shadow-lg') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-8 py-6">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-4">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-lg`}></i>
            </button>

            <div className="text-center">
              <h1 className={`text-xl font-light tracking-[0.3em] font-serif italic transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : 'text-white'}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/sepet"
                className={`relative w-6 h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
              >
                <i className={`ri-shopping-bag-line text-lg ${cartItemCount > 0 ? 'animate-bounce' : ''}`}></i>
              </Link>
              <div className={`relative w-6 h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>
                <i className="ri-user-line text-lg"></i>
              </div>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="flex space-x-8 text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors duration-300 font-light ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors duration-300 font-light ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors duration-300 font-light ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors duration-300 font-light ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-30 p-4 rounded-lg border max-w-md w-full mx-4 ${notification.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
          <div className="flex items-center space-x-3">
            <i className={`${notification.type === 'success'
              ? 'ri-check-circle-line'
              : notification.type === 'error'
                ? 'ri-error-warning-line'
                : 'ri-information-line'
              } text-lg`}></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <section className={`px-8 py-4 border-b pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`flex items-center text-sm transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Link href="/" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Anasayfa</Link>
            <i className="ri-arrow-right-s-line mx-2"></i>
            <Link href="/portfolio" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Elbiseler</Link>
            <i className="ri-arrow-right-s-line mx-2"></i>
            <span className={`transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.title}</span>
          </div>
        </div>
      </section>

      {/* Product Detail */}
      <section className={`py-8 px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Images */}
            <div className="flex gap-4">
              {/* Thumbnail Images */}
              <div className="flex flex-col gap-4 w-24">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-24 border-2 ${currentImageIndex === index ? (isDarkMode ? 'border-white' : 'border-black') : (isDarkMode ? 'border-gray-600' : 'border-gray-200')} hover:border-gray-400 cursor-pointer`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-96 lg:h-[600px] object-cover object-top"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className={`text-3xl font-light tracking-wide mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.title}</h1>
                <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.collection}</p>
                <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{product.price.toLocaleString('tr-TR')}TL</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vergi dahil. Kargo ücreti ödeme sırasında hesaplanır.</p>
              </div>

              {/* Color Selection */}
              <div>
                <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Renk — {selectedColor || 'Seçiniz'}</h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-medium ${selectedColor === color
                        ? (isDarkMode ? 'border-white bg-gray-700 text-white' : 'border-black bg-gray-100')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-400' : 'border-gray-300 hover:border-gray-400')
                        } cursor-pointer`}
                    >
                      {color.substring(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Beden</h3>
                <div className="grid grid-cols-4 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 text-center border ${selectedSize === size
                        ? (isDarkMode ? 'border-white bg-white text-black' : 'border-black bg-black text-white')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-400 text-white' : 'border-gray-300 hover:border-gray-400')
                        } cursor-pointer whitespace-nowrap rounded-full`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Tarih
                </h3>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // bugünden önce seçilemez
                  className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none
                    ${isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-white'
                      : 'bg-white border-gray-300 text-black focus:border-black'
                    }`}
                />
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor || !date}
                className={`w-full py-4 text-center font-medium tracking-wide transition-colors whitespace-nowrap rounded-full ${selectedSize && selectedColor && date
                  ? (isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800') + ' cursor-pointer'
                  : (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500') + ' cursor-not-allowed'
                  }`}
              >
                Sepete ekle
              </button>

              {/* Description */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  <span className="font-medium">Açıklama</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <div className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>{product.description}</p>
                  <ul className="mt-4 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Beden Ölçme */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowSizeImage(!showSizeImage)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="font-medium">Bedenimi Nasıl Ölçerim?</span>
                  <i className={`ri-arrow-${showSizeImage ? 'up' : 'down'}-s-line`}></i>
                </button>

                {showSizeImage && (
                  <div className="mt-4">
                    <img
                      src="/images/AnaSayfa/Beden.jpg"
                      alt="Beden Ölçme Tablosu"
                      className="rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Takvim Bilgisi */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowCalendarInfo(!showCalendarInfo)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="font-medium">Takvimde Hangi Tarihi Seçmeliyim?</span>
                  <i className={`ri-arrow-${showCalendarInfo ? 'up' : 'down'}-s-line`}></i>
                </button>

                {showCalendarInfo && (
                  <div className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>
                      Takvimde tarih seçerken elbiseyi giyeceğiniz günü seçmeniz gerekir.
                      <br />
                      Elbiseniz seçtiğiniz kiralama tarihinden <strong>2 gün önce</strong> elinize ulaşacak şekilde kargoya verilmektedir.
                    </p>
                  </div>
                )}
              </div>

              {/* Teslimat ve İade */}
              <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
                  className={`flex justify-between items-center w-full text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <span className="font-medium">Teslimat ve iade bilgileri</span>
                  <i className={`ri-arrow-${showDeliveryInfo ? 'up' : 'down'}-s-line`}></i>
                </button>

                {showDeliveryInfo && (
                  <div className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>
                      <strong>Teslimat:</strong> Takvimde tarih seçerken giyeceğiniz günü seçmeniz gerekir.
                      Siparişleriniz seçtiğiniz kiralama tarihinden <strong>2 gün önce</strong> elinize ulaşacak şekilde kargoya verilmektedir.
                      <br />
                      Elbiseniz kargoya verildiğinde kargo takip numarası tarafınıza iletilecektir.
                      <br /><br />
                      <strong>İade:</strong> Kiraladığınız elbiseyi giyindikten sonraki ilk iş günü içinde geri teslim etmeniz gerekir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className={`py-16 px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h4 className="text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-6 leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
                  <i className="ri-instagram-line text-lg"></i>
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">KURUMSAL</h5>
              <ul className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li><Link href="/hakkimda" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Hakkımızda</Link></li>
                <li><Link href="/iletisim" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Randevu Al</Link></li>
                <li><Link href="/gizlilik-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>KVKK</Link></li>
                <li><Link href="/aydinlatma-metni" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Aydınlatma Metni</Link></li>
                <li><Link href="/kiralama-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Kiralama Sözleşmesi ve Yükümlülükleri</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide">İLETİŞİM</h5>
              <ul className={`space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarımatölyesi@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-12 pt-8 text-center text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; 2025 Meryem Balkan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Dark mode kontrolü
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        // Kullanıcı girişi kontrolü
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            router.push('/');
            return;
        }

        // Siparişleri yükle
        loadOrders(userEmail);
    }, [router]);

    const loadOrders = (email: string) => {
        // localStorage'dan siparişleri yükle
        const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
        const userOrders = allOrders.filter((order: any) => order.userEmail === email);
        setOrders(userOrders);
        setIsLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        router.push('/');
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(price);
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm'}`}>
                <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
                    <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
                        <button
                            onClick={toggleTheme}
                            className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}
                        >
                            <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i>
                        </button>

                        <div className="text-center">
                            <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif transition-colors italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                MERYEM BALKAN
                            </h1>
                        </div>

                        <button
                            onClick={handleLogout}
                            className={`px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}
                        >
                            Çıkış
                        </button>
                    </div>

                    <div className="flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
                        <Link href="/" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>
                            ANASAYFA
                        </Link>
                        <Link href="/portfolio" className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>
                            ELBİSELER
                        </Link>
                        <Link href="/siparisler" className={`cursor-pointer transition-colors font-light whitespace-nowrap border-b-2 ${isDarkMode ? 'text-white border-white' : 'text-black border-black'}`}>
                            SİPARİŞLERİM
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-16 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className={`text-3xl sm:text-4xl font-light tracking-wide mb-8 font-serif ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Siparişlerim
                    </h1>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className={`inline-block w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className={`text-center py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                            <i className={`ri-shopping-bag-line text-6xl mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
                            <h2 className={`text-2xl font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Henüz sipariş yok
                            </h2>
                            <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Sipariş vermek için mağazaya gidin.
                            </p>
                            <Link
                                href="/portfolio"
                                className={`inline-block px-8 py-4 rounded-full transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                                Mağazaya Git
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order: any, index: number) => (
                                <div
                                    key={index}
                                    className={`p-6 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                Sipariş #{order.orderNumber}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {formatDate(order.date)}
                                            </p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-sm ${order.status === 'completed'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : order.status === 'processing'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            }`}>
                                            {order.status === 'completed' ? 'Tamamlandı' : order.status === 'processing' ? 'İşleniyor' : 'Beklemede'}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {order.items.map((item: any, itemIndex: number) => (
                                            <div key={itemIndex} className="flex items-center space-x-4">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-20 h-20 object-cover rounded"
                                                />
                                                <div className="flex-1">
                                                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        {item.name}
                                                    </h4>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {item.rentalDays} Gün Kiralama
                                                    </p>
                                                </div>
                                                <div className={`text-right ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                    <p className="font-medium">{formatPrice(item.price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`mt-4 pt-4 border-t flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            Toplam:
                                        </span>
                                        <span className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {formatPrice(order.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
        </div>
    );
}
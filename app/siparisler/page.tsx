'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginModal from '../components/LoginModal';

export default function OrdersPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const router = useRouter();

    const checkAuthAndLoad = () => {
        const verificationCode = localStorage.getItem('verificationCodeVerified');
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail || verificationCode !== 'true') {
            setIsLoggedIn(false);
            setIsLoading(false);
            setIsLoginModalOpen(true);
            return;
        }
        setIsLoggedIn(true);
        loadOrders(userEmail);
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
        checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 🔹 API route üzerinden mail adresine göre sipariş çekme
    const loadOrders = async (email: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/my-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                console.error('Siparişler alınamadı:', result.error);
                setOrders([]);
            } else {
                setOrders(result.data || []);
            }
        } catch (error) {
            console.error('Siparişler alınamadı:', error);
            setOrders([]);
        }
        setIsLoading(false);
    };

    const handleLoginModalClose = () => {
        setIsLoginModalOpen(false);
        // Login başarılıysa siparişleri yükle
        const verificationCode = localStorage.getItem('verificationCodeVerified');
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail && verificationCode === 'true') {
            setIsLoggedIn(true);
            setIsLoading(true);
            loadOrders(userEmail);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('verificationCodeVerified');
        setIsLoggedIn(false);
        setOrders([]);
        setIsLoginModalOpen(true);
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

    const formatPrice = (price: string | number) => {
        // DB'de text olarak saklanıyor, sayıya çevir
        let numericPrice: number;
        if (typeof price === 'string') {
            // "13.000" veya "13000" formatını handle et
            numericPrice = parseFloat(price.replace(/\./g, '').replace(',', '.')) || 0;
        } else {
            numericPrice = price;
        }
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(numericPrice);
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>

            {/* Giriş yapılmamış ekranı */}
            {!isLoggedIn && !isLoginModalOpen && (
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="text-center">
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <i className={`ri-user-line text-4xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                        </div>
                        <h2 className={`text-2xl font-light mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Siparişlerinizi görmek için giriş yapın</h2>
                        <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>E-posta adresinizle doğrulama kodu alarak giriş yapabilirsiniz.</p>
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className={`px-8 py-3 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                        >
                            Giriş Yap
                        </button>
                    </div>
                </div>
            )}

            {/* Giriş yapılmış - Ana içerik */}
            {isLoggedIn && (<>
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
                            <h2 className={`text-2xl font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Henüz sipariş yok</h2>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
                                Sipariş vermek için mağazaya gidin.
                            </p>
                            <Link href="/portfolio" className={`inline-block px-8 py-4 rounded-full ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>Mağazaya Git</Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order, index) => (
                                <div
                                    key={index}
                                    className={`rounded-2xl shadow-md p-5 sm:p-6 transition-all duration-300 hover:shadow-lg ${isDarkMode
                                        ? 'bg-gray-800 border border-gray-700'
                                        : 'bg-white border border-gray-200'
                                        }`}
                                >
                                    {/* Üst kısım: ürün adı ve durum etiketi */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className={`text-base sm:text-xl font-medium mb-1 break-words ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}
                                            >
                                                {order.productName}
                                            </h3>
                                            <p
                                                className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}
                                            >
                                                {formatDate(order.orderDate)}
                                            </p>
                                        </div>

                                        <span
                                            className={`self-start px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 ${order.status === 'Hazırlanıyor'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : order.status === 'Kargoya Verildi' || order.status === 'Kirada'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : order.status === 'Teslim Edildi' || order.status === 'Sipariş Tamamlandı'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : order.status === 'İptal Edildi'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* İçerik kısmı - Mobil için optimize */}
                                    <div
                                        className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                    >
                                        {/* Beden ve Renk - Yan yana */}
                                        <div className="flex gap-4 sm:contents">
                                            <p className="flex-1">
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Beden</strong>
                                                <span>{order.size}</span>
                                            </p>
                                            <p className="flex-1">
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Renk</strong>
                                                <span>{order.color}</span>
                                            </p>
                                        </div>
                                        
                                        {/* Etkinlik ve Fiyat - Yan yana */}
                                        <div className="flex gap-4 sm:contents">
                                            <p className="flex-1">
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Etkinlik Tarihi</strong>
                                                <span>{formatDate(order.eventDate)}</span>
                                            </p>
                                            <p className="flex-1">
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Fiyat</strong>
                                                <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>{formatPrice(order.price)}</span>
                                            </p>
                                        </div>
                                        
                                        {/* Adres - Tam genişlik */}
                                        <p className="sm:col-span-2">
                                            <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Adres</strong>
                                            <span className="break-words">{order.address}</span>
                                        </p>
                                        
                                        {/* Telefon ve Kargo - Yan yana */}
                                        <div className="flex flex-col sm:contents gap-3">
                                            <p>
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Telefon</strong>
                                                <span>{order.phone}</span>
                                            </p>
                                            <p className="sm:col-span-1">
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Kargo Durumu</strong>
                                                <span className={order.shippingCode 
                                                    ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') 
                                                    : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                }>
                                                    {order.shippingCode ? `Yurtiçi Kargo → ${order.shippingCode}` : 'Henüz kargoya verilmedi'}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Ödeme Şekli - Eğer varsa */}
                                        {order.paymentMethod && (
                                            <p className="sm:col-span-2">
                                                <strong className="text-xs uppercase tracking-wide block mb-0.5 opacity-70">Ödeme Şekli</strong>
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${
                                                    order.paymentMethod === 'Mağazadan' 
                                                        ? (isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700')
                                                        : (isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700')
                                                }`}>
                                                    <i className={order.paymentMethod === 'Mağazadan' ? 'ri-store-2-line' : 'ri-bank-card-line'}></i>
                                                    {order.paymentMethod}
                                                </span>
                                            </p>
                                        )}
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
                        <p>&copy; Meryem Balkan.</p>
                    </div>
                </div>
            </footer>
            </>)}

            <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} isDarkMode={isDarkMode} />
        </div>
    );
}
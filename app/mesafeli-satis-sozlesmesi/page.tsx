'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

export default function MesafeliSatisSozlesmesi() {
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const handleScroll = () => setScrollY(window.scrollY);
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

  const showNavBackground = isClient && scrollY > 50;
  const nc = `w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`;
  const body = `text-sm leading-7 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
  const sh = `text-xs font-semibold tracking-widest mb-4 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const clause = `text-sm leading-7 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} suppressHydrationWarning>
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-200 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-sm' : 'bg-white shadow-sm') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button onClick={toggleTheme} className={nc}><i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i></button>
            <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>MERYEM BALKAN</h1>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="hidden sm:contents"><Link href="/sepet" className={nc}><i className="ri-shopping-bag-line text-sm sm:text-lg"></i></Link></span>
              <button onClick={() => setShowLoginModal(true)} className={nc}><i className="ri-user-line text-sm sm:text-lg"></i></button>
            </div>
          </div>
          <div className="hidden sm:flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            {[['/', 'ANASAYFA'], ['/portfolio', 'ELBİSELER'], ['/hakkimda', 'HAKKIMDA'], ['/iletisim', 'İLETİŞİM']].map(([href, label]) => (
              <Link key={href} href={href} className={`cursor-pointer transition-colors font-light whitespace-nowrap ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>{label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <div className={`pt-28 sm:pt-32 pb-20 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`pb-8 mb-10 border-b transition-colors ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className={`text-xs tracking-[0.35em] mb-3 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>MERYEM BALKAN</p>
            <h1 className={`text-2xl sm:text-3xl font-light tracking-wide mb-3 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>MESAFELİ SATIŞ SÖZLEŞMESİ</h1>
            <p className={`text-xs transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Genel Kiralama Şartları — Meryem Balkan Tasarım Atölyesi</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className={sh}>1- TARAFLAR VE KONU</h2>
              <p className={body}>İşbu Genel Kiralama Şartları ile, merkezi &quot;Atatürk Mahallesi, Muhsin Yazıcıoğlu Caddesi No:15/B Merkez ERZİNCAN&quot; adresinde bulunan Meryem Balkan Tasarım Atölyesi tarafından sağlanan kiralama hizmeti ile ilgili tabi olunan şart ve hükümler düzenlenmiştir.</p>
              <p className={`${body} mt-3`}>Kiralanan eşya &quot;ÜRÜN&quot;, Ürünü Kiraya Veren Meryem Balkan Tasarım Atölyesi &quot;KİRAYA VEREN&quot; ve ürünü kullanmak üzere kiralayan &quot;KİRACI&quot; olarak anılacaktır.</p>
            </section>

            <section>
              <h2 className={sh}>2- SÖZLEŞME BEDELİ VE SÜRESİ</h2>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>2.1.</span> Sözleşme toplam bedeli, ürünün kiralama bedeli ve varsa kargo bedelinin toplamıdır. Bahse konu tutarın %75&apos;i kiralama bedeli, %25&apos;i randevu ve elbise tarihinin ayırtılması hizmetlerini kapsayan kapora bedelidir. KİRACI sözleşme bedelini en geç teslim tarihine dek ödemekle yükümlüdür. Ödemenin tamamı yapılmadığı takdirde KİRAYA VEREN ürünü teslim etmeyebilir. KİRACI ürünü herhangi bir sebeple kullanamasa dahi kapora bedelini ödemekten kaçınamaz.</p>
              <p className={body}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>2.2.</span> Kiralama süresi teslim tarihinden itibaren 4 gündür. Açık izin olmadığı sürece 4. gün mesai bitimine kadar iade zorunludur.</p>
            </section>

            <section>
              <h2 className={sh}>3- KİRAYA VERENİN YÜKÜMLÜLÜKLERİ</h2>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>3.1.</span> ÜRÜN temiz ve hasarsız teslim edilir. Teslim anında bildirilmeyen hasarlardan KİRAYA VEREN sorumlu değildir.</p>
              <p className={body}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>3.2.</span> İade sırasında kontrol yapılır ve forma yazılır.</p>
            </section>

            <section>
              <h2 className={sh}>4- KİRACININ YÜKÜMLÜLÜKLERİ</h2>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>4.1.</span> Teslimde kontrol yapıp hasar bildirmek zorundadır.</p>
              <p className={body}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>4.2.</span> Kullanım süresince oluşan tüm zararlardan sorumludur.</p>
            </section>

            <section>
              <h2 className={sh}>5- ÜRÜNÜN TESLİMİ VE İADESİ</h2>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.1.</span> Tarihler değiştirilemez (yazılı onay hariç).</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.2.</span> Ödeme şekli teslimde değiştirilemez. Nakit sözleşmenin kartla teslim alınması halinde %5 cezai bedel uygulanır.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.3.</span> Teslim formu imzalanmadan ürün verilmez.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.4.</span> İade formu imzalanmazsa ürün teslim edilmemiş sayılır.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.5.</span> Yazılı onay ile kargo yapılabilir; taşıma riskleri KİRACI&apos;ya aittir.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.6.</span> Kargo ile iadede tarih, kargoya veriliş günüdür.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.7.</span> Farklı ürün iade edilirse satış bedelinin tamamı alınır.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.8.</span> Teslim formunda olmayan fakat iade sırasında görülen hasarlar için tamir bedeli (en fazla satış bedeline kadar) KİRACI tarafından ödenir.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.9.</span> Geç iade halinde satış bedelinin %20&apos;si günlük cezai şart uygulanır.</p>
              <p className={body}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.10.</span> 5 günden fazla gecikmede suç duyurusu ve tazminat hakkı doğar.</p>
            </section>

            <section>
              <h2 className={sh}>6- SÖZLEŞMENİN FESHİ</h2>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>6.1.</span> KİRAYA VEREN feshedebilir, kiracı hak talep edemez.</p>
              <p className={body}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>6.2.</span> KİRACI feshederse madde 7 ve 8 geçerlidir.</p>
            </section>

            <section>
              <h2 className={sh}>7- KAPORA</h2>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>7.1.</span> Toplam bedelin %25&apos;idir.</p>
              <p className={clause}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>7.2.</span> Kiracı feshederse iade edilmez.</p>
              <p className={body}><span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>7.3.</span> Kiraya veren haksız feshederse iade edilir.</p>
            </section>

            <section>
              <h2 className={sh}>8- CEZAİ ŞART</h2>
              <p className={body}>Teslime 3 günden az kala fesihte toplam bedelin %50&apos;si alınır ve indirim talep edilemez. Ek masraflar ayrıca istenebilir.</p>
            </section>

            <section>
              <h2 className={sh}>9- DEVİR YASAĞI</h2>
              <p className={body}>Yazılı izin olmadan devredilemez.</p>
            </section>

            <section>
              <h2 className={sh}>10- YETKİLİ MAHKEME</h2>
              <p className={body}>İşbu sözleşmeden kaynaklanacak uyuşmazlıklarda Erzincan Mahkeme ve İcra Daireleri yetkilidir. İşbu sözleşme taraflarca okunmuş, anlaşılmış ve imza altına alınmıştır.</p>
            </section>
          </div>
        </div>
      </div>

      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları</p>
              <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}><i className="ri-instagram-line text-lg"></i></a>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm">KURUMSAL</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {[['Hakkımızda', '/hakkimda'], ['İletişime Geç', '/iletisim'], ['Gizlilik Politikası', '/gizlilik-politikasi'], ['KVKK', '/kvkk'], ['Aydınlatma Metni', '/aydinlatma-metni'], ['Kiralama Sözleşmesi', '/kiralama-sozlesmesi'], ['Mesafeli Satış Sözleşmesi', '/mesafeli-satis-sozlesmesi'], ['Teslimat ve İade Politikası', '/teslimat-ve-iade-politikasi']].map(([label, href]) => (
                  <li key={href}><Link href={href} className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm">İLETİŞİM</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatolye@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; {new Date().getFullYear()} Meryem Balkan Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} isDarkMode={isDarkMode} />
    </div>
  );
}

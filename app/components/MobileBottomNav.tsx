'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

// Gelinlik/abiye silüeti — askılık + dar bodis + geniş etek + sparkle'lar
const WeddingDressIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={20}
    height={20}
    className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}
  >
    {/* Ana elbise silüeti: askı kancası → askı çubukları → dar bodis → geniş etek */}
    <path d="M12 2C14 2 15 3 15 4.2C15 5.1 14 5.8 13 6L20 8L16.5 8.5L17 13Q21 17.5 22 22.5H2Q3 17.5 7 13L7.5 8.5L4 8L11 6C10 5.8 9 5.1 9 4.2C9 3 10 2 12 2Z" />
    {/* Sparkle'lar — eteğin dışında, elbise dolgusuyla çakışmıyor */}
    <g opacity="0.65" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none">
      {/* Sol sparkle */}
      <line x1="3" y1="11" x2="3" y2="13" />
      <line x1="2" y1="12" x2="4" y2="12" />
      {/* Sağ sparkle */}
      <line x1="21" y1="10" x2="21" y2="12" />
      <line x1="20" y1="11" x2="22" y2="11" />
      {/* Üst-sağ sparkle (kanca yanında) */}
      <line x1="17.5" y1="2.5" x2="17.5" y2="4.5" />
      <line x1="16.5" y1="3.5" x2="18.5" y2="3.5" />
    </g>
  </svg>
);

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Tema takibi
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme !== 'light');

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Sepet sayısı takibi
  useEffect(() => {
    const updateCart = () => {
      const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartCount(items.length);
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    return () => window.removeEventListener('storage', updateCart);
  }, []);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartCount(items.length);
  }, [pathname]);

  // Scroll yönüne göre gizle/göster
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      if (current < 10) {
        setHidden(false);
        lastScrollY.current = current;
        return;
      }
      const delta = current - lastScrollY.current;
      if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
      lastScrollY.current = current;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (
    pathname?.startsWith('/admin') ||
    pathname === '/erzincan-gelinlik-kiralama'
  ) {
    return null;
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  const navItems = [
    { href: '/',          label: 'Anasayfa',  icon: 'ri-home-line',        activeIcon: 'ri-home-fill',        dress: false },
    { href: '/portfolio', label: 'Elbiseler', icon: '',                    activeIcon: '',                    dress: true  },
    { href: '/sepet',     label: 'Sepet',     icon: 'ri-shopping-bag-line', activeIcon: 'ri-shopping-bag-fill', dress: false },
    { href: '/hakkimda',  label: 'Hakkımda',  icon: 'ri-user-heart-line',   activeIcon: 'ri-user-heart-fill',   dress: false },
    { href: '/iletisim',  label: 'İletişim',  icon: 'ri-chat-1-line',       activeIcon: 'ri-chat-1-fill',       dress: false },
  ];

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden px-4 transition-transform duration-300 ease-out ${
          hidden ? 'translate-y-[140%]' : 'translate-y-0'
        }`}
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}
      >
        <div
          className={`flex items-center justify-around h-16 rounded-[28px] border px-2 shadow-lg shadow-black/20 ${
            isDarkMode
              ? 'bg-gray-950/85 border-white/10'
              : 'bg-white/90 border-black/[0.07]'
          }`}
          style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          {navItems.map(({ href, label, icon, activeIcon, dress }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-2xl transition-all duration-200 ${
                  active
                    ? isDarkMode
                      ? 'text-white bg-white/10'
                      : 'text-gray-900 bg-black/[0.06]'
                    : isDarkMode
                      ? 'text-gray-500 hover:text-gray-300'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative">
                  {dress ? (
                    <WeddingDressIcon active={active} />
                  ) : (
                    <i
                      className={`${active ? activeIcon : icon} text-[20px] transition-transform duration-200 ${
                        active ? 'scale-110' : 'scale-100'
                      }`}
                    />
                  )}
                  {href === '/sepet' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-pink-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] tracking-wide transition-all duration-200 ${
                    active ? 'font-medium' : 'font-light'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-20 sm:hidden" aria-hidden="true" />
    </>
  );
}

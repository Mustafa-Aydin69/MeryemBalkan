'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme !== 'light');

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const updateCart = () => {
      const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartCount(items.length);
    };
    updateCart();
    window.addEventListener('storage', updateCart);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateCart);
    };
  }, []);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartCount(items.length);
  }, [pathname]);

  if (
    pathname?.startsWith('/admin') ||
    pathname === '/erzincan-gelinlik-kiralama'
  ) {
    return null;
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  const navItems = [
    { href: '/',          label: 'Anasayfa',  icon: 'ri-home-line',         activeIcon: 'ri-home-fill' },
    { href: '/portfolio', label: 'Elbiseler', icon: 'ri-layout-grid-line',   activeIcon: 'ri-layout-grid-fill' },
    { href: '/sepet',     label: 'Sepet',     icon: 'ri-shopping-bag-line',  activeIcon: 'ri-shopping-bag-fill' },
    { href: '/hakkimda',  label: 'Hakkımda',  icon: 'ri-user-heart-line',    activeIcon: 'ri-user-heart-fill' },
    { href: '/iletisim',  label: 'İletişim',  icon: 'ri-chat-1-line',        activeIcon: 'ri-chat-1-fill' },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Glass background */}
        <div
          className={`absolute inset-0 border-t ${
            isDarkMode
              ? 'bg-gray-950/75 border-white/[0.06]'
              : 'bg-white/80 border-black/[0.06]'
          }`}
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        />

        <div className="relative flex items-center justify-around h-14 px-1">
          {navItems.map(({ href, label, icon, activeIcon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 ${
                  active
                    ? isDarkMode ? 'text-white' : 'text-gray-900'
                    : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative">
                  <i
                    className={`${active ? activeIcon : icon} text-[19px] transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                  />
                  {href === '/sepet' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-pink-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                {/* Active dot — ikon ile isim arasında */}
                <span
                  className={`w-1 h-1 rounded-full transition-all duration-200 ${
                    active
                      ? isDarkMode ? 'bg-white' : 'bg-gray-900'
                      : 'bg-transparent'
                  }`}
                />
                <span
                  className={`text-[9px] tracking-wide transition-all duration-200 ${
                    active
                      ? isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'
                      : 'font-light'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Sayfa içeriğinin nav arkasında kalmaması için boşluk */}
      <div className="h-14 sm:hidden" aria-hidden="true" />
    </>
  );
}

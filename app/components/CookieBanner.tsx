'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X, Cookie } from 'lucide-react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) return;

    const theme = localStorage.getItem('theme');
    setIsDark(theme !== 'light');

    const t = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const accept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
    setTimeout(() => setMounted(false), 500);
  };

  const reject = () => {
    localStorage.setItem('cookieConsent', 'essential');
    setVisible(false);
    setTimeout(() => setMounted(false), 500);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-center sm:justify-start p-4 sm:p-6 z-50">
      <div
        className={`pointer-events-auto relative max-w-sm w-full rounded-2xl p-6 shadow-2xl transition-all duration-500 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${
          isDark
            ? 'bg-gray-900/90 border border-gray-700 text-white backdrop-blur-md'
            : 'bg-white/90 border border-neutral-200 text-black backdrop-blur-md'
        }`}
      >
        {/* Kapat */}
        <button
          onClick={reject}
          className={`absolute top-4 right-4 transition-colors ${
            isDark ? 'text-gray-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-900'
          }`}
          aria-label="Kapat"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col gap-4">
          {/* Başlık */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-white text-black' : 'bg-neutral-900 text-white'}`}>
              <Cookie size={18} />
            </div>
            <h2 className={`text-lg font-serif italic tracking-wide ${isDark ? 'text-white' : 'text-neutral-800'}`}>
              Deneyiminizi Kişiselleştirin
            </h2>
          </div>

          {/* Metin */}
          <p className={`text-xs leading-relaxed font-light ${isDark ? 'text-gray-400' : 'text-neutral-600'}`}>
            Size en iyi deneyimi sunmak ve tercihlerinizi hatırlamak için çerezler kullanıyoruz.{' '}
            <Link
              href="/gizlilik-politikasi"
              className={`underline underline-offset-2 transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Gizlilik Politikası
            </Link>{' '}
            ve{' '}
            <Link
              href="/kvkk"
              className={`underline underline-offset-2 transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              KVKK
            </Link>{' '}
            metnini inceleyebilirsiniz.
          </p>

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={accept}
              className={`flex-1 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full transition-all ${
                isDark
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700'
              }`}
            >
              Tümünü Kabul Et
            </button>
            <button
              onClick={reject}
              className={`flex-1 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full border transition-all ${
                isDark
                  ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Yalnızca Zorunlu
            </button>
          </div>

          {/* Alt bilgi */}
          <div className={`flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.15em] ${
            isDark ? 'text-gray-600' : 'text-neutral-400'
          }`}>
            <ShieldCheck size={11} />
            Verileriniz bizimle güvende
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminHeader() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Ana sayfaya yönlendir
      router.push('/');
      router.refresh();
    } catch {
      // Hata olsa bile yönlendir
      router.push('/');
    }
  };

  return (
    <div className="flex justify-between items-center w-full mb-2">
      {/* Logout Butonu */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors text-white hover:text-red-400 disabled:opacity-50"
        title="Çıkış Yap"
      >
        <i className={`ri-logout-box-r-line text-lg ${isLoggingOut ? 'animate-pulse' : ''}`}></i>
      </button>

      {/* Orta: Başlık */}
      <div className="flex-1 text-center">
        <h1 className="text-xl font-light tracking-[0.3em] font-serif italic text-white">
          MERYEM BALKAN
        </h1>
        <p className="text-xs tracking-wider text-gray-400">
          YÖNETİCİ PANELİ
        </p>
      </div>

      {/* Ana Sayfa Butonu */}
      <Link
        href="/"
        className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors text-white hover:text-gray-300"
      >
        <i className="ri-home-line text-lg"></i>
      </Link>
    </div>
  );
}

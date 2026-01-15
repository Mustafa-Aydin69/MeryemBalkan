'use client';

import { useState, useEffect } from 'react';

interface CreditCardPreviewProps {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  isFlipped: boolean; // CVV input'una focus olduğunda true
  isDarkMode?: boolean;
}

export default function CreditCardPreview({
  cardNumber,
  cardName,
  expiryDate,
  cvv,
  isFlipped,
  isDarkMode = false,
}: CreditCardPreviewProps) {
  // Kart numarasını formatlı göster (•••• •••• •••• 1234)
  const formatCardNumber = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (!cleaned) return '•••• •••• •••• ••••';
    
    // 16 haneli olacak şekilde doldur
    const padded = cleaned.padEnd(16, '•');
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  // CVV'yi maskeli göster (•••)
  const formatCVV = (cvvValue: string): string => {
    if (!cvvValue) return '•••';
    return '•'.repeat(cvvValue.length);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto mb-8" style={{ perspective: '1000px' }}>
      {/* Kart Container - 3D dönüş için */}
      <div
        className="relative w-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          aspectRatio: '1.586', // Standart kredi kartı oranı (85.6mm x 53.98mm)
        }}
      >
        {/* ÖN YÜZ */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Üst kısım - Chip ve Logo */}
          <div className="flex justify-between items-start">
            {/* Chip */}
            <div className="w-10 h-8 sm:w-12 sm:h-10 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full grid grid-cols-3 gap-[1px] p-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-yellow-500/50 rounded-[1px]" />
                ))}
              </div>
            </div>
            
            {/* Contactless Icon */}
            <div className="text-white/60">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.5 14.5A4 4 0 0 1 8 12a4 4 0 0 1 .5-2" />
                <path d="M6 16a6 6 0 0 1 0-8" />
                <path d="M3.5 18.5a9 9 0 0 1 0-13" />
              </svg>
            </div>
          </div>

          {/* Kart Numarası */}
          <div className="text-white font-mono text-lg sm:text-xl md:text-2xl tracking-[0.15em] text-center py-2">
            {formatCardNumber(cardNumber)}
          </div>

          {/* Alt kısım - İsim ve Tarih */}
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Kart Sahibi</p>
              <p className="text-white font-medium text-xs sm:text-sm uppercase tracking-wider truncate">
                {cardName || 'AD SOYAD'}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Son Kullanma</p>
              <p className="text-white font-medium text-xs sm:text-sm tracking-wider">
                {expiryDate || 'AA/YY'}
              </p>
            </div>
          </div>

          {/* Dekoratif Daireler */}
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-5 top-20 w-24 h-24 rounded-full bg-white/5" />
        </div>

        {/* ARKA YÜZ */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Manyetik Şerit */}
          <div className="w-full h-12 sm:h-14 bg-gray-900 mt-6" />

          {/* CVV Alanı */}
          <div className="flex-1 flex flex-col justify-center px-5 sm:px-6">
            <div className="w-full">
              <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider mb-2 text-right">CVV</p>
              <div className="w-full h-10 sm:h-12 bg-white rounded flex items-center justify-end px-4">
                <span className="text-gray-900 font-mono text-lg sm:text-xl tracking-widest">
                  {formatCVV(cvv)}
                </span>
              </div>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <p className="text-white/30 text-[8px] sm:text-[10px] text-center">
              Bu kart yetkisiz kullanıma karşı korunmaktadır. Güvenlik kodunuzu kimseyle paylaşmayın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



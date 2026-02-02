'use client';

import { useState } from 'react';
import { Rental } from './useRentals';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

// Ürün görseli bileşeni
function ProductImage({ imageUrl, title }: { imageUrl: string; title: string }) {
  const [hasError, setHasError] = useState(false);

  // Eğer URL tam değilse base URL ekle
  let finalUrl = imageUrl;
  if (imageUrl && !imageUrl.startsWith('http')) {
    finalUrl = getR2BaseUrl() + imageUrl;
  }

  if (!finalUrl || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
        <i className="ri-image-line text-4xl"></i>
      </div>
    );
  }

  return (
    <img
      src={finalUrl}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setHasError(true)}
    />
  );
}

// Tarih formatlama
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Para formatlama
function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR') + ' ₺';
}

interface RentalsTableProps {
  rentals: Rental[];
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  onViewRental: (rental: Rental) => void;
  loading?: boolean;
}

// Loading Skeleton Bileşeni
function RentalSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-700"></div>
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="pb-3 border-b border-gray-700 space-y-2">
          <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export default function RentalsTable({
  rentals,
  getStatusColor,
  getStatusLabel,
  onViewRental,
  loading = false,
}: RentalsTableProps) {
  // Loading durumu
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <RentalSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <i className="ri-calendar-check-line text-4xl mb-3 block"></i>
        <p>Kiralama kaydı bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rentals.map((rental) => (
        <div
          key={rental.rentalId}
          className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20"
        >
          {/* Ürün Görseli */}
          <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
            <ProductImage imageUrl={rental.product.imageUrl} title={rental.product.name} />
            
            {/* Durum Badge - Üst Sol */}
            <div className="absolute top-3 left-3">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-lg ${getStatusColor(
                  rental.status
                )}`}
              >
                {getStatusLabel(rental.status)}
              </span>
            </div>

            {/* Detay Butonu - Üst Sağ - Hover'da Görünür */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onViewRental(rental)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900/80 backdrop-blur-sm text-white hover:bg-indigo-600 transition-colors"
                title="Detay"
              >
                <i className="ri-eye-line text-sm"></i>
              </button>
            </div>
          </div>

          {/* Kiralama Bilgileri */}
          <div className="p-4">
            {/* Ürün Adı ve ID */}
            <div className="mb-3">
              <h3 className="font-medium text-white truncate mb-1">
                {rental.product.name}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                #{rental.product.id}
              </p>
            </div>

            {/* Müşteri Bilgileri */}
            <div className="mb-3 pb-3 border-b border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Müşteri</p>
              <p className="text-sm text-white">
                {rental.customer.firstName} {rental.customer.lastName}
              </p>
              <p className="text-xs text-gray-400">{rental.customer.phone}</p>
            </div>

            {/* Kira Dönemi */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Etkinlik → En Geç İade</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-300">{formatDate(rental.rentalPeriod.etkinlikTarihi)}</span>
                <i className="ri-arrow-right-line text-gray-600"></i>
                <span className="text-gray-300">{formatDate(rental.rentalPeriod.enGecIadeTarihi)}</span>
              </div>
            </div>

            {/* Fiyat ve ID */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">
                {formatPrice(rental.price)}
              </span>
              <span className="text-xs text-gray-600 font-mono">
                {rental.rentalId}
              </span>
            </div>

            {/* Mobil için Detay Butonu */}
            <div className="mt-4 pt-3 border-t border-gray-700 flex gap-2 sm:hidden">
              <button
                onClick={() => onViewRental(rental)}
                className="flex-1 py-2 px-3 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
              >
                <i className="ri-eye-line"></i>
                Detay
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

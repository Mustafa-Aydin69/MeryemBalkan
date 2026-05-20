'use client';

import { useState } from 'react';
import { Product } from './useProducts';
import { parseImages } from '@/app/utils/parseImages';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

// Ürün görseli bileşeni - farklı veri formatlarını handle eder
function ProductImage({ images, title }: { images: string[] | string | undefined; title: string }) {
  const [hasError, setHasError] = useState(false);
  
  const parsed = parseImages(images);
  let imageUrl = parsed[0] ?? '';
  
  // Eğer URL tam değilse base URL ekle
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = getR2BaseUrl() + imageUrl;
  }
  
  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-600">
        <i className="ri-image-line text-4xl"></i>
      </div>
    );
  }
  
  return (
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setHasError(true)}
    />
  );
}

interface ProductsTableProps {
  products: Product[];
  getProductStatusColor: (status: string) => string;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  loading?: boolean;
}

// Loading Skeleton Bileşeni
function ProductSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-700"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsTable({
  products,
  getProductStatusColor,
  onEditProduct,
  onDeleteProduct,
  loading = false,
}: ProductsTableProps) {
  // Loading durumu
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <i className="ri-shirt-line text-4xl mb-3 block"></i>
        <p>Ürün bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20"
        >
          {/* Ürün Görseli */}
          <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
            <ProductImage images={product.images} title={product.title} />
            
            {/* Durum Badge - Üst Sol */}
            <div className="absolute top-3 left-3">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-lg ${getProductStatusColor(
                  product.status
                )}`}
              >
                {product.status}
              </span>
            </div>

            {/* Hızlı İşlemler - Üst Sağ - Hover'da Görünür */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditProduct(product)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900/80 backdrop-blur-sm text-white hover:bg-indigo-600 transition-colors"
                title="Düzenle"
              >
                <i className="ri-edit-line text-sm"></i>
              </button>
              <button
                onClick={() => onDeleteProduct(product.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900/80 backdrop-blur-sm text-white hover:bg-red-600 transition-colors"
                title="Sil"
              >
                <i className="ri-delete-bin-line text-sm"></i>
              </button>
            </div>
          </div>

          {/* Ürün Bilgileri */}
          <div className="p-4">
            {/* Başlık ve Kategori */}
            <div className="mb-3">
              <h3 className="font-medium text-white truncate mb-1">
                {product.title}
              </h3>
              <p className="text-xs text-gray-500">
                {product.collection || product.category || 'Kategori belirtilmemiş'}
              </p>
            </div>

            {/* Fiyat ve ID */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">
                {product.price} <span className="text-sm font-normal text-gray-500">TL</span>
              </span>
              <span className="text-xs text-gray-600 font-mono">
                #{product.id}
              </span>
            </div>

            {/* Renkler (varsa) */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Renkler</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.slice(0, 4).map((color, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"
                    >
                      {color}
                    </span>
                  ))}
                  {product.colors.length > 4 && (
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-400">
                      +{product.colors.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mobil için İşlem Butonları */}
            <div className="mt-4 pt-3 border-t border-gray-700 flex gap-2 sm:hidden">
              <button
                onClick={() => onEditProduct(product)}
                className="flex-1 py-2 px-3 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
              >
                <i className="ri-edit-line"></i>
                Düzenle
              </button>
              <button
                onClick={() => onDeleteProduct(product.id)}
                className="py-2 px-3 text-sm rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

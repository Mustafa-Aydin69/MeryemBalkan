'use client';

import { useEffect, useState } from 'react';
import { useRentals, RentalStatus, Rental } from './useRentals';
import RentalsTable from './RentalsTable';
import CreateRentalModal from './CreateRentalModal';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

// Resim URL'ini düzeltme
const getImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) return '/images/Anasayfa/Meryem_Balkan_Logo.jpg';
  if (imageUrl.startsWith('http')) return imageUrl;
  return getR2BaseUrl() + imageUrl;
};

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

// Onay Modal Bileşeni
function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading,
  confirmColor = 'indigo',
}: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmColor?: 'indigo' | 'green' | 'red';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="rounded-xl w-full max-w-md bg-gray-800 text-white border border-gray-700 shadow-2xl p-6">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-full border font-medium transition-colors border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors text-white disabled:opacity-50 flex items-center justify-center gap-2 ${colorClasses[confirmColor]}`}
          >
            {isLoading && <i className="ri-loader-4-line animate-spin"></i>}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Detay Modal Bileşeni
function RentalDetailModal({
  rental,
  onClose,
  getStatusColor,
  getStatusLabel,
  onMarkComplete,
  onSendNotification,
}: {
  rental: Rental;
  onClose: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  onMarkComplete: (rentalId: string) => Promise<void>;
  onSendNotification: (rental: Rental) => Promise<void>;
}) {
  const [showNotifyConfirm, setShowNotifyConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // ESC ile kapanma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showNotifyConfirm && !showCompleteConfirm) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, showNotifyConfirm, showCompleteConfirm]);

  const handleNotify = async () => {
    setIsNotifying(true);
    try {
      await onSendNotification(rental);
      setShowNotifyConfirm(false);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onMarkComplete(rental.rentalId);
      setShowCompleteConfirm(false);
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white border border-gray-700 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Kiralama Detayı</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Ürün Bilgileri */}
            <section>
              <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <i className="ri-shirt-line"></i>
                Ürün Bilgileri
              </h4>
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                  <img
                    src={getImageUrl(rental.product.imageUrl)}
                    alt={rental.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium text-white">{rental.product.name}</p>
                  <p className="text-sm text-gray-500 font-mono">
                    #{rental.product.id}
                  </p>
                </div>
              </div>
            </section>

            {/* Müşteri Bilgileri */}
            <section>
              <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <i className="ri-user-line"></i>
                Müşteri Bilgileri
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ad</p>
                  <p className="text-white">{rental.customer.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Soyad</p>
                  <p className="text-white">{rental.customer.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Telefon</p>
                  <p className="text-white">{rental.customer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-white">{rental.customer.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Açık Adres</p>
                  <p className="text-white">{rental.customer.address}</p>
                </div>
              </div>
            </section>

            {/* Kira Bilgileri */}
            <section>
              <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <i className="ri-calendar-line"></i>
                Kira Bilgileri
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Etkinlik Tarihi</p>
                  <p className="text-white">
                    {formatDate(rental.rentalPeriod.etkinlikTarihi)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">En Geç İade Tarihi</p>
                  <p className="text-white">
                    {formatDate(rental.rentalPeriod.enGecIadeTarihi)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Durum</p>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      rental.status
                    )}`}
                  >
                    {getStatusLabel(rental.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ücret</p>
                  <p className="text-white font-semibold text-lg">
                    {formatPrice(rental.price)}
                  </p>
                </div>
              </div>
            </section>

            {/* Sistem Bilgileri */}
            <section>
              <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <i className="ri-settings-3-line"></i>
                Sistem Bilgileri
              </h4>
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="text-white font-mono">{rental.rentalId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Oluşturulma Tarihi</p>
                  <p className="text-white">
                    {new Date(rental.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer - 3 Buton */}
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Hatırlatma Gönder Butonu */}
              <button
                onClick={() => setShowNotifyConfirm(true)}
                className="flex-1 py-3 px-4 rounded-full font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <i className="ri-mail-send-line"></i>
                Hatırlatma Gönder
              </button>

              {/* Tamamlandı Butonu */}
              <button
                onClick={() => setShowCompleteConfirm(true)}
                className="flex-1 py-3 px-4 rounded-full font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <i className="ri-check-double-line"></i>
                Tamamlandı
              </button>

              {/* Kapat Butonu */}
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-full border font-medium transition-colors border-gray-600 text-white hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hatırlatma Onay Modalı */}
      {showNotifyConfirm && (
        <ConfirmModal
          title="Hatırlatma Maili Gönder"
          message={`${rental.customer.firstName} ${rental.customer.lastName} adlı müşteriye iade hatırlatma maili gönderilecek. Devam etmek istiyor musunuz?`}
          confirmText="Gönder"
          cancelText="İptal"
          onConfirm={handleNotify}
          onCancel={() => setShowNotifyConfirm(false)}
          isLoading={isNotifying}
          confirmColor="indigo"
        />
      )}

      {/* Tamamlandı Onay Modalı */}
      {showCompleteConfirm && (
        <ConfirmModal
          title="Kiralama Tamamlansın mı?"
          message="Bu işlem siparişin durumunu 'Tamamlandı' olarak güncelleyecek ve kira listesinden kaldırılacak. Devam etmek istiyor musunuz?"
          confirmText="Tamamla"
          cancelText="İptal"
          onConfirm={handleComplete}
          onCancel={() => setShowCompleteConfirm(false)}
          isLoading={isCompleting}
          confirmColor="green"
        />
      )}
    </>
  );
}


export default function KiraYonetimi() {
  const {
    filteredRentals,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewingRental,
    setViewingRental,
    stats,
    getStatusColor,
    getStatusLabel,
    isCreateModalOpen,
    setIsCreateModalOpen,
    refreshRentals,
    markRentalComplete,
    sendNotification,
  } = useRentals();

  const filterButtons: { key: RentalStatus; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'musteride', label: 'Müşteride' },
    { key: 'gecikti', label: 'Gecikti' },
  ];

  return (
    <div>
      {/* Başlık ve Butonlar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-8">
        <h2 className="text-2xl font-light tracking-wide text-white">
          KİRA YÖNETİMİ
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshRentals}
            disabled={loading}
            className="p-2.5 rounded-full font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Verileri Yenile"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-full font-medium transition-colors bg-white text-black hover:bg-gray-100 flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Yeni Kiralama Oluştur
          </button>
        </div>
      </div>

      {/* Summary Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Aktif Kiradakiler */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Aktif Kiradakiler</p>
              <p className="text-3xl font-semibold text-white">
                {stats.aktifKiradakiler}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <i className="ri-user-follow-line text-xl text-green-400"></i>
            </div>
          </div>
        </div>

        {/* Geciken İadeler */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Geciken İadeler</p>
              <p className="text-3xl font-semibold text-white">
                {stats.gecikenIadeler}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <i className="ri-error-warning-line text-xl text-red-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre & Arama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Filtre Butonları */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === btn.key
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Arama */}
        <div className="relative w-full sm:w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Elbise veya müşteri ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-gray-500 focus:outline-none placeholder-gray-500"
          />
        </div>
      </div>

      {/* Toplam Sonuç */}
      <div className="mb-4">
        <span className="text-sm text-gray-400">
          {filteredRentals.length} kiralama bulundu
        </span>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <i className="ri-error-warning-line text-3xl text-red-400"></i>
          </div>
          <p className="text-red-400 mb-2">Veriler yüklenirken hata oluştu</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={refreshRentals}
            className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-refresh-line"></i>
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Kart Grid */}
      {!error && (
        <RentalsTable
          rentals={filteredRentals}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          onViewRental={setViewingRental}
          loading={loading}
        />
      )}

      {/* Detay Modalı */}
      {viewingRental && (
        <RentalDetailModal
          rental={viewingRental}
          onClose={() => setViewingRental(null)}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          onMarkComplete={markRentalComplete}
          onSendNotification={sendNotification}
        />
      )}

      {/* Yeni Kiralama Modalı */}
      {isCreateModalOpen && (
        <CreateRentalModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refreshRentals}
        />
      )}
    </div>
  );
}

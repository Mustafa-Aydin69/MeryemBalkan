'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrders } from './useOrders';
import OrdersTable from './OrdersTable';

type VerifyVerdict = 'ok' | 'mismatch' | 'iyzico_failed' | 'not_found';

interface VerifyResult {
  verdict: VerifyVerdict;
  iyzico: {
    status?: string;
    paymentStatus?: string;
    paidPrice?: string;
    paymentId?: string;
    errorMessage?: string;
  } | null;
  db: {
    session: { processed: boolean; expires_at: string; total_price: number } | null;
    order: { id: number; created_at: string } | null;
  };
}

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'Tümü' },
  { key: 'Hazırlanıyor', label: 'Hazırlanıyor' },
  { key: 'Kirada', label: 'Kirada' },
  { key: 'Tamamlandı', label: 'Tamamlandı' },
  { key: 'İptal Edildi', label: 'İptal edildi' },
] as const;

function getStatusFilterLabel(statusFilter: string): string {
  const found = STATUS_FILTER_OPTIONS.find((o) => o.key === statusFilter);
  return found ? found.label : 'Tümü';
}

export default function OrdersPage() {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  async function handleVerifyPayment(conversationId: string) {
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/payment/verify?conversation_id=${encodeURIComponent(conversationId)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult(null);
    } finally {
      setVerifyLoading(false);
    }
  }

  const {
    orders,
    filteredOrders,
    searchTermOrders,
    setSearchTermOrders,
    searchOpenOrders,
    setSearchOpenOrders,
    statusFilter,
    setStatusFilter,
    getStatusColor,
    editingOrder,
    setEditingOrder,
    handleEditOrder,
    handleOrderInputChange,
    handleUpdateOrder,
    viewingOrder,
    setViewingOrder,
    refreshOrders,
    loading,
  } = useOrders();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      {/* ÜST KISIM */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-8">
        <h2 className="text-2xl font-light tracking-wide text-white">
          SİPARİŞ YÖNETİMİ
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Verileri Yenile Butonu */}
          <button
            onClick={refreshOrders}
            disabled={loading}
            className="p-2 rounded-full font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Verileri Yenile"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
          </button>

          {/* Arama Butonu */}
          <button
            onClick={() => {
              if (searchOpenOrders) setSearchTermOrders('');
              setSearchOpenOrders(!searchOpenOrders);
            }}
            className="p-2 rounded-full transition-colors bg-gray-700 text-white hover:bg-gray-600"
          >
            <i className="ri-search-line"></i>
          </button>

          {/* Arama Input */}
          {searchOpenOrders && (
            <input
              type="text"
              value={searchTermOrders}
              onChange={(e) => setSearchTermOrders(e.target.value)}
              placeholder="İsim, telefon veya e-posta ara..."
              className="px-3 py-2 rounded-lg transition-colors bg-gray-700 text-white border border-gray-600 focus:border-gray-500 focus:outline-none w-full sm:w-64"
            />
          )}

          <div className="px-4 py-2 rounded-full text-sm bg-gray-700 text-white">
            Toplam: {filteredOrders.length} Sipariş
          </div>

          {/* Durum filtresi - Tek buton, tıklanınca açılır menü (Trendyol/Hepsiburada tarzı) */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm font-medium border border-gray-600"
            >
              <i className="ri-filter-3-line"></i>
              <span>Durum: {getStatusFilterLabel(statusFilter)}</span>
              <i className={`ri-arrow-down-s-line text-lg transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {statusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[180px] rounded-lg border border-gray-600 bg-gray-800 shadow-xl z-50 py-1">
                {STATUS_FILTER_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(key);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 hover:bg-gray-700 transition-colors ${
                      statusFilter === key ? 'text-white bg-gray-700' : 'text-gray-300'
                    }`}
                  >
                    <span>{label}</span>
                    {statusFilter === key && <i className="ri-check-line text-green-400"></i>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Müşteri Kartları */}
      <OrdersTable
        orders={filteredOrders}
        allOrders={filteredOrders}
        getStatusColor={getStatusColor}
        onEditOrder={handleEditOrder}
        onViewOrder={setViewingOrder}
        searchTerm={searchTermOrders}
        loading={loading}
      />

      {/* SİPARİŞ DETAYLARI MODALI */}
      {viewingOrder && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) { setViewingOrder(null); setVerifyResult(null); }
          }}
        >
          <div className="rounded-xl w-full max-w-lg shadow-2xl bg-gray-800 text-white border border-gray-700 max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header - Sabit */}
            <div className="flex justify-between items-center border-b border-gray-700 p-4 sm:p-6 pb-4 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-medium">Sipariş Detayları</h3>
              <button
                onClick={() => { setViewingOrder(null); setVerifyResult(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 sm:p-6 pt-4 overflow-y-auto flex-1">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Sipariş No</p>
                    <p className="font-mono">#{viewingOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Durum</p>
                    <p>{viewingOrder.status}</p>
                  </div>
                </div>
                {viewingOrder.conversationId && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Conversation ID</p>
                    <p className="font-mono text-xs break-all select-all text-gray-300">{viewingOrder.conversationId}</p>
                  </div>
                )}
                
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-500 text-xs mb-1">Müşteri</p>
                  <p className="font-medium">{viewingOrder.customerName}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Telefon</p>
                    <p>{viewingOrder.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">E-posta</p>
                    <p className="truncate">{viewingOrder.email || "—"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-500 text-xs mb-1">Adres</p>
                  <p className="break-words">{viewingOrder.address}</p>
                </div>
                
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-500 text-xs mb-1">Ürün</p>
                  <p className="font-medium break-words">{viewingOrder.productName}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Beden</p>
                    <p>{viewingOrder.size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Renk</p>
                    <p className="truncate">{viewingOrder.color}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Fiyat</p>
                    <p className="font-medium text-green-400">{viewingOrder.price}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Etkinlik Tarihi</p>
                    <p>{viewingOrder.eventDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Kargo Kodu</p>
                    <p className="truncate">{viewingOrder.shippingCode || '—'}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-500 text-xs mb-1">Ödeme Şekli</p>
                  <p className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    viewingOrder.paymentMethod === 'Mağazadan'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    <i className={viewingOrder.paymentMethod === 'Mağazadan' ? 'ri-store-2-line' : 'ri-bank-card-line'}></i>
                    {viewingOrder.paymentMethod || 'Online'}
                  </p>
                </div>

              </div>
            </div>

            {/* Footer - Sabit */}
            <div className="p-4 sm:p-6 pt-4 border-t border-gray-700 flex-shrink-0 space-y-3">
              {/* Verify sonucu */}
              {verifyResult && (() => {
                const v = verifyResult.verdict;
                const boxCls = v === 'ok'
                  ? 'rounded-lg p-3 text-sm space-y-1.5 bg-green-900/30 border border-green-700 text-green-300'
                  : v === 'mismatch'
                  ? 'rounded-lg p-3 text-sm space-y-1.5 bg-red-900/30 border border-red-700 text-red-300'
                  : v === 'iyzico_failed'
                  ? 'rounded-lg p-3 text-sm space-y-1.5 bg-amber-900/30 border border-amber-700 text-amber-300'
                  : 'rounded-lg p-3 text-sm space-y-1.5 bg-gray-800 border border-gray-600 text-gray-400';
                const iconCls = v === 'ok' ? 'ri-shield-check-line' : v === 'mismatch' ? 'ri-error-warning-line' : v === 'iyzico_failed' ? 'ri-close-circle-line' : 'ri-question-line';
                const label = v === 'ok' ? 'Ödeme doğrulandı' : v === 'mismatch' ? 'Kritik: Iyzico başarılı ama sipariş yok!' : v === 'iyzico_failed' ? 'Iyzico: ödeme başarısız' : 'Kayıt bulunamadı';
                return (
                  <div className={boxCls}>
                    <p className="font-medium flex items-center gap-2">
                      <i className={iconCls}></i>
                      {label}
                    </p>
                    {verifyResult.iyzico && (
                      <p className="text-xs opacity-75">
                        {'Iyzico: ' + (verifyResult.iyzico.paymentStatus || verifyResult.iyzico.status || '-')}
                        {verifyResult.iyzico.paidPrice ? ' · ' + verifyResult.iyzico.paidPrice + ' TL' : ''}
                        {verifyResult.iyzico.errorMessage ? ' · ' + verifyResult.iyzico.errorMessage : ''}
                      </p>
                    )}
                    {verifyResult.db.order && (
                      <p className="text-xs opacity-75">
                        {'Sipariş #' + verifyResult.db.order.id + ' · ' + new Date(verifyResult.db.order.created_at).toLocaleString('tr-TR')}
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2">
                {/* Ödemeyi Kontrol Et - sadece online ödemeler için */}
                {/^\d{10,}-[a-z0-9]+$/.test(viewingOrder.conversationId) && (
                  <button
                    onClick={() => handleVerifyPayment(viewingOrder.conversationId)}
                    disabled={verifyLoading}
                    className="flex-1 py-3 px-4 rounded-full border font-medium transition-colors border-indigo-600 text-indigo-400 hover:bg-indigo-600 hover:text-white disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {verifyLoading
                      ? <><i className="ri-loader-4-line animate-spin"></i> Kontrol ediliyor...</>
                      : <><i className="ri-shield-check-line"></i> Ödemeyi Kontrol Et</>
                    }
                  </button>
                )}
                <button
                  onClick={() => { setViewingOrder(null); setVerifyResult(null); }}
                  className="py-3 px-8 rounded-full border font-medium transition-colors border-gray-600 text-white hover:bg-gray-700"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SİPARİŞ DÜZENLEME MODALI */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="rounded-xl max-w-md w-full max-h-[95vh] bg-gray-800 border border-gray-700 flex flex-col overflow-hidden">
            {/* Üst Başlık - Sabit */}
            <div className="p-4 sm:p-5 border-b border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-medium text-white">
                  Sipariş Durumu Güncelle
                </h3>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* İçerik - Scrollable */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* Sipariş Bilgileri */}
              <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                <h4 className="font-medium mb-3 text-white text-sm">
                  Sipariş Bilgileri
                </h4>
                <div className="text-sm space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sipariş No:</span>
                    <span className="font-mono">#{editingOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Müşteri:</span>
                    <span>{editingOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ürün:</span>
                    <span className="truncate ml-2">{editingOrder.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Detaylar:</span>
                    <span>{editingOrder.size}, {editingOrder.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Etkinlik:</span>
                    <span>{editingOrder.eventDate}</span>
                  </div>
                </div>
              </div>

              {/* Durum Seçimi */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  Sipariş Durumu
                </label>
                <div className="space-y-2">
                  {[
                    { status: 'Hazırlanıyor', icon: 'ri-time-line', color: 'blue' },
                    { status: 'Kirada', icon: 'ri-truck-line', color: 'orange' },
                    { status: 'Sipariş Tamamlandı', icon: 'ri-check-double-line', color: 'green' },
                    { status: 'İptal Edildi', icon: 'ri-close-circle-line', color: 'red' },
                  ].map(({ status, icon, color }) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleOrderInputChange('status', status)}
                      className={`w-full py-3 px-4 rounded-lg border text-sm font-medium transition-all cursor-pointer text-left ${
                        editingOrder.status === status
                          ? 'border-white bg-white text-black'
                          : 'border-gray-600 text-white hover:border-gray-500 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <i className={icon}></i>
                          {status}
                        </span>
                        {editingOrder.status === status && (
                          <i className="ri-check-line text-lg"></i>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kargo Kodu Alanı */}
              {editingOrder.status === 'Kirada' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Kargo Kodu
                  </label>
                  <input
                    type="text"
                    value={editingOrder.shippingCode || ''}
                    onChange={(e) => handleOrderInputChange('shippingCode', e.target.value)}
                    placeholder="Örn: YURTICI12345"
                    className="w-full px-4 py-3 rounded-lg border text-sm bg-gray-700 text-white border-gray-600 focus:border-gray-400 focus:outline-none"
                  />
                </div>
              )}

            </div>

            {/* Alt Butonlar - Sabit */}
            <div className="p-4 sm:p-5 border-t border-gray-700 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-full border font-medium border-gray-600 text-white hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-full font-medium bg-white text-black hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

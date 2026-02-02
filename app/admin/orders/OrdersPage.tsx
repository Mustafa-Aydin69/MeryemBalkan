'use client';

import { useOrders } from './useOrders';
import OrdersTable from './OrdersTable';

export default function OrdersPage() {
  const {
    orders,
    filteredOrders,
    searchTermOrders,
    setSearchTermOrders,
    searchOpenOrders,
    setSearchOpenOrders,
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
              placeholder="Müşteri, telefon veya e-posta ara..."
              className="px-3 py-2 rounded-lg transition-colors bg-gray-700 text-white border border-gray-600 focus:border-gray-500 focus:outline-none w-full sm:w-64"
            />
          )}

          <div className="px-4 py-2 rounded-full text-sm bg-gray-700 text-white">
            Toplam: {filteredOrders.length} Sipariş
          </div>
        </div>
      </div>

      {/* Müşteri Kartları */}
      <OrdersTable
        orders={filteredOrders}
        allOrders={orders}
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
            if (e.target === e.currentTarget) setViewingOrder(null);
          }}
        >
          <div className="rounded-xl w-full max-w-lg shadow-2xl bg-gray-800 text-white border border-gray-700 max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header - Sabit */}
            <div className="flex justify-between items-center border-b border-gray-700 p-4 sm:p-6 pb-4 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-medium">Sipariş Detayları</h3>
              <button
                onClick={() => setViewingOrder(null)}
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
                    <p className="font-mono">#{viewingOrder.id.toString().padStart(4, '0')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Durum</p>
                    <p>{viewingOrder.status}</p>
                  </div>
                </div>
                
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
            <div className="p-4 sm:p-6 pt-4 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => setViewingOrder(null)}
                className="w-full sm:w-auto py-3 px-8 rounded-full border font-medium transition-colors border-gray-600 text-white hover:bg-gray-700"
              >
                Kapat
              </button>
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
                    <span className="font-mono">#{editingOrder.id.toString().padStart(4, '0')}</span>
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

'use client';

import { useMessages } from './useMessages';
import MessagesTable from './MessagesTable';

export default function MessagesPage() {
  const {
    filteredMessages,
    currentMessages,
    searchTerm,
    setSearchTerm,
    searchOpen,
    setSearchOpen,
    messagesCurrentPage,
    totalMessagesPages,
    handleMessagesPageChange,
    getMessagesPaginationNumbers,
    selectedMessage,
    setSelectedMessage,
    reply,
    setReply,
    handleSendReply,
    isDeleteMessageModalOpen,
    setIsDeleteMessageModalOpen,
    isDeleting,
    confirmDeleteMessage,
    handleDeleteMessage,
    refreshMessages,
    loading,
  } = useMessages();

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-8">
        <h2 className="text-2xl font-light tracking-wide text-white">
          MESAJLAR
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Verileri Yenile Butonu */}
          <button
            onClick={refreshMessages}
            disabled={loading}
            className="p-2 rounded-full font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Verileri Yenile"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
          </button>

          {/* Arama Butonu */}
          <button
            onClick={() => {
              if (searchOpen) {
                setSearchTerm('');
              }
              setSearchOpen(!searchOpen);
            }}
            className="p-2 rounded-full transition-colors bg-gray-700 text-white hover:bg-gray-600"
          >
            <i className="ri-search-line"></i>
          </button>

          {/* Arama Inputu */}
          {searchOpen && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim, e-posta veya mesaj ara..."
              className="px-3 py-2 rounded-lg transition-colors bg-gray-700 text-white border border-gray-600 focus:border-gray-500 focus:outline-none w-full sm:w-64"
            />
          )}

          <div className="px-4 py-2 rounded-full text-sm bg-gray-700 text-white">
            Toplam: {filteredMessages.length} Mesaj
          </div>
        </div>
      </div>

      {/* Tablo */}
      <MessagesTable
        messages={currentMessages}
        onViewMessage={setSelectedMessage}
        onDeleteMessage={confirmDeleteMessage}
        loading={loading}
      />

      {/* 🔢 Sayfalama */}
      {totalMessagesPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => handleMessagesPageChange(messagesCurrentPage - 1)}
            disabled={messagesCurrentPage === 1}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              messagesCurrentPage === 1
                ? 'bg-gray-800 text-gray-600'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>

          {getMessagesPaginationNumbers().map((number, index) => (
            <span key={index}>
              {number === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => handleMessagesPageChange(number as number)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    messagesCurrentPage === number
                      ? 'bg-white text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {number}
                </button>
              )}
            </span>
          ))}

          <button
            onClick={() => handleMessagesPageChange(messagesCurrentPage + 1)}
            disabled={messagesCurrentPage === totalMessagesPages}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              messagesCurrentPage === totalMessagesPages
                ? 'bg-gray-800 text-gray-600'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      )}

      {/* MESAJ SİLME MODALI */}
      {isDeleteMessageModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold mb-3 text-white">Mesajı Sil</h2>
            <p className="text-gray-400 mb-5">
              Bu mesajı kalıcı olarak silmek istediğine emin misin?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDeleteMessage}
                disabled={isDeleting}
                className={`px-4 py-2 rounded text-white ${
                  isDeleting
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => setIsDeleteMessageModalOpen(false)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-white"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESAJ DETAY VE YANIT MODALI */}
      {selectedMessage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMessage(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Escape' && e.target === e.currentTarget) setSelectedMessage(null); }}
        >
          <div className="max-w-lg w-full rounded-xl bg-gray-800 text-white border border-gray-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    selectedMessage.status === 'Verildi' 
                      ? 'bg-gradient-to-br from-green-600 to-green-700' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedMessage.name}</h3>
                    <p className="text-xs text-gray-500">{selectedMessage.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMessage(null)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* İçerik */}
            <div className="p-5 space-y-4">
              {/* Durum Uyarısı - Cevap Verildi */}
              {selectedMessage.status === 'Verildi' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <i className="ri-checkbox-circle-fill text-green-400"></i>
                  <span className="text-sm text-green-400">Bu mesaj yanıtlandı.</span>
                </div>
              )}
              
              {/* İletişim Bilgileri */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">E-posta</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-indigo-400 hover:underline truncate block">
                    {selectedMessage.email}
                  </a>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Telefon</p>
                  <a href={`tel:${selectedMessage.phone}`} className="text-indigo-400 hover:underline">
                    {selectedMessage.phone}
                  </a>
                </div>
              </div>

              {/* Hizmet Türü */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Hizmet Türü</p>
                <span className="px-2.5 py-1 text-sm rounded bg-gray-700 text-gray-300">
                  {selectedMessage.serviceType}
                </span>
              </div>

              {/* Mesaj */}
              <div>
                <p className="text-gray-500 text-xs mb-2">Mesaj</p>
                <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 max-h-40 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Yanıt Alanı */}
              <div>
                <p className="text-gray-500 text-xs mb-2">Yanıtınız</p>
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={selectedMessage.status === 'Verildi' ? 'Bu mesaj zaten yanıtlandı.' : 'Yanıtınızı yazın...'}
                  disabled={selectedMessage.status === 'Verildi'}
                  className={`w-full p-4 border rounded-lg text-sm resize-none transition-colors ${
                    selectedMessage.status === 'Verildi'
                      ? 'bg-gray-700/50 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:outline-none'
                  }`}
                ></textarea>
              </div>
            </div>

            {/* Footer - Butonlar */}
            <div className="p-5 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setReply('');
                }}
                className="flex-1 py-3 px-4 rounded-full border font-medium border-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={handleSendReply}
                disabled={selectedMessage.status === 'Verildi'}
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                  selectedMessage.status === 'Verildi'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={selectedMessage.status === 'Verildi' ? 'Bu mesaj zaten yanıtlandı' : ''}
              >
                <i className="ri-send-plane-line"></i>
                {selectedMessage.status === 'Verildi' ? 'Yanıtlandı' : 'Yanıtla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

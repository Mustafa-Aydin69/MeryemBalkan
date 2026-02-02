'use client';

import { Message } from './useMessages';

interface MessagesTableProps {
  messages: Message[];
  onViewMessage: (message: Message) => void;
  onDeleteMessage: (id: number) => void;
  loading?: boolean;
}

// Loading Skeleton Bileşeni
function MessageSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
          <div className="h-3 bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="flex-1 h-10 bg-gray-700 rounded-lg"></div>
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function MessagesTable({
  messages,
  onViewMessage,
  onDeleteMessage,
  loading = false,
}: MessagesTableProps) {
  // Loading durumu
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <i className="ri-mail-line text-4xl mb-3 block"></i>
        <p>Mesaj bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {messages.map((msg) => {
        const isReplied = msg.status === 'Verildi';
        
        return (
          <div
            key={msg.id}
            className={`group bg-gray-800 rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:shadow-black/20 ${
              isReplied 
                ? 'border-gray-700/50 opacity-80' 
                : 'border-gray-700 hover:border-indigo-500/50'
            }`}
          >
            {/* Üst Kısım - Gönderen ve Durum */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${
                    isReplied 
                      ? 'bg-gradient-to-br from-green-600 to-green-700' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {msg.name}
                    </h3>
                    <p className="text-xs text-gray-500">{msg.date}</p>
                  </div>
                </div>

                {/* Durum Badge */}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    isReplied
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {isReplied ? (
                    <>
                      <i className="ri-check-line mr-1"></i>
                      Yanıtlandı
                    </>
                  ) : (
                    <>
                      <i className="ri-time-line mr-1"></i>
                      Bekliyor
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Orta Kısım - İletişim ve Mesaj */}
            <div className="p-4 space-y-3">
              {/* İletişim Bilgileri */}
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={`mailto:${msg.email}`}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors truncate"
                >
                  <i className="ri-mail-line text-xs"></i>
                  <span className="truncate">{msg.email}</span>
                </a>
                <a
                  href={`tel:${msg.phone}`}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <i className="ri-phone-line text-xs"></i>
                  {msg.phone}
                </a>
              </div>

              {/* Hizmet Türü */}
              {msg.serviceType && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Hizmet:</span>
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300">
                    {msg.serviceType}
                  </span>
                </div>
              )}

              {/* Mesaj Önizleme */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-sm text-gray-300 line-clamp-3">
                  {msg.message}
                </p>
              </div>
            </div>

            {/* Alt Kısım - İşlem Butonları */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => onViewMessage(msg)}
                className={`flex-1 py-2.5 px-4 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isReplied
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <i className={isReplied ? 'ri-eye-line' : 'ri-reply-line'}></i>
                {isReplied ? 'Görüntüle' : 'Yanıtla'}
              </button>
              
              <button
                onClick={() => onDeleteMessage(msg.id)}
                className="py-2.5 px-3 text-sm rounded-lg bg-gray-700 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                title="Sil"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

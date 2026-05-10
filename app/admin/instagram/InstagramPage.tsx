'use client';

import { useRef, useState } from 'react';
import { useInstagram } from './useInstagram';

const isVideoPath = (path: string) => /\.(mp4|webm|mov|avi|mkv)$/i.test(path);
const isVideoFile = (file: File | null) => !!file?.type.startsWith('video/');

export default function InstagramPage() {
  const { posts, loading, uploading, uploadAndAdd, deletePost, movePost, getR2BaseUrl } = useInstagram();

  const [showModal, setShowModal] = useState(false);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalPreview, setModalPreview] = useState('');
  const [modalLink, setModalLink] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setModalFile(null);
    setModalPreview('');
    setModalLink('');
    setShowModal(true);
  };

  const handleFileSelect = (file: File) => {
    setModalFile(file);
    if (modalPreview) URL.revokeObjectURL(modalPreview);
    setModalPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleModalSave = async () => {
    if (!modalFile) return;
    await uploadAndAdd(modalFile, modalLink.trim() || undefined);
    setShowModal(false);
  };

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-light text-white tracking-wide">Instagram Feed</h2>
          <p className="text-xs text-gray-500 mt-1">Anasayfada gösterilecek gönderiler — maksimum 15 adet</p>
        </div>
        <button
          onClick={openModal}
          disabled={posts.length >= 15}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
        >
          <i className="ri-add-line" /> Gönderi Ekle
        </button>
      </div>

      {/* Iskelet / Boş / Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          onClick={openModal}
          className="border-2 border-dashed border-gray-700 rounded-xl py-20 flex flex-col items-center gap-3 text-gray-500 cursor-pointer hover:border-gray-500 transition-colors"
        >
          <i className="ri-instagram-line text-4xl" />
          <p className="text-sm">Gönderi eklemek için tıkla</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {posts.map((post, index) => {
            const src = getR2BaseUrl() + post.image_path;
            const isVid = isVideoPath(post.image_path);
            return (
              <div key={post.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800">
                {isVid ? (
                  <video
                    src={src}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                  />
                ) : (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => movePost(index, 'up')}
                      disabled={index === 0}
                      className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
                    >
                      <i className="ri-arrow-left-s-line" />
                    </button>
                    <button
                      onClick={() => movePost(index, 'down')}
                      disabled={index === posts.length - 1}
                      className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
                    >
                      <i className="ri-arrow-right-s-line" />
                    </button>
                  </div>
                  <button
                    onClick={() => deletePost(post.id, post.image_path)}
                    className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                  >
                    <i className="ri-delete-bin-line text-sm" />
                  </button>
                </div>

                {/* Sıra numarası */}
                <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] rounded px-1.5 py-0.5 font-mono">
                  {index + 1}
                </span>
                {/* Video rozeti */}
                {isVid && (
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 flex items-center gap-1">
                    <i className="ri-play-fill text-[9px]" /> VİDEO
                  </span>
                )}
                {/* Instagram link rozeti */}
                {post.instagram_link && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600/80 flex items-center justify-center">
                    <i className="ri-instagram-line text-white text-[10px]" />
                  </span>
                )}
              </div>
            );
          })}

          {posts.length < 15 && (
            <div
              onClick={openModal}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-500 flex flex-col items-center justify-center gap-2 text-gray-500 cursor-pointer transition-colors"
            >
              <i className="ri-add-line text-2xl" />
              <span className="text-xs">Ekle</span>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-light text-lg">Gönderi Ekle</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Dosya seçme */}
            {!modalPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-gray-400'
                } text-gray-400`}
              >
                <i className="ri-image-add-line text-3xl" />
                <p className="text-sm">Fotoğraf veya video seç</p>
                <p className="text-xs text-gray-600">Sürükle-bırak veya tıkla</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden h-48 bg-gray-700">
                {isVideoFile(modalFile) ? (
                  <video src={modalPreview} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                ) : (
                  <img src={modalPreview} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => { setModalFile(null); setModalPreview(''); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                >
                  <i className="ri-close-line text-sm" />
                </button>
                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs rounded px-2 py-0.5 truncate max-w-[80%]">
                  {modalFile?.name}
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
            />

            {/* Instagram linki */}
            <div className="mt-4">
              <label className="text-xs text-gray-400 block mb-1.5 tracking-wide">
                Instagram Gönderi Linki <span className="text-gray-600">(opsiyonel)</span>
              </label>
              <div className="relative">
                <i className="ri-instagram-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  type="url"
                  value={modalLink}
                  onChange={(e) => setModalLink(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5">Tıklandığında bu linke yönlendirilir. Boş bırakılırsa profil sayfasına gider.</p>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleModalSave}
                disabled={!modalFile || uploading}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><i className="ri-loader-4-line animate-spin" /> Yükleniyor…</>
                  : <><i className="ri-check-line" /> Kaydet</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

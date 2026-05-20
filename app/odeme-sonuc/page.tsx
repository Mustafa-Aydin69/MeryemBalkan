'use client';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Truck, MessageCircle, ArrowLeft, XCircle, AlertCircle, Home, CreditCard, HelpCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  color: string;
  size: string;
  date: string;
  image: string;
}

interface OrderSnapshot {
  items: OrderItem[];
  customerName: string;
  totalPrice: number;
  shippingCost: number;
  confirmedAt: string;
}

const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://cdn.meryembalkan.com.tr';
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || 'urunler';
  return `${base.replace(/\/$/, '')}/${bucket.replace(/^\//, '')}/`;
};

const getImageUrl = (image: string | undefined) => {
  if (!image) return `${getR2BaseUrl()}1760034813002_Meryem_Balkan_Logo.jpg`;
  if (image.startsWith('http')) return image;
  return `${getR2BaseUrl()}${image}`;
};

function SuccessPage({ snapshot, confirmedAt }: { snapshot: OrderSnapshot | null; confirmedAt: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const items = snapshot?.items ?? [];
  const totalPrice = snapshot?.totalPrice ?? 0;
  const shippingCost = snapshot?.shippingCost ?? 0;
  const subtotal = totalPrice - shippingCost;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-sans">
      <nav className="p-6 flex justify-center border-b border-gray-800/50">
        <h1 className="text-2xl font-serif tracking-[0.3em] uppercase italic">Meryem Balkan</h1>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Başarı mesajı */}
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4">Siparişiniz Alındı</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-lg mx-auto">
            {snapshot?.customerName
              ? `${snapshot.customerName}, rüyanıza giden yolda bizimle olduğunuz için teşekkürler.`
              : 'Rüyanıza giden yolda bizimle olduğunuz için teşekkürler.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Sipariş detay kartı */}
          <div className={`bg-[#11141b] rounded-3xl p-6 sm:p-8 border border-gray-800 transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
              <Package size={20} className="text-gray-400" /> Sipariş Detayları
            </h3>

            {items.length > 0 ? (
              <div className="space-y-5 mb-6">
                {items.map((item, idx) => (
                  <div key={item.id ?? idx} className={`flex gap-4 ${idx < items.length - 1 ? 'pb-5 border-b border-gray-800' : ''}`}>
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover object-top opacity-90"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-1 min-w-0">
                      <h4 className="text-base font-serif italic text-white leading-tight">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.color} / Beden {item.size}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-white font-medium mt-1">{Number(item.price).toLocaleString('tr-TR')} TL</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-6">Sipariş bilgileri yükleniyor...</p>
            )}

            {totalPrice > 0 && (
              <div className="space-y-2 border-t border-gray-800 pt-4 text-sm">
                {shippingCost > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ara toplam</span>
                      <span className="text-gray-300">{subtotal.toLocaleString('tr-TR')} TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kargo</span>
                      <span className="text-gray-300">{shippingCost.toLocaleString('tr-TR')} TL</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-medium text-base pt-1 border-t border-gray-800">
                  <span className="text-white">Toplam</span>
                  <span className="text-white">{totalPrice.toLocaleString('tr-TR')} TL</span>
                </div>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-gray-800 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ödeme Yöntemi</span>
                <span className="text-gray-200">Online - Iyzico</span>
              </div>
            </div>
          </div>

          {/* Sağ sütun */}
          <div className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            {/* Teslimat süreci */}
            <div className="bg-[#11141b] rounded-3xl p-6 sm:p-8 border border-gray-800">
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Truck size={20} className="text-gray-400" /> Teslimat Süreci
              </h3>

              <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-800">
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#11141b] z-10" />
                  <div>
                    <p className="font-medium text-white">Sipariş Onaylandı</p>
                    <p className="text-sm text-gray-500">{confirmedAt}</p>
                  </div>
                </div>
                <div className="relative pl-10 opacity-50">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-gray-700 rounded-full border-4 border-[#11141b] z-10" />
                  <div>
                    <p className="font-medium text-gray-300">Ölçü ve Hazırlık</p>
                    <p className="text-sm text-gray-500">Tahmini 1–3 gün içinde</p>
                  </div>
                </div>
                <div className="relative pl-10 opacity-50">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-gray-700 rounded-full border-4 border-[#11141b] z-10" />
                  <div>
                    <p className="font-medium text-gray-300">Kargoya Veriliş</p>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const earliest = items
                          .map(i => new Date(i.date))
                          .filter(d => !isNaN(d.getTime()))
                          .sort((a, b) => a.getTime() - b.getTime())[0];
                        if (!earliest) return 'Etkinlik tarihinizden 3 gün önce elinize ulaşacak şekilde kargoya verilecektir.';
                        const target = new Date(earliest);
                        target.setDate(target.getDate() - 3);
                        return `${target.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde elinizde olacak şekilde kargoya verilecektir.`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Destek kartı */}
            <div className="bg-gray-800/20 rounded-3xl p-5 border border-gray-800/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                  <MessageCircle className="text-gray-300 w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Bir sorunuz mu var?</p>
                  <p className="text-xs text-gray-500">Bizimle iletişime geçin.</p>
                </div>
              </div>
              <Link
                href="/iletisim"
                className="px-4 py-2 text-sm font-medium border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                Destek Al
              </Link>
            </div>

          </div>
        </div>

        {/* Alt navigasyon */}
        <div className="mt-16 sm:mt-20 text-center border-t border-gray-800 pt-10 sm:pt-12">
          <Link href="/portfolio" className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Koleksiyona Geri Dön
          </Link>
          <p className="mt-6 text-xs text-gray-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Meryem Balkan. Tüm hakları saklıdır.
          </p>
        </div>
      </main>
    </div>
  );
}

function FailedPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const now = new Date();
    const date = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    setTimestamp(`${date}, ${time}`);
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-sans">
      <nav className="p-6 flex justify-center border-b border-gray-800/50">
        <h1 className="text-2xl font-serif tracking-[0.3em] uppercase italic">Meryem Balkan</h1>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Hata mesajı */}
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 rounded-full mb-6">
            <XCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4">Ödeme Tamamlanamadı</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-lg mx-auto">
            Maalesef siparişinizi şu anda işleme alamıyoruz. Endişelenmeyin, sepetiniz hâlâ güvende.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link
              href="/"
              className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Home size={18} /> Anasayfaya Dön
            </Link>
            <Link
              href="/checkout"
              className="px-8 py-3 border border-gray-700 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-300"
            >
              <CreditCard size={18} /> Ödeme Yöntemini Değiştir
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Hata detay kartı */}
          <div className={`bg-[#11141b] rounded-3xl p-6 sm:p-8 border border-gray-800 transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-rose-400">
              <AlertCircle size={20} /> Sorun Ne Olabilir?
            </h3>

            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                Kartınız internet alışverişlerine kapalı olabilir.
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                Yetersiz bakiye veya limit aşımı yaşanmış olabilir.
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                3D Secure doğrulama aşamasında bir hata oluşmuş olabilir.
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="bg-black/20 p-4 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Hata Kodu</p>
                <p className="text-xs font-mono text-gray-500">ODEME_BASARISIZ</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-3 mb-1">Zaman Damgası</p>
                <p className="text-xs font-mono text-gray-500">{timestamp}</p>
              </div>
            </div>
          </div>

          {/* Yardım & Destek */}
          <div className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <div className="bg-[#11141b] rounded-3xl p-6 sm:p-8 border border-gray-800">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <HelpCircle size={20} className="text-gray-400" /> Yardıma mı ihtiyacınız var?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Sorun devam ederse ekibimiz size yardımcı olmaktan mutluluk duyacaktır.
              </p>

              <Link
                href="/iletisim"
                className="w-full py-4 bg-gray-800/50 hover:bg-gray-800 rounded-2xl border border-gray-700/50 flex items-center justify-center gap-3 transition-all"
              >
                <MessageCircle size={20} className="text-emerald-500" />
                <span className="text-sm font-medium">Destek Talebi Oluştur</span>
              </Link>
            </div>

            <div className="p-6 rounded-3xl border border-dashed border-gray-800 text-center">
              <p className="text-sm text-gray-500 italic">
                &ldquo;Her detay mükemmel olmalı, bu yüzden buradayız.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Alt navigasyon */}
        <div className="mt-16 sm:mt-20 text-center border-t border-gray-800 pt-10 sm:pt-12">
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Meryem Balkan Atelier. Tüm hakları saklıdır.
          </p>
        </div>
      </main>
    </div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('status') === 'success';
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null);
  const [confirmedAt, setConfirmedAt] = useState('');

  useEffect(() => {
    const now = new Date();
    const date = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    setConfirmedAt(`${date}, ${time}`);

    if (isSuccess) {
      try {
        const raw = localStorage.getItem('lastOrderSnapshot');
        if (raw) {
          setSnapshot(JSON.parse(raw));
          localStorage.removeItem('lastOrderSnapshot');
        }
        localStorage.removeItem('cartItems');
        localStorage.removeItem('pendingOrder');
        window.dispatchEvent(new Event('cartUpdated'));
      } catch {
        // localStorage erişilemiyorsa sessizce devam et
      }
    }
  }, [isSuccess]);

  if (!isSuccess) return <FailedPage />;
  return <SuccessPage snapshot={snapshot} confirmedAt={confirmedAt} />;
}

export default function OdemeSonucPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

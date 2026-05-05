'use client';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResultContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('status') === 'success';

  useEffect(() => {
    if (isSuccess) {
      try {
        localStorage.removeItem('cartItems');
        localStorage.removeItem('pendingOrder');
        window.dispatchEvent(new Event('cartUpdated'));
      } catch {
        // localStorage erişilemiyorsa sessizce devam et
      }
    }
  }, [isSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="text-center p-8 max-w-md w-full">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <i className="ri-check-line text-4xl text-green-600"></i>
            </div>
            <h1 className="text-2xl font-medium mb-4 text-black dark:text-white">
              Ödeme Başarılı
            </h1>
            <p className="mb-8 text-gray-600 dark:text-gray-300">
              Siparişiniz alındı. Sipariş detaylarınızı siparişlerim sayfasından takip edebilirsiniz.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Link
                href="/siparisler"
                className="px-8 py-3 rounded-full font-medium bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 transition-colors"
              >
                Siparişlerim
              </Link>
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Anasayfaya Dön
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <i className="ri-close-circle-line text-4xl text-red-600"></i>
            </div>
            <h1 className="text-2xl font-medium mb-4 text-black dark:text-white">
              Ödeme Başarısız
            </h1>
            <p className="mb-8 text-gray-600 dark:text-gray-300">
              Ödeme işlemi tamamlanamadı. Lütfen sepetinizi kontrol edip tekrar deneyin.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Link
                href="/checkout"
                className="px-8 py-3 rounded-full font-medium bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 transition-colors"
              >
                Tekrar Dene
              </Link>
              <Link
                href="/sepet"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Sepete Dön
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OdemeSonucPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

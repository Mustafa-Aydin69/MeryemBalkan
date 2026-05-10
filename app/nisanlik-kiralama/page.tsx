import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nişanlık Kiralama | Özel Tasarım Nişanlık Modelleri – Meryem Balkan",
  description:
    "Nişanlık kiralama için Meryem Balkan Tasarım Atölyesi; nişan töreniniz için romantik ve zarif nişanlık modelleri, prova ve kişiye özel düzenleme hizmeti.",
};

export default function NisanlikKiralamaPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <h1 className="text-2xl sm:text-4xl font-serif mb-4 sm:mb-6 text-gray-900">
          Nişanlık Kiralama
        </h1>

        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 leading-relaxed">
          Nişan töreniniz için hayalinizdeki nişanlığı aramaya başladınız mı?
          Meryem Balkan Tasarım Atölyesi, romantik ve zarif nişanlık modelleriyle
          o özel anı daha da güzel kılmak için burada.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Nişanlık Koleksiyonumuz
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Romantik ve feminen nişanlık tasarımları</li>
          <li>Modern minimalist modeller</li>
          <li>Renk ve tarz seçenekleri – beyaz, krem, pudra tonları</li>
          <li>Kişiye özel dikim imkanı</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Neden Meryem Balkan?
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Nişan töreninize özel danışmanlık hizmeti</li>
          <li>Prova ve beden düzenlemesi dahil</li>
          <li>Uygun nişanlık kiralama fiyatları</li>
          <li>Deneyimli tasarımcı eşliğinde kıyafet seçimi</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Nişanlık Kiralama Süreci
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Nişan tarihinizden en az birkaç hafta önce randevu alarak atölyemizi ziyaret edin.
          Birlikte en uygun modeli seçer, prova aşamasında nişanlığınızı o özel güne hazırlarız.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Hizmet Bölgeleri
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Atölyemiz Erzincan&apos;da hizmet vermektedir. Nişanlık kiralama ve
          özel tasarım danışmanlığı için bizimle iletişime geçin.
        </p>

      </div>
    </div>
  );
}

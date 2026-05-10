import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erzincan Nişanlık Kiralama | Özel Dikim Nişanlık – Meryem Balkan",
  description:
    "Erzincan'da nişanlık kiralama hizmeti sunan Meryem Balkan Tasarım Atölyesi, nişan töreniniz için özel tasarım ve zarif nişanlık modelleri sunar.",
};

export default function ErzincanNisanlikKiralamaPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <h1 className="text-2xl sm:text-4xl font-serif mb-4 sm:mb-6 text-gray-900">
          Erzincan Nişanlık Kiralama
        </h1>

        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 leading-relaxed">
          Erzincan&apos;da nişanlık kiralama hizmeti arıyorsanız, Meryem Balkan Tasarım Atölyesi
          nişan töreninizi unutulmaz kılacak özel tasarımlarıyla hizmetinizde.
          Romantik ve zarif nişanlık modellerimizle o özel anı taçlandırın.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Neden Meryem Balkan?
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Nişan töreninize özel kişiselleştirme seçenekleri</li>
          <li>Romantik, modern ve klasik nişanlık modelleri</li>
          <li>Prova ve beden düzenlemesi dahil hizmet</li>
          <li>Erzincan merkezde kolay ulaşım</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Nişanlık Kiralama Süreci
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Nişan tarihinizden en az birkaç hafta önce randevu alarak atölyemizi ziyaret edin.
          Size uygun modeli birlikte seçer, prova süreciyle nişanlığınızı o özel güne hazırlarız.
        </p>

      </div>
    </div>
  );
}

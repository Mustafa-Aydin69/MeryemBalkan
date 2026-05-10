import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erzincan Abiye Kiralama | Özel Tasarım Abiye – Meryem Balkan",
  description:
    "Erzincan'da abiye kiralama hizmeti sunan Meryem Balkan Tasarım Atölyesi, düğün, nişan ve özel geceler için zarif ve şık abiye seçenekleri sunar.",
};

export default function ErzincanAbiyeKiralamaPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <h1 className="text-2xl sm:text-4xl font-serif mb-4 sm:mb-6 text-gray-900">
          Erzincan Abiye Kiralama
        </h1>

        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 leading-relaxed">
          Erzincan&apos;da abiye kiralama hizmeti arıyorsanız, Meryem Balkan Tasarım Atölyesi
          düğün, nişan, kına gecesi ve özel davetler için zarif abiye seçenekleriyle yanınızda.
          Her bedene ve zevke uygun tasarımlarımızla özel gününüzde fark yaratın.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Neden Meryem Balkan?
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Geniş abiye koleksiyonu – klasikten moderne yüzlerce model</li>
          <li>Beden ölçüsüne göre tadilat imkanı</li>
          <li>Erzincan merkezde kolay ulaşım</li>
          <li>Uygun kiralama fiyatları, günlük ve etkinlik bazlı seçenekler</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Abiye Kiralama Süreci
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Randevu alarak atölyemizi ziyaret edebilir, etkinlik tarihinizi ve tercihlerinizi
          paylaşabilirsiniz. Prova ile bedeninize tam oturan abiyeniz etkinlik gününe hazır olur.
        </p>

      </div>
    </div>
  );
}

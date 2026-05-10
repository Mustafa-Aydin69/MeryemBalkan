import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abiye Kiralama | Özel Tasarım Abiye Modelleri – Meryem Balkan",
  description:
    "Abiye kiralama için Meryem Balkan Tasarım Atölyesi; düğün, nişan ve özel geceler için zarif abiye koleksiyonu, prova ve beden düzenlemesi dahil hizmet.",
};

export default function AbiyeKiralamaPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <h1 className="text-2xl sm:text-4xl font-serif mb-4 sm:mb-6 text-gray-900">
          Abiye Kiralama
        </h1>

        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 leading-relaxed">
          Özel bir gece için mükemmel abiyeyi kiralamak mı istiyorsunuz?
          Meryem Balkan Tasarım Atölyesi, düğün, nişan, kına gecesi ve davetler için
          zarif ve şık abiye seçenekleriyle her tarza uygun çözümler sunar.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Abiye Koleksiyonumuz
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Düğün ve nişan geceleri için uzun abiyeler</li>
          <li>Kokteyl ve davet için kısa şık modeller</li>
          <li>Kına gecesi için geleneksel ve modern tasarımlar</li>
          <li>After party için özgün tasarımlar</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Neden Meryem Balkan?
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Geniş koleksiyon, her tarza ve bedene uygun seçenekler</li>
          <li>Prova ve tadilat hizmeti dahil</li>
          <li>Uygun kiralama fiyatları</li>
          <li>Deneyimli ekip eşliğinde kıyafet seçimi</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Abiye Kiralama Süreci
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Etkinlik tarihinizden önce randevu alarak koleksiyonumuzu inceleyebilirsiniz.
          Seçtiğiniz abiye bedeninize göre düzenlenerek etkinlik gününe hazır hale getirilir.
        </p>

      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gelinlik Kiralama | Özel Dikim Gelinlik Tasarımları – Meryem Balkan",
  description:
    "Gelinlik kiralama için Meryem Balkan Tasarım Atölyesi; özel dikim, kişiye özel tasarım ve modern gelinlik modelleriyle düğün gününüzü unutulmaz kılar.",
};

export default function GelinlikKiralamaPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <h1 className="text-2xl sm:text-4xl font-serif mb-4 sm:mb-6 text-gray-900">
          Gelinlik Kiralama
        </h1>

        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 leading-relaxed">
          Düğün gününüz için hayalinizdeki gelinliği kiralamak mı istiyorsunuz?
          Meryem Balkan Tasarım Atölyesi, özel dikim seçenekleri ve geniş gelinlik
          koleksiyonuyla sizi en güzel halinize kavuşturmak için burada.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Neden Meryem Balkan?
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Özel dikim ve kişiye özel tasarım imkanı</li>
          <li>Modern, klasik ve romantik gelinlik modelleri</li>
          <li>Prova ve beden düzenlemesi dahil hizmet</li>
          <li>Uygun kiralama fiyatları</li>
          <li>Deneyimli tasarımcı eşliğinde kıyafet seçimi</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Gelinlik Kiralama Süreci
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Düğün tarihinizden en az birkaç hafta önce randevu alarak koleksiyonumuzu inceleyebilirsiniz.
          Prova aşamasında gelinliğiniz bedeninize göre düzenlenir ve düğün gününe hazır hale getirilir.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Hizmet Bölgeleri
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Atölyemiz Erzincan&apos;da hizmet vermektedir. Gelinlik kiralama, özel dikim ve
          tasarım danışmanlığı için bizimle iletişime geçin.
        </p>

      </div>
    </div>
  );
}

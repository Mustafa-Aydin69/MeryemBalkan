import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erzincan Gelinlik Kiralama | Özel Dikim Gelinlik – Meryem Balkan",
  description:
    "Erzincan'da gelinlik kiralama hizmeti sunan Meryem Balkan Tasarım Atölyesi, özel dikim ve kişiye özel gelinlik tasarımlarıyla düğün gününüzü unutulmaz kılar.",
};

export default function GelinlikPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <h1 className="text-2xl sm:text-4xl font-serif mb-4 sm:mb-6 text-gray-900">
          Erzincan Gelinlik Kiralama
        </h1>

        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 leading-relaxed">
          Erzincan&apos;da gelinlik kiralama hizmeti arıyorsanız,
          Meryem Balkan Tasarım Atölyesi özel dikim ve zarif tasarımlarıyla
          düğün gününüzde hayalinizdeki görünümü gerçeğe dönüştürür.
        </p>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Neden Meryem Balkan?
        </h2>

        <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          <li>Kişiye özel dikim seçenekleri</li>
          <li>Modern ve klasik tasarım alternatifleri</li>
          <li>Erzincan merkezde kolay ulaşım</li>
          <li>Prova ve ölçüye özel düzenleme imkanı</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-serif mt-8 sm:mt-10 mb-3 sm:mb-4 text-gray-900">
          Gelinlik Kiralama Süreci
        </h2>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Randevu alarak atölyemizi ziyaret edebilir,
          size uygun modeli seçebilir ve prova süreciyle
          gelinliğinizi düğün gününe hazır hale getirebilirsiniz.
        </p>

      </div>
    </div>
  );
}

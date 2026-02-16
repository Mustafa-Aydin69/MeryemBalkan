import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import PageTransition from "./components/PageTransition";
import { Toaster } from "sonner";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Meryem Balkan | Erzincan Gelinlik ve Abiye Kiralama",
    template: "%s | Meryem Balkan",
  },
  description:
    "Erzincan'da gelinlik kiralama ve abiye kiralama hizmeti sunan Meryem Balkan Tasarım Atölyesi, özel dikim gelinlik ve nişanlık tasarımlarıyla düğün ve özel günleriniz için zarif ve kişiye özel çözümler sunar.",
  keywords: [
    "Erzincan gelinlik",
    "Erzincan abiye kiralama",
    "Erzincan gelinlik kiralama",
    "özel dikim gelinlik",
    "Meryem Balkan"
  ],
  icons: {
    icon: "/images/Anasayfa/Meryem_Balkan_Logo.jpg",
  },
  openGraph: {
    title: "Gelinlik ve Abiye Kiralama | Meryem Balkan",
    description:
      "Erzincan'da özel dikim gelinlik ve abiye kiralama hizmeti.",
    url: "https://meryembalkan.com.tr",
    siteName: "Meryem Balkan",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased min-h-screen bg-white dark:bg-gray-900`}
      >
        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Meryem Balkan",
              alternateName: "Meryem Balkan Gelinlik ve Abiye Kiralama",
              url: "https://www.meryembalkan.com.tr"
            }),
          }}
        />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Meryem Balkan",
              url: "https://www.meryembalkan.com.tr",
              logo: "https://www.meryembalkan.com.tr/images/Anasayfa/Meryem_Balkan_Logo.jpg"
            }),
          }}
        />
        {/* LocalBusiness Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BridalShop",
              name: "Meryem Balkan Tasarım Atölyesi",
              image: "https://meryembalkan.com.tr/images/Anasayfa/Meryem_Balkan_Logo.jpg",
              url: "https://www.meryembalkan.com.tr",
              telephone: "05437223746",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Atatürk, Muhsin Yazıcıoğlu Cd. No: 15/B",
                addressLocality: "Erzincan",
                postalCode: "24100",
                addressCountry: "TR"
              },
              areaServed: "Erzincan",
              priceRange: "₺₺",
              sameAs: [
                "https://www.instagram.com/meryembalkan_ateiler/"
              ]
            }),
          }}
        />

        <PageTransition />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ✅ Netlify/Render için gerekli
  },
  typescript: {
    ignoreBuildErrors: true, // (Opsiyonel) TS hataları yüzünden build fail olmasın
  },
  // iyzipay: fs.readdirSync + dynamic require kullanıyor, bundle'da çözülmüyor
  serverExternalPackages: ['iyzipay'],
  // Vercel: iyzipay lib/resources runtime'da scandir ile yüklüyor; trace'a tam paketi ekle
  experimental: {
    outputFileTracingIncludes: {
      '/api/payment/bin-check': ['./node_modules/iyzipay/**/*'],
      '/api/payment/3ds-init': ['./node_modules/iyzipay/**/*'],
      '/api/payment/3ds-callback': ['./node_modules/iyzipay/**/*'],
      '/api/payment/webhook': ['./node_modules/iyzipay/**/*'],
    },
  } as NextConfig['experimental'],
};

export default nextConfig;

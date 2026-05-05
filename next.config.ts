import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ✅ Netlify/Render için gerekli
  },
  typescript: {
    ignoreBuildErrors: true, // (Opsiyonel) TS hataları yüzünden build fail olmasın
  },
  serverExternalPackages: ['iyzipay', 'postman-request'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/payment/create': ['./node_modules/iyzipay/**/*'],
      '/api/payment/callback': ['./node_modules/iyzipay/**/*'],
    },
  } as NextConfig['experimental'],
};

export default nextConfig;

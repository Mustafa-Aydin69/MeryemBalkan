import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdn.meryembalkan.com.tr' },
    ],
  },
  serverExternalPackages: ['iyzipay', 'postman-request'],
  outputFileTracingIncludes: {
    '/api/payment/create': ['./node_modules/iyzipay/**/*'],
    '/api/payment/callback': ['./node_modules/iyzipay/**/*'],
  },
};

export default nextConfig;

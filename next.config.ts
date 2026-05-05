import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['iyzipay', 'postman-request'],
  outputFileTracingIncludes: {
    '/api/payment/create': ['./node_modules/iyzipay/**/*'],
    '/api/payment/callback': ['./node_modules/iyzipay/**/*'],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdn.meryembalkan.com.tr' },
    ],
  },
  serverExternalPackages: ['iyzipay', 'postman-request'],
  outputFileTracingIncludes: {
    '/api/payment/create':   ['./node_modules/iyzipay/**/*', './node_modules/postman-request/**/*'],
    '/api/payment/callback': ['./node_modules/iyzipay/**/*', './node_modules/postman-request/**/*'],
    '/api/payment/webhook':  ['./node_modules/postman-request/**/*'],
    '/api/payment/verify':   ['./node_modules/postman-request/**/*'],
    '/api/check-conflict':   ['./node_modules/postman-request/**/*'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
              "img-src 'self' data: blob: https://cdn.meryembalkan.com.tr https://www.meryembalkan.com.tr https://*.supabase.co",
              "media-src 'self' https://cdn.meryembalkan.com.tr",
              "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
              "frame-src https://www.google.com https://maps.google.com",
              "connect-src 'self' https://*.supabase.co https://fonts.googleapis.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

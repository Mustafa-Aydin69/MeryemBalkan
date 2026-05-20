import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdn.meryembalkan.com.tr' },
    ],
  },
  serverExternalPackages: ['iyzipay', 'postman-request'],
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/iyzipay/**/*',
      './node_modules/postman-request/**/*',
      './node_modules/extend/**/*',
      './node_modules/aws-sign2/**/*',
      './node_modules/aws4/**/*',
      './node_modules/caseless/**/*',
      './node_modules/combined-stream/**/*',
      './node_modules/forever-agent/**/*',
      './node_modules/form-data/**/*',
      './node_modules/http-signature/**/*',
      './node_modules/is-typedarray/**/*',
      './node_modules/isstream/**/*',
      './node_modules/json-stringify-safe/**/*',
      './node_modules/mime-types/**/*',
      './node_modules/mime-db/**/*',
      './node_modules/oauth-sign/**/*',
      './node_modules/performance-now/**/*',
      './node_modules/qs/**/*',
      './node_modules/safe-buffer/**/*',
      './node_modules/tunnel-agent/**/*',
      './node_modules/asynckit/**/*',
      './node_modules/delayed-stream/**/*',
      './node_modules/sshpk/**/*',
      './node_modules/assert-plus/**/*',
      './node_modules/dashdash/**/*',
      './node_modules/jsprim/**/*',
      './node_modules/tweetnacl/**/*',
      './node_modules/jsbn/**/*',
      './node_modules/ecc-jsbn/**/*',
      './node_modules/psl/**/*',
      './node_modules/punycode/**/*',
      './node_modules/@postman/**/*',
      './node_modules/url-parse/**/*',
      './node_modules/universalify/**/*',
      './node_modules/stream-length/**/*',
    ],
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

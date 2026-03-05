import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  serverExternalPackages: ["iyzipay"],

  turbopack: {}, // ← bunu ekle
};

export default nextConfig;
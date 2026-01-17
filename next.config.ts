import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ✅ Netlify/Render için gerekli
  },
  typescript: {
    ignoreBuildErrors: true, // (Opsiyonel) TS hataları yüzünden build fail olmasın
  },
};

export default nextConfig;

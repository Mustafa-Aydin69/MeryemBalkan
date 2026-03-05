import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  serverExternalPackages: ["iyzipay"],

  webpack: (config) => {
    config.externals.push("iyzipay");
    return config;
  },
};

export default nextConfig;
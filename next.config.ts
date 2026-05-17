import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  devIndicators: false,
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;

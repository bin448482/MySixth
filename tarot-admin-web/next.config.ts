import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['antd'],
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8001',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;

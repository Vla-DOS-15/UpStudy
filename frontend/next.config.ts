import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // proxy to backend via HTTP to avoid cert errors
        destination: 'http://localhost:5294/api/:path*', 
      },
      {
        source: '/chatHub/:path*',
        destination: 'http://localhost:5294/chatHub/:path*',
      }
    ];
  },
};

export default nextConfig;

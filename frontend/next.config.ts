import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Product photos are served from /public; uploaded files come from the API (rendered unoptimized).
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.vercel.app', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'img.vietqr.io' },
    ],
  },
};

export default nextConfig;

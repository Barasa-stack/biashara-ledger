import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['bcryptjs', 'puppeteer'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;

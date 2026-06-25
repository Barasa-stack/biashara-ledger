import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'puppeteer'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default nextConfig;

import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: true,
    appDir: true,
  },
  transpilePackages: [
    '@trpc',
  ],
  webpack(config) {
    config.resolve.alias['@validators'] = path.resolve(__dirname, '../../packages/validators');
    return config;
  },
};

export default nextConfig;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  transpilePackages: [
    '@trpc',
  ],
  webpack(config) {
    config.resolve.alias['@validators'] = path.resolve(__dirname, '../../packages/validators');
    return config;
  },
};

export default nextConfig;
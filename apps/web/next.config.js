const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
  images: {
    domains: [
      "maps.googleapis.com",
      "lh3.googleusercontent.com",
      "places.googleapis.com",
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/ui': path.resolve(__dirname, '../../packages/ui/src'),
    };
    return config;
  },
};

module.exports = nextConfig;
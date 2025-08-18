const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    
    // Debug logging
    console.log('Webpack aliases being set:', {
      '@': path.resolve(__dirname, 'src'),
      '@/ui': path.resolve(__dirname, '../../packages/ui/src'),
    });
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/ui': path.resolve(__dirname, '../../packages/ui/src'),
    };
    
    // More specific aliases for lib files
    config.resolve.alias['@/lib'] = path.resolve(__dirname, 'src/lib');
    config.resolve.alias['@/components'] = path.resolve(__dirname, 'src/components');
    
    return config;
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Framer doesn't use strict mode for performance reasons
  reactStrictMode: false,
  
  // SWC minification for better performance
  swcMinify: true,
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // Image optimization with sharp (Framer's approach)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 810, 1200, 1920],
    imageSizes: [512, 1024, 2048, 4096],
  },
  
  // Webpack optimizations for reduced bundle size
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.vendor = {
        test: /[\\/]node_modules[\\/]/,
        chunks: 'all',
        priority: 1,
        reuseExistingChunk: true,
      }
    }
    
    return config
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['sharp'],
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
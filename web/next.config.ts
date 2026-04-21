import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3845',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net unpkg.com esm.sh",
              "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net fonts.googleapis.com",
              "img-src 'self' data: blob: images.unsplash.com cdn.jsdelivr.net github.com localhost:3845",
              "font-src 'self' fonts.gstatic.com",
              "connect-src 'self' api.groq.com api.mistral.ai *.googleapis.com *.firebaseio.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/expertise',
        destination: '/work',
        permanent: true,
      },
      {
        source: '/ur/:path*',
        destination: '/:path*',
        permanent: true,
      },
      {
        source: '/de/:path*',
        destination: '/:path*',
        permanent: true,
      },
      {
        source: '/work/narkins-2025',
        destination: '/work/narkins-2024',
        permanent: true,
      },
      {
        source: '/work/cultured-legacy-2025',
        destination: '/work/cultured-legacy-2024',
        permanent: true,
      },
    ]
  },
}

export default nextConfig

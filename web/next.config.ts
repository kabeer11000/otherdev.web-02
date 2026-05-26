import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow cross-origin access from mobile/desktop devices on the same network during dev
  allowedDevOrigins: ['192.168.0.95', '192.168.0.100', '192.168.0.101', '192.168.0.102'],
  // Disable TypeScript type checking during build (CI runs tsc --noEmit separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: {
    compilationMode: 'annotation',
  },
  cacheComponents: false,
  // Mark server-only packages so they don't leak into client bundles
  serverExternalPackages: ['firebase-admin', 'googleapis', 'nodemailer', 'pdfjs-dist'],
  // Optimize heavy package imports for faster bundling
  experimental: {
    optimizePackageImports: ['lucide-react', 'clsx', 'date-fns', 'embla-carousel-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.otherdev.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
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
      {
        protocol: 'https',
        hostname: 'cdn.shadcnstudio.com',
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net unpkg.com esm.sh https://mcp.figma.com",
              "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net fonts.googleapis.com",
              "img-src 'self' data: blob: images.unsplash.com cdn.jsdelivr.net github.com localhost:3845 cdn.shadcnstudio.com media.otherdev.com pub-bb3787984f924b288b4158546c9171fb.r2.dev",
              "font-src 'self' fonts.gstatic.com",
              "connect-src 'self' api.groq.com api.mistral.ai *.googleapis.com *.firebaseio.com https://mcp.figma.com",
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

export default withPayload(nextConfig)

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3845",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/expertise",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/ur/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/de/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/work/narkins-2025",
        destination: "/work/narkins-2024",
        permanent: true,
      },
      {
        source: "/work/cultured-legacy-2025",
        destination: "/work/cultured-legacy-2024",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

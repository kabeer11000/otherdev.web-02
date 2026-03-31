import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/providers";
import { TenantProvider } from "@/lib/tenant-context";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import localFont from "next/font/local";

import { GoogleAnalytics } from "@next/third-parties/google";

// Lazy load ChatWidget - client-only component
const ChatWidget = dynamic(() => import("@/components/chat-widget").then((mod) => mod.ChatWidget), {
  loading: () => null,
});

const twkLausanne = localFont({
  src: [
    {
      path: "../../public/fonts/TWKLausanne/TWKLausanne-200 (1).woff2",
      weight: "200",
    },
    {
      path: "../../public/fonts/TWKLausanne/TWKLausanne-300-1.woff2",
      weight: "300",
    },
    {
      path: "../../public/fonts/TWKLausanne/TWKLausanne-400.woff2",
      weight: "400",
    },
  ],
  variable: "--twk-lausanne",
  display: "swap",
});

const queensCompressed = localFont({
  src: [
    {
      path: "../../public/fonts/QueensCompressed/QueensCompressed_W-Thin.woff2",
      weight: "100",
    },
    {
      path: "../../public/fonts/QueensCompressed/QueensCompressed_W-Light.woff2",
      weight: "300",
    },
  ],
  variable: "--queens-compressed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://otherdev.com"),
  title: "Other Dev",
  description: "Digital platforms for pioneering creatives",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${twkLausanne.variable} ${queensCompressed.variable}`}
      style={{ colorScheme: "light dark" }}
    >
      <head>
        {/* Favicon - Multiple sizes for optimal display */}
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="icon" href="/favicon-144x144.png" sizes="144x144" type="image/png" />
        <link rel="icon" href="/favicon-192x192.png" sizes="192x192" type="image/png" />
        {/* View Transitions API Support */}
        <meta name="view-transition" content="same-origin" />
      </head>
      <body className="antialiased bg-background">
        <TenantProvider initialDomain="otherdev.com">
          <TRPCProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <ChatWidget />
          </TRPCProvider>
        </TenantProvider>
        <GoogleAnalytics gaId="G-YXVG798Y18" />
      </body>
    </html>
  );
}

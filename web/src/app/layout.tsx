import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/providers";
import { TenantProvider } from "@/lib/tenant-context";
import { ChatWidget } from "@/components/chat-widget";
import { Suspense } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://otherdev.com"),
  title: "OtherDev",
  description: "Digital platforms for pioneering creatives",
  openGraph: {
    title: "OtherDev",
    description: "Digital platforms for pioneering creatives",
    type: "website",
    url: "https://otherdev.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OtherDev Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OtherDev",
    description: "Digital platforms for pioneering creatives",
    images: ["/og-image.jpg"],
  },
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
    <html lang="en" style={{ colorScheme: "light dark" }}>
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YXVG798Y18"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YXVG798Y18');
          `}
        </Script>
        <TenantProvider>
          <TRPCProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <ChatWidget />
          </TRPCProvider>
        </TenantProvider>
      </body>
    </html>
  );
}

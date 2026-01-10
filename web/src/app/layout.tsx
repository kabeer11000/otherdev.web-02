import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/providers";
import { TenantProvider } from "@/lib/tenant-context";
import { ChatWidget } from "@/components/chat-widget";
import { Suspense } from "react";

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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
        {/* View Transitions API Support */}
        <meta name="view-transition" content="same-origin" />
      </head>
      <body className="antialiased bg-background">
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

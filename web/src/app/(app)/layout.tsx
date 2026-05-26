import type { Metadata, Viewport } from 'next'
import './globals.css'

import { GoogleAnalytics } from '@next/third-parties/google'
import dynamic from 'next/dynamic'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { QueryProvider } from '@/components/providers'
import { SITE_URL } from '@/lib/constants'
import { buildSocialMetadata, DEFAULT_SITE_DESCRIPTION } from '@/lib/metadata'
import { TenantProvider } from '@/lib/tenant-context'

// Lazy load ChatWidget - client-only component
const ChatWidget = dynamic(() => import('@/components/chat-widget').then(mod => mod.ChatWidget), {
  loading: () => null,
})

// Lazy load AgentWidget - ElevenLabs sales agent widget
const AgentWidget = dynamic(
  () => import('@/components/agent-widget').then(mod => mod.AgentWidget),
  {
    loading: () => null,
  }
)

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--fraunces',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Other Dev',
  description: DEFAULT_SITE_DESCRIPTION,
  ...buildSocialMetadata({
    title: 'Other Dev',
    description: DEFAULT_SITE_DESCRIPTION,
    path: '/',
    imagePath: '/og_image.png',
    imageAlt: 'Other Dev - Digital Platforms for Pioneering Creatives',
    includeCanonical: false,
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        {/* R2 preconnect — saves DNS+TCP+TLS per image */}
        <link
          rel="preconnect"
          href="https://pub-bb3787984f924b288b4158546c9171fb.r2.dev"
          crossOrigin="anonymous"
        />
        {/* Favicon - Multiple sizes for optimal display */}
        <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
        <link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
          type="image/png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        {/* View Transitions API Support */}
        <meta name="view-transition" content="same-origin" />
      </head>
      <body className="antialiased bg-background">
        <TenantProvider initialDomain="otherdev.com">
          <QueryProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <ChatWidget />
            {/* AgentWidget - ElevenLabs sales agent widget
            <AgentWidget
              agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID}
              avatarUrl="/otherdev-chat-logo-32.webp"
            />
            */}
          </QueryProvider>
        </TenantProvider>
        <GoogleAnalytics gaId="G-YXVG798Y18" />
      </body>
    </html>
  )
}

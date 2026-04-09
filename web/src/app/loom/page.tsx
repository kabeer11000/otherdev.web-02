import type { Metadata } from 'next'
import { LoomPageClient } from '@/components/otherdev-loom-thread'
import { buildSocialMetadata } from '@/lib/metadata'

export const metadata: Metadata = {
  title: "Loom - Chat with Other Dev's AI Assistant",
  description:
    "Chat with Loom, Other Dev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
  keywords: [
    'Other Dev Loom',
    'AI chat',
    'Other Dev assistant',
    'project information',
    'web development chat',
    'Other Dev',
  ],
  ...buildSocialMetadata({
    title: "Loom - Chat with Other Dev's AI Assistant",
    description:
      "Chat with Loom, Other Dev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
    path: '/loom',
    imagePath: '/otherdev-chat-logo.svg',
    imageAlt: 'Other Dev Loom',
  }),
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * Server Component wrapper for the Loom page.
 * Keeps the page boundary as a Server Component for optimal streaming,
 * SEO, and the ability to add server-side data fetching in the future.
 */
export default function LoomPage() {
  return <LoomPageClient />
}

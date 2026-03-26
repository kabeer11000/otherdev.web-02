import type { Metadata } from "next";
import { LoomPageClient } from "@/components/otherdev-loom-thread";

export const metadata: Metadata = {
  title: "Loom - Chat with Other Dev's AI Assistant",
  description:
    "Chat with Loom, Other Dev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
  keywords: [
    "Other Dev Loom",
    "AI chat",
    "Other Dev assistant",
    "project information",
    "web development chat",
    "Other Dev",
  ],
  openGraph: {
    title: "Other Dev Loom",
    description:
      "Chat with Loom, Other Dev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
    type: "website",
    url: "https://otherdev.com/loom",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Other Dev Loom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Other Dev Loom",
    description:
      "Chat with Loom, Other Dev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default LoomPageClient;

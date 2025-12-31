import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loom | OtherDev",
  description:
    "Chat with Loom, OtherDev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
  keywords: [
    "OtherDev Loom",
    "AI chat",
    "OtherDev assistant",
    "project information",
    "web development chat",
    "OtherDev",
  ],
  openGraph: {
    title: "OtherDev Loom",
    description:
      "Chat with Loom, OtherDev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
    type: "website",
    url: "https://otherdev.com/loom",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OtherDev Loom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OtherDev Loom",
    description: "Chat with Loom, OtherDev's AI assistant. Get instant answers about our projects, services, and technical expertise.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

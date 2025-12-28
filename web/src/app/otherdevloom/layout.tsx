import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OtherDev Loom | AI Chat Assistant",
  description:
    "Chat with OtherDev Loom, our intelligent AI assistant. Get instant answers about our projects, services, technologies, and expertise powered by our knowledge base.",
  keywords: [
    "OtherDev Loom",
    "AI chat",
    "OtherDev assistant",
    "project information",
    "web development chat",
    "OtherDev",
  ],
  openGraph: {
    title: "OtherDev Loom | AI Chat Assistant",
    description:
      "Chat with OtherDev Loom to learn about our projects, services, and expertise.",
    type: "website",
    url: "https://otherdev.com/otherdevloom",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OtherDev Loom AI Chat Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OtherDev Loom | AI Chat Assistant",
    description: "Intelligent assistant for project and service inquiries",
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

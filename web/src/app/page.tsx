import type { Metadata } from "next";
import Script from "next/script";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ProjectCard } from "@/components/project-card";
import {
  playlistsAndImages,
  type PlaylistOrImage,
} from "@/lib/playlists-and-images";
import { projects } from "@/lib/projects";
import { shuffle } from "@/lib/utils";

export const metadata: Metadata = {
  title: "OtherDev",
  description:
    "OtherDev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi, specializing in fashion and design fields.",
  keywords: [
    "web development",
    "web design",
    "digital platforms",
    "fashion design",
    "creative studio",
    "Karachi",
    "OtherDev",
  ],
  openGraph: {
    title: "OtherDev - Digital Platforms for Pioneering Creatives",
    description:
      "OtherDev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi.",
    type: "website",
    url: "https://otherdev.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OtherDev - Digital Platforms for Pioneering Creatives",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OtherDev - Digital Platforms for Pioneering Creatives",
    description:
      "Full-service web development and design studio for pioneering creatives",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Create additional cards for projects with multiple images
const projectsWithExtraImages = projects.flatMap((project) => {
  const cards = [project];

  // If project has media array with 2+ images, add second image as separate card
  if (project.media && project.media.length >= 2) {
    cards.push({
      ...project,
      id: `${project.id}-media-2`,
      image: project.media[1],
    });
  }

  return cards;
});

const data = shuffle([...playlistsAndImages, ...projectsWithExtraImages]);

// JSON-LD Structured Data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OtherDev",
  url: "https://otherdev.com",
  logo: "https://otherdev.com/TheOtherDevLogo.svg",
  description: "Digital platforms for pioneering creatives",
  sameAs: ["https://otherdev.com"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Karachi",
    addressCountry: "Pakistan",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <div className="grid grid-cols-12 mb-8">
          <p className="text-[#686868] text-[11px] leading-[14px] font-normal col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6">
            otherdev produces digital platforms for pioneering creatives.
            <br />
            Based in Karachi City, we are a full-service web development and
            design studio specializing in the fashion and design fields.
          </p>
        </div>
        <div className="mt-[30px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
          {data.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              slug={project?.slug ?? project.url}
              image={project.image}
              description={project.description}
              variant={project?.isPlaylistOrImage ? "broll" : "home"}
            />
          ))}
        </div>
        <Footer />
      </main>
    </div>
  );
}

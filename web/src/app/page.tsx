import type { Metadata } from "next";
import { connection } from "next/server";
import Script from "next/script";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ProjectCard } from "@/components/project-card";
import { playlistsAndImages } from "@/lib/playlists-and-images";
import { projects } from "@/lib/projects";
import { shuffle } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Other Dev",
  description:
    "Other Dev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi, specializing in fashion and design fields.",
  keywords: [
    "web development",
    "web design",
    "digital platforms",
    "fashion design",
    "creative studio",
    "Karachi",
    "Other Dev",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://otherdev.com",
  },
  openGraph: {
    title: "Other Dev",
    description:
      "Other Dev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi, specializing in fashion and design fields.",
    type: "website",
    url: "https://otherdev.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Other Dev",
    description:
      "Other Dev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi, specializing in fashion and design fields.",
  },
};

// JSON-LD Structured Data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Other Dev",
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

export default async function Home() {
  await connection();

  const projectsWithExtraImages = projects.flatMap((project) => {
    const cards = [project];
    if (project.media && project.media.length >= 2) {
      cards.push({ ...project, id: `${project.id}-media-2`, image: project.media[1] });
    }
    return cards;
  });

  const data = shuffle([...playlistsAndImages, ...projectsWithExtraImages]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <div className="grid grid-cols-12 mb-8">
          <p className="text-[#686868] text-[11px] leading-[14px] font-normal col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
            otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we are a full-service web development and design studio specializing in the fashion and design fields.
          </p>
        </div>
        <div className="mt-[30px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
          {data.map((project, index) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              slug={"slug" in project ? project.slug : (project.url ?? "")}
              image={project.image}
              description={project.description}
              variant={"isPlaylistOrImage" in project ? "broll" : "home"}
              priority={index < 8}
            />
          ))}
        </div>
        <Footer />
      </main>
    </div>
  );
}

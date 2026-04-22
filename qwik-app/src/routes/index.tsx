import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { ProjectCard } from "~/components/project-card";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
import { workProjects } from "~/data/projects";
import { playlistsAndImages } from "~/data/playlists-and-images";
import { shuffle } from "~/lib/utils";

// Extended project type that includes media array
interface ExtendedProject {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  image: string;
  url?: string;
  media?: string[];
  year?: number;
  downloadUrl?: string;
  isPlaylistOrImage?: boolean;
}

// Create projects with extra media[1] images as additional cards (using workProjects which has media arrays)
const projectsWithExtraImages: ExtendedProject[] = workProjects.flatMap((project) => {
  const cards: ExtendedProject[] = [{ ...project, slug: project.slug }];
  if (project.media && project.media.length >= 2) {
    cards.push({
      ...project,
      id: `${project.id}-media-2`,
      slug: project.slug,
      image: project.media[1],
    });
  }
  return cards;
});

// Mix playlists/images with projects and shuffle
const mixedData: (ExtendedProject | typeof playlistsAndImages[number])[] = shuffle([
  ...playlistsAndImages,
  ...projectsWithExtraImages,
]);

export default component$(() => {
  return (
    <main class="min-h-screen bg-white container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
      <Navigation />

      {/* Hero Paragraph */}
      <div class="grid grid-cols-12 mb-8">
        <p class="text-[#686868] text-[11px] leading-[14px] font-normal col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
          otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we are a full-service web development and design studio specializing in the fashion and design fields.
        </p>
      </div>

      {/* Project Grid */}
      <div class="mt-[30px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
        {mixedData.map((item, index) => (
          <ProjectCard
            key={'id' in item ? item.id : 'isPlaylistOrImage' in item ? item.id : item.slug}
            title={item.title}
            slug={'slug' in item ? item.slug : undefined}
            image={item.image}
            variant={'isPlaylistOrImage' in item ? 'broll' : 'home'}
            priority={index < 8}
          />
        ))}
      </div>

      <Footer />
      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = {
  title: "otherdev | Digital Platforms for Pioneering Creatives",
  meta: [
    {
      name: "description",
      content: "otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we are a full-service web development and design studio specializing in the fashion and design fields.",
    },
    {
      name: "keywords",
      content: "web development, web design, digital platforms, fashion design, creative studio, Karachi, Other Dev",
    },
    {
      property: "og:title",
      content: "otherdev | Digital Platforms for Pioneering Creatives",
    },
    {
      property: "og:description",
      content: "otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we are a full-service web development and design studio specializing in the fashion and design fields.",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
  ],
};
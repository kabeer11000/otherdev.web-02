import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Hero } from "~/components/hero";
import { ProjectCard } from "~/components/project-card";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";

const projects = [
  { title: "Adina Household", href: "/work/adina-household" },
  { title: "Kiswa Noire", href: "/work/kiswa-noire" },
  { title: "MNO Studio", href: "/work/mno-studio" },
  { title: "PQR Architects", href: "/work/pqr-architects" },
  { title: "STU Collective", href: "/work/stu-collective" },
  { title: "VWX Gallery", href: "/work/vwx-gallery" },
  { title: "YZA Brand", href: "/work/yza-brand" },
  { title: "BCD Fashion", href: "/work/bcd-fashion" },
];

export default component$(() => {
  return (
    <main class="min-h-screen bg-white">
      <Navigation />
      <Hero />

      {/* Project Grid */}
      <section class="px-4 py-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.href}
              title={project.title}
              href={project.href}
            />
          ))}
        </div>
      </section>

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
      content:
        "otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we are a full-service web development and design studio specializing in the fashion and design fields.",
    },
  ],
};

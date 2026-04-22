import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { ProjectCard } from "~/components/project-card";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
import { homeProjects } from "~/data/projects";

export default component$(() => {
  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      {/* Hero Paragraph */}
      <section class="px-3 py-6">
        <p class="font-[var(--twk-lausanne)] text-[11px] text-stone-400 leading-[14px] max-w-2xl">
          otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we are a full-service web development and design studio specializing in the fashion and design fields.
        </p>
      </section>

      {/* Project Grid */}
      <section class="px-3 pb-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-[11px]">
          {homeProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              title={project.title}
              href={`/work/${project.slug}`}
              image={project.image}
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
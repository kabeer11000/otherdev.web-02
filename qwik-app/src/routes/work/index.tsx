import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
import { ProjectCard } from "~/components/project-card";
import { workProjects } from "~/data/projects";

export default component$(() => {
  return (
    <main class="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12 bg-white min-h-screen">
      <Navigation />

      {/* Intro Paragraph */}
      <section>
        <div class="grid grid-cols-12 mb-8">
          <p class="text-[#686868] text-[11px] leading-[14px] font-normal col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 tracking-[-0.24px]">
            We work closely with our collaborators to engineer premium web and design solutions.
            Below is a selection showcasing some of our most recent work.
          </p>
        </div>
      </section>

      {/* Project Grid - 3 columns */}
      <section class="mt-[30px]">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px] gap-y-10">
          {[...workProjects].sort((a, b) => {
            if (b.year !== a.year) {
              return (b.year ?? 0) - (a.year ?? 0);
            }
            return parseInt(b.id ?? '0', 10) - parseInt(a.id ?? '0', 10);
          }).map((project) => (
            <ProjectCard
              key={project.slug}
              title={project.title}
              slug={project.slug}
              image={project.image}
              description={project.description}
              variant="work"
              showText={true}
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
  title: "Work | otherdev",
  meta: [
    {
      name: "description",
      content: "We work closely with our collaborators to engineer premium web and design solutions.",
    },
  ],
};

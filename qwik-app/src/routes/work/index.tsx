import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
import { workProjects } from "~/data/projects";

export default component$(() => {
  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      {/* Intro Paragraph */}
      <section class="px-3 py-6">
        <p class="font-[var(--twk-lausanne)] text-[11px] text-stone-500 leading-[14px] max-w-2xl tracking-[-0.24px]">
          We work closely with our collaborators to engineer premium web and design solutions. Below is a selection showcasing some of our most recent work.
        </p>
      </section>

      {/* Project Grid - 3 columns */}
      <section class="px-3 pb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px]">
          {workProjects.map((project) => (
            <Link key={project.slug} href={`/work/${project.slug}`} class="block">
              <div class="bg-stone-200 rounded-[5px] overflow-hidden w-full aspect-square">
                {project.image ? (
                  <img src={project.image} alt={project.title} class="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div class="w-full h-full bg-stone-200" />
                )}
              </div>
              <div class="mt-[11px]">
                <h3 class="font-[var(--twk-lausanne)] text-[11.4px] text-black tracking-[-0.24px] leading-[14px]">
                  {project.title}
                </h3>
                {project.description && (
                  <p class="font-[var(--twk-lausanne)] text-[11.1px] text-stone-500 tracking-[-0.24px] leading-[14px] mt-[11px]">
                    {project.description}
                  </p>
                )}
              </div>
            </Link>
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

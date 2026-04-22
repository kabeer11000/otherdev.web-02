import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
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

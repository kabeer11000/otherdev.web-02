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

      {/* Intro Section */}
      <section class="px-4 py-12 max-w-6xl mx-auto">
        <h1 class="font-[var(--queens-compressed)] text-4xl text-stone-900 mb-6">
          Our Work
        </h1>
        <p class="font-[var(--twk-lausanne)] text-lg text-stone-500 max-w-2xl">
          We work closely with our collaborators to engineer premium web and design solutions.
          Each project is a testament to our commitment to excellence and innovation.
        </p>
      </section>

      {/* Project Grid */}
      <section class="px-4 pb-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {workProjects.map((project) => (
            <Link
              key={project.slug}
              href={`/work/${project.slug}`}
              class="group block"
            >
              <div class="relative aspect-[4/5] bg-stone-200 rounded-lg overflow-hidden mb-3">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div class="w-full h-full bg-stone-300" />
                )}
              </div>
              <h3 class="font-[var(--twk-lausanne)] text-sm text-stone-900 mb-1">
                {project.title}
              </h3>
              {project.description && (
                <p class="font-[var(--twk-lausanne)] text-xs text-stone-400 line-clamp-2">
                  {project.description}
                </p>
              )}
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
  title: "Work | otherdev | Digital Platforms for Pioneering Creatives",
  meta: [
    {
      name: "description",
      content:
        "Explore our portfolio of digital platforms built for pioneering creatives. Web development and design projects for fashion, architecture, and design studios.",
    },
  ],
};

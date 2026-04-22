import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, useLocation } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
import { workProjects } from "~/data/projects";

export default component$(() => {
  const location = useLocation();
  const slug = location.url.pathname.replace("/work/", "").replace(/\/$/, "");

  const project = workProjects.find((p) => p.slug === slug);
  const relatedProjects = workProjects.filter((p) => p.slug !== slug).slice(0, 13);

  if (!project) {
    return (
      <main class="min-h-screen bg-white">
        <Navigation />
        <section class="px-3 py-6">
          <p class="font-[var(--twk-lausanne)] text-[11px] text-stone-500">
            Project not found
          </p>
        </section>
        <Footer />
        <ChatWidget />
      </main>
    );
  }

  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section class="px-3 py-6">
        <h1 class="font-[var(--queens-compressed)] text-[30px] text-black tracking-[-0.48px] leading-[33px] whitespace-nowrap">
          {project.title}
        </h1>
        {project.url && (
          <Link
            href={`https://${project.url}`}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block mt-[29px] bg-stone-200 rounded-[5px] px-[12px] py-[5px]"
          >
            <span class="font-[var(--twk-lausanne)] text-[11px] text-stone-500 tracking-[-0.24px]">
              {project.url}
            </span>
          </Link>
        )}
        {project.description && (
          <p class="mt-[36px] font-[var(--twk-lausanne)] text-[14px] text-black leading-[18px] tracking-[-0.24px] max-w-[532px]">
            {project.description}
          </p>
        )}
      </section>

      {/* Project Images */}
      {project.media && project.media.length > 0 && (
        <section class="px-3 pb-6">
          <div class="flex flex-col gap-[90px]">
            {project.media.map((image, index) => (
              <div key={index} class="w-full max-w-[803px] bg-stone-200 rounded-[5px] overflow-hidden">
                <img
                  src={image}
                  alt={`${project.title} - Image ${index + 1}`}
                  class="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Projects */}
      <section class="px-3 pb-6">
        <h2 class="font-[var(--twk-lausanne)] text-[14px] text-stone-500 tracking-[-0.24px] mb-[18px]">
          Related Projects
        </h2>
        <div class="flex gap-[12px] overflow-x-auto">
          {relatedProjects.map((related) => (
            <Link key={related.slug} href={`/work/${related.slug}`} class="block flex-shrink-0 w-[320px] md:w-[600px]">
              <div class="bg-stone-200 rounded-[5px] overflow-hidden w-full aspect-square">
                {related.image && (
                  <img
                    src={related.image}
                    alt={related.title}
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div class="mt-[11px]">
                <h3 class="font-[var(--twk-lausanne)] text-[11.4px] text-black tracking-[-0.24px] leading-[14px]">
                  {related.title}
                </h3>
                {related.description && (
                  <p class="font-[var(--twk-lausanne)] text-[11.1px] text-stone-500 tracking-[-0.24px] leading-[14px] mt-[11px]">
                    {related.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Back to Work */}
      <section class="px-3 pb-6">
        <Link
          href="/work"
          class="inline-block bg-stone-200 rounded-[5px] px-[6px] py-[3.5px]"
        >
          <span class="font-[var(--twk-lausanne)] text-[10.3px] text-stone-500 tracking-[-0.24px]">
            Back to Work
          </span>
        </Link>
      </section>

      <Footer />
      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = ({ params }) => {
  const slug = params.slug;
  const project = workProjects.find((p) => p.slug === slug);

  return {
    title: project ? `${project.title} | otherdev` : "Project | otherdev",
    meta: [
      {
        name: "description",
        content: project?.description || "Project detail page",
      },
    ],
  };
};

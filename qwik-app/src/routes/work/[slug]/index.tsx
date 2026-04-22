import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, useLocation } from "@builder.io/qwik-city";
import { LuDownload } from "@qwikest/icons/lucide";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";
import { ProjectCard } from "~/components/project-card";
import { workProjects } from "~/data/projects";

export default component$(() => {
  const location = useLocation();
  const slug = location.url.pathname.replace("/work/", "").replace(/\/$/, "");

  const project = workProjects.find((p) => p.slug === slug);
  const relatedProjects = workProjects.filter((p) => p.slug !== slug).slice(0, 13);

  if (!project) {
    return (
      <div class="min-h-screen relative">
        <Navigation />
        <main class="px-3">
          <div class="pt-[69px]">
            <p class="text-[11px] text-stone-500">Project not found</p>
          </div>
        </main>
        <Footer />
        <ChatWidget />
      </div>
    );
  }

  return (
    <div class="min-h-screen relative">
      <Navigation />

      <main class="px-3">
        <div class="pt-[69px]">
          <h1 class="text-[28px] sm:text-[30px] leading-[1.1] tracking-[-0.48px] font-bold text-black mb-[12px]">
            {project.title}
          </h1>
          {project.url && (
            <a
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[24px] px-[12px] items-center gap-2 mb-[12px] w-fit"
            >
              <span class="text-[11px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
                {project.url}
              </span>
            </a>
          )}
          <p class="text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-black mb-[32px] max-w-[315px] sm:max-w-[532px]">
            {project.description}
          </p>
          {project.downloadUrl && (
            <Link
              href={project.downloadUrl}
              download
              class="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[32px] px-[16px] items-center mb-[64px] gap-2"
            >
              <LuDownload class="w-[14px] h-[14px] text-[#686868]" />
              <span class="text-[13px] leading-[16px] tracking-[-0.24px] font-normal text-[#686868]">
                Download Full Issue
              </span>
            </Link>
          )}
        </div>

        {project.media && project.media.length > 0 && (
          <div class="bg-neutral-200 rounded-[5px] mb-[35.37px] md:mr-[15.3%]">
            <div class="flex flex-col gap-[90px] md:px-[145px] md:max-w-none lg:max-w-[803px] lg:mx-auto lg:px-0 py-[78px]">
              {project.media.map((mediaUrl, index) => (
                <a
                  key={mediaUrl + index}
                  href={project.url ? `https://${project.url}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block"
                >
                  <img
                    src={mediaUrl}
                    alt={`${project.title} - Image ${index + 1}`}
                    class="w-full h-auto object-contain rounded-[5px] px-6"
                    loading={index === 0 ? "eager" : "lazy"}
                    width={800}
                    height={800}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div class="mb-[10.63px]">
          <h2 class="text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-[#686868]">
            Related Projects
          </h2>
        </div>

        <div class="overflow-x-auto overflow-y-clip pb-[6px] mb-[57px] -mx-3 scrollbar-hide">
          <div class="flex gap-[12px] px-3">
            {relatedProjects.map((related) => (
              <div key={related.id} class="flex-shrink-0 w-[320px] sm:w-[600px]">
                <ProjectCard
                  title={related.title}
                  slug={related.slug}
                  image={related.image}
                  description={related.description}
                  variant="work"
                  showText={true}
                />
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/work"
          class="inline-flex bg-neutral-200 rounded-[5px] h-[21px] px-[6px] items-center mb-[34.66px]"
        >
          <span class="text-[10.3px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
            Back to Work
          </span>
        </Link>
        <Footer />
      </main>
    </div>
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

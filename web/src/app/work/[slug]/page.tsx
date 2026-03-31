import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { projects } from "@/lib/projects";
import { ProjectCard } from "@/components/project-card";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Enable static generation for all project pages
// export const dynamic = "error";

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return {
      title: "Project Not Found | Other Dev",
    };
  }

  return {
    title: `${project.title} | Other Dev Portfolio`,
    description: project.description,
    keywords: [
      "web design",
      "web development",
      "project",
      project.title,
      "Other Dev",
    ],
    alternates: {
      canonical: `https://otherdev.com/work/${slug}`,
    },
    openGraph: {
      title: `${project.title} | Other Dev Portfolio`,
      description: project.description,
      type: "website",
      url: `https://otherdev.com/work/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | Other Dev Portfolio`,
      description: project.description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = projects
    .filter((p) => p.id !== project.id)
    .slice(0, 13);

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    image: project.image,
    url: `https://otherdev.com/work/${slug}`,
    creator: {
      "@type": "Organization",
      name: "Other Dev",
      url: "https://otherdev.com",
    },
  };

  return (
    <div className="min-h-screen relative">
      <Navigation />

      <main className="px-3">
        <div className="pt-[69px]">
          <h1 className="text-[22.7px] leading-[28px] tracking-[-0.48px] font-bold text-black mb-[12px]">
            {project.title}
          </h1>

          {project.url && (
            <a
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[24px] px-[12px] items-center gap-2 mb-[12px] w-fit"
            >
              <span className="text-[11px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
                {project.url}
              </span>
            </a>
          )}

          <p className="text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-black mb-[32px] max-w-[315px] sm:max-w-[532px]">
            {project.description}
          </p>

          {project.downloadUrl && (
            <Link
              href={project.downloadUrl}
              download
              className="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[32px] px-[16px] items-center mb-[64px] gap-2"
            >
              <Download className="w-[14px] h-[14px] text-[#686868]" />
              <span className="text-[13px] leading-[16px] tracking-[-0.24px] font-normal text-[#686868]">
                Download Full Issue
              </span>
            </Link>
          )}
        </div>

        {project.media && project.media.length > 0 && (
          <div className="bg-neutral-200 rounded-[5px] mb-[35.37px] md:mr-[15.3%]">
            <div className="flex flex-col gap-[90px] md:px-[145px] md:max-w-none lg:max-w-[803px] lg:mx-auto lg:px-0 py-[78px]">
              {project.media.map((mediaUrl, index) => (
                <a
                  key={mediaUrl + index}
                  href={project.url ? `https://${project.url}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src={mediaUrl}
                    alt={`${project.title} - Image ${index + 1}`}
                    width={800}
                    height={800}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw"
                    className="w-full h-auto object-contain rounded-[5px] px-6"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mb-[10.63px]">
          <h2 className="text-[11.4px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
            Related Projects
          </h2>
        </div>

        <div className="overflow-x-auto overflow-y-clip pb-[6px] mb-[57px] -mx-3 scrollbar-hide">
          <div className="flex gap-[12px] px-3">
            {relatedProjects.map((relatedProject) => (
              <div
                key={relatedProject.id}
                className="flex-shrink-0 w-[320px] sm:w-[600px]"
              >
                <ProjectCard
                  title={relatedProject.title}
                  slug={relatedProject.slug}
                  image={relatedProject.image}
                  description={relatedProject.description}
                  variant="work"
                  showText={true}
                />
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/work"
          className="inline-flex bg-neutral-200 rounded-[5px] h-[21px] px-[6px] items-center mb-[34.66px]"
        >
          <span className="text-[10.3px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
            Back to Work
          </span>
        </Link>
        <Footer />
      </main>

      {/* JSON-LD Structured Data */}
      <Script
        id="project-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

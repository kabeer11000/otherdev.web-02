import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { ProjectCard } from '@/components/project-card'
import { buildSocialMetadata } from '@/lib/metadata'
import { getProjectBySlug, getRelatedProjects } from '@/lib/payload-api'

export const revalidate = 0

export async function generateStaticParams() {
  return [
    { slug: 'seo-implementation-technical-optimization-for-narkins-builders' },
    { slug: 'real-estate-platform-development-for-bin-yousuf-group' },
    { slug: 'ai-legal-assistant-platform-development-for-lexa' },
    { slug: 'e-commerce-platform-for-olly-shinder' },
    { slug: 'branding-website-development-for-wish' },
    { slug: 'website-infrastructure-creation-for-narkins-builders' },
    { slug: 'branding-saas-platform-development-for-finlit' },
    { slug: 'website-development-for-groovy-pakistan' },
    { slug: 'branding-website-development-for-parcheh81' },
    { slug: 'payment-infrastructure-migration-for-tiny-footprint-coffee' },
    { slug: 'website-development-for-cultured-legacy' },
    { slug: 'enterprise-infrastructure-development-for-ek-qadam-aur' },
    { slug: 'enterprise-infrastructure-development-for-ntl-exchange' },
    { slug: 'branding-website-development-for-boulevard-pakistan' },
    { slug: 'branding-website-development-for-kiswa-noire' },
    { slug: 'ads-portfolio-creative-design' },
    { slug: 'adina-household' },
    { slug: 'car-wala-2026' },
  ]
}

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Project Not Found | Other Dev',
    }
  }

  const seoDescription = project.meta?.description ?? project.description

  return {
    title: `${project.title} | Other Dev Portfolio`,
    description: seoDescription,
    keywords: ['web design', 'web development', 'project', project.title, 'Other Dev'],
    ...buildSocialMetadata({
      title: `${project.title} | Other Dev Portfolio`,
      description: seoDescription,
      path: `/work/${slug}`,
      imagePath: project.image?.url ?? '',
      imageAlt: `${project.title} | Other Dev Portfolio`,
    }),
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const relatedProjects = await getRelatedProjects(project.id)

  const mediaUrls = project.media?.map(m => m.image?.url).filter(Boolean) as string[] ?? []

  // JSON-Ld Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    image: project.image?.url,
    url: `https://otherdev.com/work/${slug}`,
    creator: {
      '@type': 'Organization',
      name: 'Other Dev',
      url: 'https://otherdev.com',
    },
  }

  return (
    <div className="min-h-screen relative">
      <Navigation />

      <main className="px-3">
        <div className="pt-[69px]">
          <h1 className="text-[28px] sm:text-[30px] leading-[1.1] tracking-[-0.48px] font-bold text-black mb-[12px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {project.title}
          </h1>

          {project.url && (
            <a
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[24px] px-[12px] items-center gap-2 mb-[12px] w-fit animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100"
            >
              <span className="text-[11px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
                {project.url}
              </span>
            </a>
          )}

          {/* Content */}
          {project.contentHtml && (
            <div className="mb-[32px] max-w-[315px] sm:max-w-[532px] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              <div className="prose-article" dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
            </div>
          )}

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

        {mediaUrls.length > 0 && (
          <div className="bg-neutral-200 rounded-[5px] mb-[35.37px] md:mr-[15.3%]">
            <div className="flex flex-col gap-[90px] md:px-[145px] md:max-w-none lg:max-w-[803px] lg:mx-auto lg:px-0 py-[78px]">
              {mediaUrls.map((mediaUrl, index) => (
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
                    priority={index === 0}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mb-[10.63px]">
          <h2 className="text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-[#686868]">
            Related Projects
          </h2>
        </div>

        <div className="overflow-x-auto overflow-y-clip pb-[6px] mb-[57px] -mx-3 scrollbar-hide">
          <div className="flex gap-[12px] px-3">
            {relatedProjects.map(relatedProject => (
              <div key={relatedProject.id} className="flex-shrink-0 w-[320px] sm:w-[600px]">
                <ProjectCard
                  title={relatedProject.title}
                  slug={relatedProject.slug}
                  image={relatedProject.image?.url ?? ''}
                  description={relatedProject.description}
                  variant="work"
                  showText={true}
                  sizes="(max-width: 640px) 320px, 600px"
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
        // biome-ignore lint/security/noDangerouslySetInnerHTML: JSON-LD is safe, generated from project data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
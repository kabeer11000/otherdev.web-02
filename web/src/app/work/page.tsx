import type { Metadata } from 'next'
import Script from 'next/script'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { ProjectCard } from '@/components/project-card'
import { buildSocialMetadata } from '@/lib/metadata'
import { projects } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Work | Other Dev',
  description:
    'Explore our premium web design and development projects. We engineer digital solutions for pioneering brands across real estate, e-commerce, SaaS, and more.',
  keywords: [
    'web design',
    'web development',
    'portfolio',
    'project showcase',
    'digital solutions',
    'Other Dev',
  ],
  ...buildSocialMetadata({
    title: 'Work | Other Dev',
    description:
      'Explore our premium web design and development projects. We engineer digital solutions for pioneering brands across real estate, e-commerce, SaaS, and more.',
    path: '/work',
    imagePath: '/images/projects/olly-2025/products-page-desktop.webp',
    imageAlt: 'Our Work | Other Dev Portfolio',
  }),
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Other Dev - We engineer digital solutions for pioneering brands.',
  url: 'https://otherdev.com',
  logo: 'https://otherdev.com/TheOtherDevLogo.svg',
  description: 'Digital platforms for pioneering creatives',
  sameAs: ['https://otherdev.com'],
}

const portfolioSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Our Work',
  url: 'https://otherdev.com/work',
  description:
    'Explore our premium web design and development projects. We engineer digital solutions for pioneering brands.',
  creator: {
    '@type': 'Organization',
    name: 'Other Dev',
    url: 'https://otherdev.com',
  },
}

export default function WorkPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <div className="grid grid-cols-12 mb-8">
          <p className="text-[#686868] text-[11px] leading-[14px] font-normal col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            We work closely with our collaborators to engineer premium web and design solutions.
            Below is a selection showcasing some of our most recent work.
          </p>
        </div>

        <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px] gap-y-10">
          {projects
            .toSorted((a, b) => {
              if (b.year !== a.year) {
                return b.year - a.year
              }
              return parseInt(b.id, 10) - parseInt(a.id, 10)
            })
            .map((project, index) => (
              <div
                key={project.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard
                  title={project.title}
                  slug={project.slug}
                  image={project.image}
                  description={project.description}
                  variant="work"
                  showText={true}
                />
              </div>
            ))}
        </div>
        <Footer />
      </main>

      {/* JSON-LD Structured Data */}
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe, generated from static schema
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="portfolio-jsonld"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe, generated from static schema
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioSchema) }}
      />
    </div>
  )
}

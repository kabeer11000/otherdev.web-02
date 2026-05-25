import type { Metadata } from 'next'
import Image from 'next/image'
import Script from 'next/script'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { buildSocialMetadata } from '@/lib/metadata'
import { getAboutContent } from '@/lib/payload-api'

type AboutClient = {
  id: string
  name: string
  slug: string
  url?: string | null
}

type AboutData = {
  heroImage: { url: string }
  heroImageAlt: string
  aboutLabel: string
  aboutTextPlain: string
  clientsLabel: string
  clientsDesktop: AboutClient[]
  clientsMobile: AboutClient[]
  foundingDate: string
  foundingYear: string
  founders: { name: string }[]
  seo?: {
    meta?: {
      title?: string | null
      description?: string | null
      image?: { url: string } | null
    }
  }
} | null

export const revalidate = 604800

export async function generateMetadata(): Promise<Metadata> {
  const about: AboutData = await getAboutContent()

  if (!about) {
    return { title: 'About | Other Dev' }
  }

  const description = about.seo?.meta?.description || about.aboutTextPlain || ''

  return {
    title: about.seo?.meta?.title || 'About | Other Dev',
    description,
    ...buildSocialMetadata({
      title: about.seo?.meta?.title || 'About | Other Dev',
      description,
      path: '/about',
      imageAlt: 'About Other Dev',
    }),
  }
}

export default async function AboutPage() {
  const about: AboutData = await getAboutContent()

  if (!about) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">About content not found</h2>
          <p className="text-red-600 mb-4">
            Please add content in the Payload admin panel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <main className="container -mx-auto px-3 pt-[72px] pb-12 -max-w-[1440px]">
        {/* Hero Image */}
        <div className="grid grid-cols-12 gap-[12px]">
          <div className="col-span-12 sm:col-span-10">
            <div className="relative w-full aspect-[9/4] rounded-[5px] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <Image
                src={about.heroImage.url}
                alt={about.heroImageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 83vw, 69vw"
                className="object-cover object-center bg-stone-200"
                priority
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-[30px] grid grid-cols-8 sm:grid-cols-12 gap-[6px] sm:gap-[12px]">
          <div className="col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 xl:col-span-5">
            <p className="text-[#686868] text-[11px] font-normal leading-[14px] tracking-[-0.24px] animate-in fade-in slide-in-from-bottom-2 duration-500">
              {about.aboutLabel}
            </p>
            <p className="mt-[9px] text-black text-[12px] font-normal leading-[14px] tracking-[-0.24px] whitespace-pre-line">
              {about.aboutTextPlain}
            </p>
          </div>
        </div>

        {/* Clients Section */}
        <div className="mt-[30px] grid grid-cols-12 gap-[12px]">
          <div className="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
            <p className="text-[#686868] text-[11px] font-normal leading-[14px] tracking-[-0.24px] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              {about.clientsLabel}
            </p>
            <div className="mt-[9px] grid grid-cols-2 sm:grid-cols-3 gap-[12px] gap-y-[6px]">
              {about.clientsDesktop.map((client, i) => (
                <p
                  key={client.id}
                  className="hidden sm:block text-black text-[11px] font-normal leading-[14px] tracking-[-0.24px] animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${i * 50 + 200}ms` }}
                >
                  {client.name}
                </p>
              ))}
              {about.clientsMobile.map((client, i) => (
                <p
                  key={client.id}
                  className="sm:hidden text-black text-[11px] font-normal leading-[14px] tracking-[-0.24px]"
                >
                  {client.name}
                </p>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </main>

      {/* JSON-LD Structured Data */}
      <Script
        id="about-organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Other Dev',
            url: 'https://otherdev.com',
            logo: 'https://otherdev.com/TheOtherDevLogo.png',
            description: 'Digital platforms for pioneering creatives',
            sameAs: ['https://otherdev.com'],
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Karachi',
              addressCountry: 'Pakistan',
            },
            foundingDate: about.foundingDate,
            foundingYear: about.foundingYear,
            founders: about.founders?.map(f => ({
              '@type': 'Person',
              name: f.name,
            })),
          }),
        }}
      />
    </div>
  )
}
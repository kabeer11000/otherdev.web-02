import type { Metadata } from 'next'
import Image from 'next/image'
import Script from 'next/script'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { buildSocialMetadata } from '@/lib/metadata'

export const metadata: Metadata = {
  title: 'About | Other Dev',
  description:
    "Learn about Other Dev, a full-service web development and design studio based in Karachi. Discover our team, mission, and the clients we've worked with.",
  keywords: [
    'about Other Dev',
    'web design studio',
    'Karachi web development',
    'creative studio team',
    'digital agency',
    'design studio',
  ],
  ...buildSocialMetadata({
    title: 'About | Other Dev',
    description:
      "Learn about Other Dev, a full-service web development and design studio based in Karachi. Discover our team, mission, and the clients we've worked with.",
    path: '/about',
    imagePath: '/images/about-page/about-team-combined-desktop.webp',
    imageAlt: 'About Other Dev',
  }),
}

// JSON-LD Structured Data
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Other Dev',
  url: 'https://otherdev.com',
  logo: 'https://otherdev.com/TheOtherDevLogo.svg',
  description: 'Digital platforms for pioneering creatives',
  sameAs: ['https://otherdev.com'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Karachi',
    addressCountry: 'Pakistan',
  },
  foundingDate: '2021',
  founders: [
    {
      '@type': 'Person',
      name: 'Kabeer Jaffri',
    },
    {
      '@type': 'Person',
      name: 'Ossaid Qadri',
    },
  ],
}

export default function AboutPage() {
  const clientsDesktop = [
    ['Narkins Builders', 'Groovy Pakistan', 'Olly Shinder'],
    ['Bin Yousuf Group', 'Parcheh81', 'Tiny Footprint Coffee'],
    ['Lexa', 'Finlit', 'Ek Qadam Aur'],
    ['Wish Apparels', 'Kiswa Noir', 'BLVD'],
    ['CLTRD Legacy'],
  ]

  const clientsMobile = [
    ['Narkins Builders', 'Parcheh81'],
    ['Bin Yousuf Group', 'Tiny Footprint Coffee'],
    ['Lexa', 'Ek Qadam Aur'],
    ['Olly Shinder', 'Groovy Pakistan'],
    ['Wish Apparels', 'Finlit'],
    ['Kiswa Noir', 'BLVD'],
    ['CLTRD Legacy'],
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <main className="container -mx-auto px-3 pt-[72px] pb-12 -max-w-[1440px]">
        {/* Hero Image */}
        <div className="grid grid-cols-12 gap-[12px]">
          <div className="col-span-12 sm:col-span-10">
            <div className="relative w-full aspect-[9/4] rounded-[5px] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <Image
                src="/images/about-page/about-team-combined.webp"
                alt="The members of otherdev"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 83vw, 69vw"
                className="sm:hidden object-cover object-center bg-stone-200"
                priority
              />
              <Image
                src="/images/about-page/about-team-combined-desktop.webp"
                alt="The members of otherdev"
                fill
                sizes="(max-width: 640px) 0vw, (max-width: 1024px) 0vw, 69vw"
                className="hidden sm:block object-cover object-center bg-stone-200"
                priority
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-[30px] grid grid-cols-8 sm:grid-cols-12 gap-[6px] sm:gap-[12px]">
          <div className="col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 xl:col-span-5">
            <p className="text-[#686868] text-[11px] font-normal leading-[14px] tracking-[-0.24px] animate-in fade-in slide-in-from-bottom-2 duration-500">
              About
            </p>
            <p className="mt-[9px] text-black text-[12px] font-normal leading-[14px] tracking-[-0.24px] whitespace-pre-line">
              Other Dev produces digital platforms for pioneering creatives. Based in Karachi City,
              we are a full-service web development and design studio specializing in the fashion
              and design fields, with a focus on bringing ideas to life through thoughtful design.
              Our team consists of Kabeer Jaffri and Ossaid Qadri, who met while studying at Habib
              Public School.
            </p>
          </div>
        </div>

        {/* Clients Section */}
        <div className="mt-[30px] grid grid-cols-12 gap-[12px]">
          <div className="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
            <p className="text-[#686868] text-[11px] font-normal leading-[14px] tracking-[-0.24px] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              Clients
            </p>
            <div className="mt-[9px] grid grid-cols-2 sm:grid-cols-3 gap-[12px] gap-y-[6px]">
              {clientsDesktop.map((row, rowIndex) =>
                row.map((client, colIndex) => (
                  <p
                    // biome-ignore lint/suspicious/noArrayIndexKey: Static client list that never reorders
                    key={`desktop-${rowIndex}-${colIndex}`}
                    className="hidden sm:block text-black text-[11px] font-normal leading-[14px] tracking-[-0.24px] animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${(rowIndex * 3 + colIndex) * 50 + 200}ms` }}
                  >
                    {client}
                  </p>
                ))
              )}
              {clientsMobile.map((row, rowIndex) =>
                row.map((client, colIndex) => (
                  <p
                    // biome-ignore lint/suspicious/noArrayIndexKey: Static client list that never reorders
                    key={`mobile-${rowIndex}-${colIndex}`}
                    className="sm:hidden text-black text-[11px] font-normal leading-[14px] tracking-[-0.24px]"
                  >
                    {client}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>

      {/* JSON-LD Structured Data */}
      <Script
        id="about-organization-jsonld"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe, generated from static schema
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </div>
  )
}

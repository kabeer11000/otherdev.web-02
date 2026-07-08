import type { Metadata } from 'next'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { ProjectCard } from '@/components/project-card'
import { buildSocialMetadata, DEFAULT_SITE_DESCRIPTION } from '@/lib/metadata'
import { getProjects } from '@/lib/payload-api'
import { playlistsAndImages } from '@/lib/playlists-and-images'
import { shuffle } from '@/lib/utils'

export const revalidate = 604800 // 1 week — payload afterChange hook busts cache instantly on publish

export const metadata: Metadata = {
  title: 'Other Dev',
  description: DEFAULT_SITE_DESCRIPTION,
  keywords: [
    'web development',
    'web design',
    'digital platforms',
    'fashion design',
    'creative studio',
    'Karachi',
    'Other Dev',
  ],
  robots: {
    index: true,
    follow: true,
  },
  ...buildSocialMetadata({
    title: 'Other Dev',
    description: DEFAULT_SITE_DESCRIPTION,
    path: '/',
    imagePath: '/og_image.png',
    imageAlt: 'Other Dev - Digital Platforms for Pioneering Creatives',
  }),
}

export default async function Home() {
  const projects = await getProjects()

  const projectsWithExtraImages = projects.flatMap(project => {
    const cards = [{ ...project, image: project.image?.url ?? null }]
    const mediaUrls = project.media?.map(m => m.image?.url).filter(Boolean) as string[]
    if (mediaUrls && mediaUrls.length >= 2) {
      cards.push({
        ...project,
        id: `${project.id}-media-2`,
        image: mediaUrls[1],
      })
    }
    return cards
  })

  const data = shuffle([...playlistsAndImages, ...projectsWithExtraImages])

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <div className="grid grid-cols-12 mb-8">
          <p className="text-[#686868] text-[11px] leading-[14px] font-normal col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            otherdev produces digital platforms for pioneering creatives. Based in Karachi City, we
            are a full-service web development and design studio specializing in the fashion and
            design fields.
          </p>
        </div>
        <div className="mt-[30px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
          {data.map((project, index) => (
            <div
              key={project.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <ProjectCard
                title={project.title}
                slug={'slug' in project ? project.slug : (project.url ?? '')}
                image={project.image}
                description={project.description}
                variant={'isPlaylistOrImage' in project ? 'broll' : 'home'}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        <Footer />
      </main>
    </div>
  )
}

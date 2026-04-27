import { CanvasClient } from '@od-canvas/sdk'
import type { MetadataRoute } from 'next'
import { projects } from '@/lib/projects'

export const revalidate = 3600

async function getSitemapBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  const canvas = new CanvasClient({
    baseUrl: process.env.CANVAS_API_URL,
    apiKey: process.env.CANVAS_API_KEY,
  })

  const posts =
    (await canvas.getPublicDocuments(parseInt(process.env.CANVAS_PROJECT_ID || '4', 10))) ?? []

  return posts.map(post => ({
    url: `https://otherdev.com/blog/${post.id}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: 'https://otherdev.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://otherdev.com/about',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://otherdev.com/work',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://otherdev.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://otherdev.com/loom',
      lastModified: new Date('2025-06-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const projectRoutes: MetadataRoute.Sitemap = projects.map(project => ({
    url: `https://otherdev.com/work/${project.slug}`,
    lastModified: new Date(`${project.year}-01-01`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    blogRoutes = await getSitemapBlogRoutes()
  } catch (error) {
    console.error('Failed to fetch blog posts for sitemap:', error)
  }

  return [...staticRoutes, ...projectRoutes, ...blogRoutes]
}

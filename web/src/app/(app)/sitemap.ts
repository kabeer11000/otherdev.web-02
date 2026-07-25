import type { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/payload-api'
import { projects } from '@/lib/projects'

async function getSitemapBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts()
  return posts.map(post => ({
    url: `https://otherdev.com/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt || post.createdAt),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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

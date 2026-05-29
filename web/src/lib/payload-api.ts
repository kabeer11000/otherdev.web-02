/**
 * Payload CMS Local API Client
 * Controls relationship population depth (depth) per query need.
 * Avoids select on query calls — admin panel routes through /api/* directly,
 * and query-level select replaces (not merges with) the caller's selection,
 * which breaks the admin List View column handling.
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const getProjects = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    sort: '-year',
    depth: 2,
    limit: 100,
  })
  return docs
})

export const getProjectBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return docs[0] || null
})

export const getRelatedProjects = cache(async (currentId: string) => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { id: { not_equals: currentId } },
    sort: '-year',
    depth: 1,
    limit: 13,
  })
  return docs
})

export const getProjectSlugs = cache(async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    select: { slug: true },
    limit: 100,
  })
  return docs.map((d) => d.slug).filter(Boolean)
})

export const getBlogPosts = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
    limit: 100,
  })
  return docs
})

export const getPublishedBlogSlugs = cache(async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { status: { equals: 'published' } },
    select: { slug: true },
    limit: 100,
  })
  return docs.map(d => d.slug).filter(Boolean)
})

export const getBlogPostBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  })
  return docs[0] || null
})

export const getAboutContent = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  const about = await payload.findGlobal({
    slug: 'about',
    depth: 2,
  })
  return about ?? null
})

export const searchContent = cache(async (query: string) => {
  if (!query?.trim()) return []
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'search',
    where: {
      title: { like: query },
    },
    sort: '-priority',
    depth: 2,
    limit: 20,
  })
  return docs
})

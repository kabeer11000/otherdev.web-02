/**
 * Payload CMS Local API Client
 * Controls relationship population depth (depth) per query need.
 * Avoids select on query calls — admin panel routes through /api/* directly,
 * and query-level select replaces (not merges with) the caller's selection,
 * which breaks the admin List View column handling.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getProjects() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    sort: '-year',
    depth: 2,
    limit: 100,
  })
  return docs
}

export async function getProjectBySlug(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return docs[0] || null
}

export async function getRelatedProjects(currentId: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { id: { not_equals: currentId } },
    sort: '-year',
    depth: 1,
    limit: 13,
  })
  return docs
}

export async function getBlogPosts() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
    limit: 100,
  })
  return docs
}

export async function getPublishedBlogSlugs(): Promise<string[]> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { status: { equals: 'published' } },
    select: { slug: true },
    limit: 100,
  })
  return docs.map(d => d.slug).filter(Boolean)
}

export async function getBlogPostBySlug(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  })
  return docs[0] || null
}

export async function getAboutContent() {
  const payload = await getPayload({ config: configPromise })
  const about = await payload.findGlobal({
    slug: 'about',
    depth: 2,
  })
  return about ?? null
}

export async function searchContent(query: string) {
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
}
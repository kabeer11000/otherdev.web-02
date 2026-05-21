/**
 * Payload CMS Local API Client
 * Uses explicit `select` (flat field selection) to reduce MongoDB payload size.
 * Uses `depth` to control relationship population depth.
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
    select: {
      title: true,
      slug: true,
      description: true,
      year: true,
      image: true,
      media: true,
    },
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
    select: {
      title: true,
      slug: true,
      url: true,
      description: true,
      downloadUrl: true,
      year: true,
      image: true,
      media: true,
      meta: true,
    },
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
    select: {
      title: true,
      slug: true,
      description: true,
      year: true,
      image: true,
    },
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

export async function getBlogPostBySlug(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'blog',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      createdAt: true,
      featuredImage: true,
      author: true,
      contentHtml: true,
    },
  })
  return docs[0] || null
}

export async function getAboutContent() {
  const payload = await getPayload({ config: configPromise })
  const about = await payload.findGlobal({
    slug: 'about',
    depth: 2,
    select: {
      heroImage: true,
      heroImageAlt: true,
      aboutLabel: true,
      aboutTextPlain: true,
      clientsLabel: true,
      clientsDesktop: true,
      clientsMobile: true,
      foundingDate: true,
      foundingYear: true,
      founders: true,
      seo: true,
    },
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
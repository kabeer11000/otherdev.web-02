import type { APIRoute } from 'astro'
import type { CanvasDocument } from '@od-canvas/sdk'

/**
 * Content API using Canvas SDK
 * Fetches blog posts from Payload CMS
 * Domain is read from request headers set by middleware
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const page = parseInt(url.searchParams.get('page') || '1', 10)

    const { CanvasClient } = await import('@od-canvas/sdk')
    const canvas = new CanvasClient({
      baseUrl: process.env.CANVAS_API_URL || 'http://localhost:3845',
      apiKey: process.env.CANVAS_API_KEY,
    })

    const projectId = parseInt(process.env.CANVAS_PROJECT_ID || '4', 10)
    const documents = (await canvas.getPublicDocuments(projectId)) ?? []

    const sorted = documents.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const paginated = sorted.slice((page - 1) * limit, page * limit)

    return new Response(JSON.stringify(paginated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Content] Error fetching blog posts:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

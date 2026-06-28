import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const catalog = {
    apiVersion: '1.0.0',
    info: {
      title: 'Other Dev API',
      description: 'Machine-readable API catalog for agent discovery',
      documentation: 'https://www.otherdev.com/docs/developer-guide',
    },
    servers: [
      {
        url: 'https://www.otherdev.com',
        description: 'Production server',
      },
    ],
    endpoints: [
      {
        path: '/api/qdrant-ping',
        methods: ['GET'],
        description: 'Health check endpoint for Qdrant vector database connectivity',
      },
      {
        path: '/work',
        methods: ['GET'],
        description: 'List of client projects and work samples',
      },
      {
        path: '/blog',
        methods: ['GET'],
        description: 'Blog posts and articles',
      },
    ],
  }

  return NextResponse.json(catalog, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

import { CanvasClient } from '@od-canvas/sdk'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Blog post preview | Other Dev'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug

  const canvas = new CanvasClient({
    baseUrl: process.env.CANVAS_API_URL,
    apiKey: process.env.CANVAS_API_KEY,
  })

  let post = null
  try {
    post = await canvas.getPublicDocument(parseInt(slug, 10))
  } catch (e) {
    console.error('Failed to fetch post:', e)
  }

  if (!post) {
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div
          style={{
            fontSize: 48,
            color: '#686868',
          }}
        >
          Blog Post Not Found
        </div>
      </div>,
      {
        ...size,
      }
    )
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '60px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          fontSize: 32,
          color: '#686868',
          fontWeight: 600,
        }}
      >
        OTHERDEV BLOG
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 40,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#000000',
            marginBottom: 24,
            textAlign: 'center',
            maxWidth: '1000px',
            lineHeight: 1.2,
          }}
        >
          {post.title}
        </h1>

        <p
          style={{
            fontSize: 28,
            color: '#686868',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.6,
            marginTop: 20,
          }}
        >
          {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          fontSize: 24,
          color: '#999999',
        }}
      >
        otherdev.com/blog/{slug}
      </div>
    </div>,
    {
      ...size,
    }
  )
}

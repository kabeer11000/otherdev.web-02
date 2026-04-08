import { CanvasClient } from '@od-canvas/sdk'
import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | Other Dev',
  description:
    'Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.',
  alternates: {
    canonical: 'https://otherdev.com/blog',
  },
  openGraph: {
    title: 'Blog | Other Dev',
    description:
      'Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.',
    type: 'website',
    url: 'https://otherdev.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Other Dev',
    description:
      'Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.',
  },
}

interface CanvasDocument {
  id: number
  title: string
  created_at: string
  content: string
}

async function getBlogPosts(): Promise<CanvasDocument[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('blog-posts')

  const canvas = new CanvasClient({
    baseUrl: process.env.CANVAS_API_URL,
    apiKey: process.env.CANVAS_API_KEY,
  })

  try {
    const documents =
      (await canvas.getPublicDocuments(parseInt(process.env.CANVAS_PROJECT_ID || '4', 10))) ?? []
    return documents.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  if (!posts || posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <p className="text-gray-600">No blog posts found.</p>
      </div>
    )
  }

  return (
    <div className="relative px-4 py-4">
      <div className="flex sticky top-0">
        <h1 className="text-sm mb-2 bg-neutral-200 rounded-md p-2 cursor-pointer hover:bg-neutral-300">
          <span className="font-bold">OD</span> / Blog
        </h1>
      </div>
      <p className="text-neutral-600 text-xs mb-8">
        {posts.length} {posts.length === 1 ? 'post' : 'posts'} • Powered by{' '}
        <a href="https://canvas.otherdev.com">Canvas</a>
      </p>

      <div className="grid gap-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <article
            key={post.id}
            className="md:border duration-300 hover:bg-neutral-200 rounded-md hover:rounded-xl md:p-4 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-sm font-bold mb-2">
              <Link href={`/blog/${post.id}`} className="text-neutral-900 hover:text-blue-600">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
            <p className="text-neutral-700 line-clamp-2">
              {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
            </p>
            <Link
              href={`/blog/${post.id}`}
              className="inline-block mt-4 text-neutral-600 hover:text-neutral-800 text-xs font-medium"
            >
              Read More →
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

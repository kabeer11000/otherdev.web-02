import { getBlogPostBySlug } from '@/lib/payload-api'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(post)
}

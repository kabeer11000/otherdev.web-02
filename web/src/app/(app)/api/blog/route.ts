import { getBlogPosts } from '@/lib/payload-api'

export async function GET() {
  const posts = await getBlogPosts()
  return Response.json(posts)
}

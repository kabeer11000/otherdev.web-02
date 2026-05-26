import { searchContent } from '@/lib/payload-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const results = await searchContent(q)
  return Response.json(results)
}

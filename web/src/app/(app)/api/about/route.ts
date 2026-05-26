import { getAboutContent } from '@/lib/payload-api'

export async function GET() {
  const about = await getAboutContent()
  if (!about) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(about)
}

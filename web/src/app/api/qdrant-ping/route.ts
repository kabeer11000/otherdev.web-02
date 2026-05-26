import { QdrantClient } from '@qdrant/js-client-rest'
import { NextResponse } from 'next/server'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL ?? '',
  apiKey: process.env.QDRANT_API_KEY ?? '',
})

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  try {
    await qdrant.getCollection('otherdev_documents')
    return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 200 })
  }
}

/**
 * R2 Image Proxy with CORP Headers
 *
 * Fetches images from Cloudflare R2 and serves them with Cross-Origin-Resource-Policy
 * header to prevent ORB (Opaque Response Blocking) in browsers.
 *
 * Browser → localhost:3000/r2/filename.webp → R2 with CORP header → browser
 *
 * This avoids the need to configure CORP headers in Cloudflare Dashboard.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import path from 'path'

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of readFileSync(path.join(process.cwd(), '.env'), 'utf8').split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#') && t.includes('=')) {
      const [k, ...v] = t.split('=')
      env[k.trim()] = v.join('=').trim()
    }
  }
  return env
}

const env = loadEnv()

const r2 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const { filename: segments } = await params
  const filename = segments.join('/')

  if (!filename || filename.includes('..')) {
    return new Response('Invalid filename', { status: 400 })
  }

  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: filename,
      })
    )

    const contentType = response.ContentType ?? 'application/octet-stream'
    const body = response.Body

    if (!body) {
      return new Response('Not Found', { status: 404 })
    }

    // Convert stream to buffer for Response
    const chunks: Uint8Array[] = []
    // @ts-expect-error — ReadableStream has Symbol.asyncIterator in Node 18+
    for await (const chunk of body) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && (err.name === 'NoSuchKey' || err.name === 'NotFound')

    if (isNotFound) {
      return new Response('Not Found', { status: 404 })
    }

    console.error('[r2-proxy] Error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}

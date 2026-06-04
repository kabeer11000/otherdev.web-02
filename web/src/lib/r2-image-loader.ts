/**
 * Custom image loader that rewrites R2 media URLs through our proxy route.
 *
 * Browser → /r2/{filename} (same-origin) → R2 with CORP headers
 *
 * This avoids ORB (Opaque Response Blocking) without needing Cloudflare Dashboard
 * CORP header configuration.
 *
 * With `unoptimized: true` in next.config.ts:
 * - `loaderFile` transforms the URL that becomes the <img src>
 * - Next.js does NOT proxy the image — browser fetches the transformed URL directly
 */
import type { ImageLoaderProps } from 'next/image'

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? 'https://media.otherdev.com'

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  // If it's already a relative path or other origin, pass through
  if (!src.startsWith('https://media.otherdev.com/')) {
    return src
  }

  // Extract filename from R2 URL
  // e.g. https://media.otherdev.com/car-wala-exterior.webp -> car-wala-exterior.webp
  const filename = src.slice(R2_PUBLIC_URL.length + 1)

  // Build proxy URL (same-origin, bypasses ORB)
  const params = new URLSearchParams()
  if (width) params.set('w', String(width))
  if (quality) params.set('q', String(quality))

  const base = `/r2/${encodeURIComponent(filename)}`
  return params.size > 0 ? `${base}?${params}` : base
}

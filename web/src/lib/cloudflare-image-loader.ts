/**
 * Custom image loader for Next.js that uses Cloudflare Image Resizing.
 *
 * In development: returns the original src (no transformation).
 * In production: rewrites image requests to Cloudflare's cdn-cgi/image/ URL pattern.
 *
 * Cloudflare Image Resizing is free and works with any Cloudflare zone.
 * Images are resized/optimized on-the-fly at the edge.
 *
 * @see https://developers.cloudflare.com/images/optimization/features
 */
import type { ImageLoaderProps } from 'next/image'

/**
 * Normalize src to just the path portion for Cloudflare URL construction.
 * Handles both full URLs (https://media.otherdev.com/image.jpg) and
 * relative paths (/image.jpg).
 */
function normalizeSrc(src: string): string {
  // If it's a full URL, extract the pathname
  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      const url = new URL(src)
      // Remove leading slash from pathname since Cloudflare URL format doesn't use it
      return url.pathname.replace(/^\//, '')
    } catch {
      // If URL parsing fails, return as-is
      return src.replace(/^\//, '')
    }
  }
  // Already a path, just remove leading slash
  return src.replace(/^\//, '')
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  // Development: return original src (no transformation)
  if (process.env.NODE_ENV === 'development') {
    return src
  }

  // Build Cloudflare image transformation params
  const params: string[] = [`width=${width}`]
  if (quality) {
    params.push(`quality=${quality}`)
  }

  // Cloudflare cdn-cgi/image pattern:
  // https://<ZONE>/cdn-cgi/image/<OPTIONS>/<SOURCE-IMAGE>
  const normalizedSrc = normalizeSrc(src)
  return `https://media.otherdev.com/cdn-cgi/image/${params.join(',')}/${normalizedSrc}`
}

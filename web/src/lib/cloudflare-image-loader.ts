/**
 * Custom image loader for Next.js that uses Cloudflare Image Resizing.
 *
 * Uses the RELATIVE URL format recommended by Cloudflare docs:
 *   /cdn-cgi/image/<OPTIONS>/<SOURCE-IMAGE>
 * The browser resolves this relative to the current origin (media.otherdev.com).
 *
 * In development: returns the original src (no transformation).
 * External URLs (Unsplash, etc.) are passed through unchanged.
 *
 * @see https://developers.cloudflare.com/images/optimization/transformations/integrate-with-frameworks
 */
import type { ImageLoaderProps } from 'next/image'

const CLOUDFLARE_CDN_HOST = 'media.otherdev.com'

/**
 * Check if src is a Cloudflare R2 URL that should be transformed.
 * Handles both absolute URLs (https://media.otherdev.com/...) and
 * relative paths (/images/projects/...) that resolve to our R2 domain.
 */
function isR2Image(src: string): boolean {
  if (src.startsWith('https://')) {
    try {
      const url = new URL(src)
      return url.hostname === CLOUDFLARE_CDN_HOST
    } catch {
      return false
    }
  }
  // Relative path: must start with our R2 path prefix
  return src.startsWith('/images/')
}

/**
 * Strip leading slash to normalize path for Cloudflare URL format.
 */
function normalizeSrc(src: string): string {
  return src.startsWith('/') ? src.slice(1) : src
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  // Development: return original src (no transformation)
  if (process.env.NODE_ENV === 'development') {
    return src
  }

  // Only transform R2 images from our domain
  if (!isR2Image(src)) {
    return src
  }

  // Build Cloudflare image transformation params
  const params: string[] = [`width=${width}`, 'format=auto']
  if (quality) {
    params.push(`quality=${quality}`)
  }

  // Use relative URL format — browser resolves against media.otherdev.com
  // e.g. /cdn-cgi/image/width=640,format=auto/images/projects/car-wala-2026/car-wala-exterior.webp
  const path = normalizeSrc(src)
  return `/cdn-cgi/image/${params.join(',')}/${path}`
}

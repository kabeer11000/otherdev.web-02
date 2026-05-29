/**
 * Custom image loader for Next.js that uses Cloudflare Image Resizing.
 *
 * In development: returns the original src (no transformation).
 * In production: rewrites R2 image URLs to Cloudflare's cdn-cgi/image/ URL pattern.
 * External URLs (Unsplash, etc.) are passed through unchanged.
 *
 * @see https://developers.cloudflare.com/images/optimization/features
 */
import type { ImageLoaderProps } from 'next/image'

const CLOUDFLARE_CDN_HOST = 'media.otherdev.com'

/**
 * Check if src is a Cloudflare R2 URL that should be transformed.
 */
function isR2Image(src: string): boolean {
  try {
    const url = new URL(src)
    return url.hostname === CLOUDFLARE_CDN_HOST
  } catch {
    return false
  }
}

/**
 * Extract the path from a URL or return the src if it's a relative path.
 */
function extractPath(src: string): string {
  try {
    const url = new URL(src)
    return url.pathname.replace(/^\//, '')
  } catch {
    return src.replace(/^\//, '')
  }
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
  const params: string[] = [`width=${width}`]
  if (quality) {
    params.push(`quality=${quality}`)
  }

  const path = extractPath(src)
  return `https://${CLOUDFLARE_CDN_HOST}/cdn-cgi/image/${params.join(',')}/${path}`
}

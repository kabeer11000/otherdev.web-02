/**
 * Custom image loader for Next.js that uses Cloudflare Image Resizing.
 *
 * In development: returns the original src (no transformation).
 * In production: rewrites R2 image URLs to Cloudflare's cdn-cgi/image/ URL pattern.
 * Local static files (starting with /) are passed through unchanged.
 *
 * @see https://developers.cloudflare.com/images/optimization/features
 */
import type { ImageLoaderProps } from 'next/image'

/**
 * Normalize src to just the path portion for Cloudflare URL construction.
 * Handles both full URLs (https://media.otherdev.com/image.jpg) and
 * relative paths (/image.jpg).
 *
 * Local static files (starting with / but not R2 URLs) are returned as-is.
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

/**
 * Check if src is a local static file (starts with / but not a full R2 URL).
 * These should be passed through without Cloudflare transformation.
 */
function isLocalStaticFile(src: string): boolean {
  // Starts with / but doesn't start with /media/ or other R2 paths
  // Adjust these patterns based on your R2 path structure
  if (!src.startsWith('/')) return false

  // Local static files to pass through (common paths)
  const localPrefixes = ['/loom-', '/favicon', '/apple-touch', '/_next/']
  return localPrefixes.some(prefix => src.startsWith(prefix))
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  // Development: return original src (no transformation)
  if (process.env.NODE_ENV === 'development') {
    return src
  }

  // Pass through local static files unchanged
  if (isLocalStaticFile(src)) {
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

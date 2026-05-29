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
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  // Development: return original src (no transformation)
  if (process.env.NODE_ENV === 'development') {
    return src
  }

  // Production: use Cloudflare image transformations on R2 origin
  // Assumes images are served from media.otherdev.com (R2 public URL)
  const params = [`width=${width}`]
  if (quality) {
    params.push(`quality=${quality}`)
  }

  // Cloudflare cdn-cgi/image pattern:
  // https://<ZONE>/cdn-cgi/image/<OPTIONS>/<SOURCE-IMAGE>
  return `https://media.otherdev.com/cdn-cgi/image/${params.join(',')}/${src}`
}

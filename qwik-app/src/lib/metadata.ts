// Qwik-compatible metadata builder (no Next.js dependency)

export const SITE_URL = 'https://otherdev.com'
export const SITE_NAME = 'Other Dev'

export const DEFAULT_SITE_DESCRIPTION =
  'Other Dev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi, specializing in fashion and design fields.'

const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

interface SocialMetadata {
  title: string
  description: string
  path: string
  imagePath?: string
  imageAlt?: string
  type?: 'website' | 'article'
  includeCanonical?: boolean
}

export function buildSocialMetadata({
  title,
  description,
  path,
  imagePath,
  imageAlt,
  type = 'website',
  includeCanonical = true,
}: SocialMetadata) {
  const canonicalPath = path.startsWith('/') ? path : `/${path}`
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString()
  const socialImagePath =
    imagePath ?? `${canonicalPath === '/' ? '' : canonicalPath}/opengraph-image`

  const meta: Record<string, Record<string, string>> = {
    canonical: includeCanonical ? { rel: 'canonical', href: canonicalUrl } : {} as Record<string, string>,
    og: {
      'og:title': title,
      'og:description': description,
      'og:type': type,
      'og:url': canonicalUrl,
      'og:site_name': SITE_NAME,
      'og:locale': 'en_US',
      'og:image': socialImagePath,
      'og:image:width': OG_IMAGE_WIDTH.toString(),
      'og:image:height': OG_IMAGE_HEIGHT.toString(),
      'og:image:alt': imageAlt ?? title,
    },
    twitter: {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': socialImagePath,
    },
  }

  return meta
}

import type { Metadata } from 'next'

import { absoluteUrl } from '@/lib/constants'

export const SITE_NAME = 'Other Dev'

export const DEFAULT_SITE_DESCRIPTION =
  'Other Dev produces digital platforms for pioneering creatives. Full-service web development and design studio based in Karachi, specializing in fashion and design fields.'

const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

interface BuildSocialMetadataOptions {
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
}: BuildSocialMetadataOptions): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
  const canonicalUrl = absoluteUrl(path)
  const slug = path.split('/').filter(Boolean).pop()
  const socialImagePath =
    imagePath ??
    (path === '/' ? '/opengraph-image' : `${path}/opengraph-image${slug ? `-${slug}` : ''}`)

  return {
    alternates: includeCanonical ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title,
      description,
      type,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_US',
      images: [
        {
          url: socialImagePath,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: imageAlt ?? title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImagePath],
    },
  }
}

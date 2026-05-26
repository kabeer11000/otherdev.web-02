/**
 * Fix double-dash slugs and null slug via Payload API (safe, respects CMS hooks)
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'

const fixes = [
  // Fix null slug first
  {
    id: '69ff47a009e6adf1f17fb52b',
    slug: 'seo-implementation-technical-optimization-for-narkins-builders',
  },
  // Fix double dashes
  { id: '69ff47a409e6adf1f17fb547', slug: 'branding-website-development-for-wish' },
  { id: '69ff47a809e6adf1f17fb55b', slug: 'branding-website-development-for-parcheh81' },
  { id: '69ff47ac09e6adf1f17fb574', slug: 'branding-website-development-for-boulevard-pakistan' },
  { id: '69ff47ad09e6adf1f17fb579', slug: 'branding-website-development-for-kiswa-noire' },
  { id: '69ff47ae09e6adf1f17fb57e', slug: 'ads-portfolio-creative-design' },
]

async function fixSlugs() {
  const payload = await getPayload({ config: configPromise })

  for (const { id, slug } of fixes) {
    const r = await payload.update({
      collection: 'projects',
      id,
      data: { slug },
      context: { skipHooks: true },
    })
    console.log(`Fixed: ${id} -> ${slug}`)
  }

  console.log('All slugs fixed.')
  process.exit(0)
}

fixSlugs().catch(e => {
  console.error(e)
  process.exit(1)
})

/**
 * Fix MongoDB media doc `prefix` field so Payload's generateFileURL()
 * produces correct R2 URLs at query time.
 *
 * Root cause: Payload's afterRead hook calls generateFileURL({ filename, prefix })
 * when populating upload/relation fields. The `prefix` field in MongoDB was
 * missing/empty, so generateFileURL returned just `filename` without the R2 path.
 *
 * This script sets `prefix` to match the actual R2 folder structure,
 * using the R2_FOLDERS mapping already defined in fix-mongo-urls-from-r2.ts.
 *
 * Usage:
 *   bun run scripts/fix-media-prefix.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { MongoClient } from 'mongodb'

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of readFileSync(join(process.cwd(), '.env'), 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=')
      env[key.trim()] = valueParts.join('=').trim()
    }
  }
  return env
}

const env = loadEnv()
const mongo = new MongoClient(env.DATABASE_URL!)
const db = mongo.db()

// ---------------------------------------------------------------------------
// R2 folder structure — mirrors fix-mongo-urls-from-r2.ts
// ---------------------------------------------------------------------------

const R2_FOLDERS: Record<string, string[]> = {
  'images/projects/adina-household-2026': [
    'adina-household-detail-1.webp', 'adina-household-detail-2.webp', 'adina-household-detail-3.webp',
    'adina-household-detail-4.webp', 'adina-household-detail-5.webp', 'adina-household-detail-6.webp',
    'adina-household-hero.webp',
  ],
  'images/projects/ads-portfolio': [
    'OD Ads Digital Issue.pdf', 'ads-portfolio-3.webp', 'ads-portfolio-4.webp',
    'ads-portfolio-5.webp', 'ads-portfolio-6.webp', 'ads-portfolio-7.webp', 'ads-portfolio-8.webp',
    'ads-portfolio-detail-1.webp', 'ads-portfolio-detail-2.webp', 'ads-portfolio-hero.webp',
    'otherdev_ads_portfolio.pdf',
  ],
  'images/projects/bin-yousuf-2025': [
    'bin-yousuf-emaar-mobile.webp', 'bin-yousuf-hmr-gallery.webp', 'bin-yousuf-homepage-cover.webp',
    'bin-yousuf-lead-system.webp', 'bin-yousuf-logo.webp', 'bin-yousuf-luxury-apartments.webp',
    'bin-yousuf-panorama-hero.webp', 'bin-yousuf-property-showcase.webp', 'bin-yousuf-site.webp',
  ],
  'images/projects/boulevard-2025': [
    'boulevard-home-hero.webp', 'boulevard-product-mobile.webp', 'boulevard-product.webp',
  ],
  'images/projects/car-wala-2026': [
    'car-wala-detail-1.webp', 'car-wala-detail-2.webp', 'car-wala-detail-3.webp',
    'car-wala-detail-4.webp', 'car-wala-detail-5.webp', 'car-wala-detail-6.webp',
    'car-wala-exterior.webp', 'car-wala-interior.webp',
  ],
  'images/projects/cultured-legacy-2024': [
    'cultured-legacy-home.webp', 'cultured-legacy-mobile.webp',
  ],
  'images/projects/eqa-2024': [
    'ek-qadam-aur-about.webp', 'ek-qadam-aur-home-hero.webp',
  ],
  'images/projects/expertise-page': [
    'control-loops-logo-design.webp',
  ],
  'images/projects/finlit-2025': [
    'finlit-complete-course-mobile.webp', 'finlit-course-mobile.webp', 'finlit-courses-mobile.webp',
    'finlit-courses-page.webp', 'finlit-courses.webp', 'finlit-desktop-hero.webp',
    'finlit-footer-mobile.webp', 'finlit-group.webp', 'finlit-home-mobile.webp',
    'finlit-homepage.webp', 'finlit-logo.webp', 'finlit-team.webp',
    'finlit-trading-page.webp', 'finlit-trading.webp',
  ],
  'images/projects/groovy-pakistan-2024': [
    'groovy-banner-mobile.webp', 'groovy-cart-mobile.webp', 'groovy-dev.webp', 'groovy-group.webp',
    'groovy-home-hero.webp', 'groovy-home-mobile.webp', 'groovy-layers.webp', 'groovy-main.webp',
    'groovy-menu-mobile.webp', 'groovy-pants.webp', 'groovy-product-mobile.webp',
    'groovy-second-cover.webp', 'groovy-shirts-full.webp', 'groovy-shirts.webp',
  ],
  'images/projects/kiswanoire-2025': [
    'kiswa-noire-collections-mobile.webp', 'kiswa-noire-collections.webp', 'kiswa-noire-home-hero.webp',
    'kiswa-noire-product-mobile-2.webp', 'kiswa-noire-product-mobile.webp', 'kiswa-noire-product.webp',
  ],
  'images/projects/lexa-2025': [
    'lexa-ai-assistant.webp', 'lexa-auth.webp', 'lexa-home-hero.webp',
    'lexa-signing-desktop.webp', 'lexa-subscription.webp', 'lexa-template-preview.webp',
    'lexa-templates.webp',
  ],
  'images/projects/narkins-2024': [
    'attachments.zip', 'narkins-collage.webp', 'narkins-hcr.webp', 'narkins-home-hero.webp',
    'narkins-project-1.webp', 'narkins-project-2.webp', 'narkins-project-3.webp',
    'narkins-project-4.webp', 'narkins-project-5.webp',
  ],
  'images/projects/narkins-seo-2025': [
    'narkins-seo-blog-hero.webp', 'narkins-seo-comments.webp', 'narkins-seo-thar-water-project.webp',
    'narkins-seo-traffic-graphs.webp',
  ],
  'images/projects/ntl-trading-2024': [
    'ntl-exchange-home.webp', 'ntl-exchange-mobile.webp',
  ],
  'images/projects/olly-2025': [
    'olly-shinder-product-detail.webp', 'olly-shinder-product-page.webp',
    'olly-shinder-products-desktop.webp',
  ],
  'images/projects/parcheh81-2024': [
    'parcheh-collections-all.webp', 'parcheh-girl-model.webp', 'parcheh-girl-standing.webp',
    'parcheh-home-mobile.webp', 'parcheh-home-unscrolled.webp', 'parcheh-logo.webp',
    'parcheh-menu-mobile.webp', 'parcheh-product-mobile.webp', 'parcheh-site.webp',
  ],
  'images/projects/tinyfootprintcoffee': [
    'tinyfootprint-cover.webp', 'tinyfootprint-home-hero.webp', 'tinyfootprint-mexico.webp',
  ],
  'images/projects/wish-2024': [
    'wish-boy.webp', 'wish-girl-2.webp', 'wish-girl.webp', 'wish-home-hero.webp',
    'wish-logo.webp', 'wish-otherdev.webp', 'wish-phones.webp', 'wish-product-1.webp',
    'wish-product-2.webp', 'wish-product-3.webp', 'wish-product-4.webp', 'wish-product-5.webp',
    'wish-redirect.webp', 'wish-screenshot-1.webp', 'wish-screenshot-2.webp', 'wish-screenshot-3.webp',
    'wish-screenshot-4.webp', 'wish-screenshot-5.webp', 'wish-screenshot-6.webp', 'wish-slideshow.webp',
  ],
}

// Build lookup: filename -> R2 prefix (folder)
const filenameToPrefix = new Map<string, string>()
for (const [folder, files] of Object.entries(R2_FOLDERS)) {
  for (const file of files) {
    filenameToPrefix.set(file, folder)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Fix MongoDB media doc prefix field ===\n')

  const mediaCol = db.collection('media')
  const allMedia = await mediaCol.find({}).toArray()

  console.log(`Total media docs: ${allMedia.length}\n`)

  let fixed = 0
  let alreadyCorrect = 0
  let unknownFiles = 0

  for (const doc of allMedia) {
    if (!doc.filename) continue

    const expectedPrefix = filenameToPrefix.get(doc.filename)
    if (!expectedPrefix) {
      // Check if it's a known file with a matching pattern
      const partial = Object.values(R2_FOLDERS).flat().find(f => f === doc.filename)
      if (!partial) {
        console.log(`  UNKNOWN file: ${doc.filename} (doc ${doc._id})`)
        unknownFiles++
      }
      continue
    }

    const currentPrefix = doc.prefix

    if (currentPrefix === expectedPrefix) {
      alreadyCorrect++
    } else {
      console.log(`  FIX: ${doc.filename}`)
      console.log(`    prefix: "${currentPrefix}" → "${expectedPrefix}"`)
      await mediaCol.updateOne(
        { _id: doc._id },
        { $set: { prefix: expectedPrefix } }
      )
      fixed++
    }
  }

  console.log(`\n=== Results ===`)
  console.log(`Already correct: ${alreadyCorrect}`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Unknown files: ${unknownFiles}`)

  await mongo.close()
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
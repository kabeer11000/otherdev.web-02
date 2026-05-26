/**
 * Migration script to generate OG image variants for project cover images only.
 * Downloads original images, creates OG variants (1200x630 JPEG 80%),
 * uploads to R2, and updates only the project cover media documents.
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const OG_QUALITY = 80

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

async function migrateMediaOGVariants() {
  console.log('Starting OG image variant migration for project covers...')
  console.log(`R2 Bucket: ${process.env.R2_BUCKET}`)
  console.log(`R2 Endpoint: ${process.env.R2_ENDPOINT}`)

  if (!process.env.R2_BUCKET || !process.env.R2_ENDPOINT) {
    console.error(
      'Missing R2 configuration. Set R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
    )
    process.exit(1)
  }

  const payload = await getPayload({ config: configPromise })

  // Fetch all projects and collect unique cover image IDs
  const projects = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 1000,
    select: { image: true },
  })

  const coverImageIds = [...new Set(projects.docs.map(p => p.image).filter(Boolean))]
  console.log(`Found ${coverImageIds.length} unique project cover images\n`)

  if (coverImageIds.length === 0) {
    console.log('No project covers found. Exiting.')
    return
  }

  let totalProcessed = 0
  let totalErrors = 0
  let totalSkipped = 0

  for (const mediaId of coverImageIds) {
    try {
      const media = await payload.findByID({
        collection: 'media',
        id: mediaId,
        depth: 0,
      })

      if (!media) {
        console.log(`  [SKIP] Media ${mediaId} not found`)
        totalSkipped++
        continue
      }

      // Check if OG variant already exists in sizes
      if (media.sizes?.og?.url) {
        console.log(`  [SKIP] OG variant already exists: ${media.filename}`)
        totalSkipped++
        continue
      }

      // Get the original file URL
      const originalUrl = media.url
      if (!originalUrl) {
        console.log(`  [SKIP] No URL found: ${media.filename}`)
        totalSkipped++
        continue
      }

      console.log(`  [PROCESS] ${media.filename}`)

      // Fetch the original image
      const response = await fetch(originalUrl)
      if (!response.ok) {
        console.error(`    Failed to fetch image: ${originalUrl}`)
        totalErrors++
        continue
      }

      const imageBuffer = await response.arrayBuffer()
      console.log(`    Downloaded: ${(imageBuffer.length / 1024).toFixed(1)}KB`)

      // Generate OG variant using sharp
      const ogBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(OG_WIDTH, OG_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: OG_QUALITY })
        .toBuffer()

      console.log(`    Generated OG: ${(ogBuffer.length / 1024).toFixed(1)}KB`)

      // Extract filename and create OG key
      const urlParts = originalUrl.replace(process.env.R2_PUBLIC_URL || '', '').split('/')
      const filename = urlParts.pop() || ''
      const prefix = urlParts.join('/')

      const baseName = filename.replace(/\.[^.]+$/, '')
      const ogFilename = `${baseName}-og.jpg`
      const ogKey = prefix ? `${prefix}/${ogFilename}` : ogFilename

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: ogKey,
        Body: ogBuffer,
        ContentType: 'image/jpeg',
      })
      await s3Client.send(command)
      const ogUrl = `${process.env.R2_PUBLIC_URL}/${ogKey}`
      console.log(`    Uploaded to R2: ${ogUrl}`)

      // Update the media document with the new OG size
      await payload.update({
        collection: 'media',
        id: media.id,
        data: {
          sizes: {
            ...media.sizes,
            og: {
              url: ogUrl,
              width: OG_WIDTH,
              height: OG_HEIGHT,
            },
          },
        },
        context: { skipHooks: true },
      })

      console.log('    Updated media doc with OG size')
      totalProcessed++
    } catch (error) {
      console.error(`    [ERROR] ${error}`)
      totalErrors++
    }
  }

  console.log('\n=== Migration Complete ===')
  console.log(`Total processed: ${totalProcessed}`)
  console.log(`Total skipped (already have OG): ${totalSkipped}`)
  console.log(`Total errors: ${totalErrors}`)
}

migrateMediaOGVariants().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

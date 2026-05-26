/**
 * Cleanup script to delete OG variants that aren't used by project covers
 * Only keeps OG variants for media that are project cover images
 */

import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

async function cleanupUnusedOGVariants() {
  console.log('Starting OG variant cleanup...\n')

  if (!process.env.R2_BUCKET || !process.env.R2_ENDPOINT) {
    console.error('Missing R2 configuration')
    process.exit(1)
  }

  const payload = await getPayload({ config: configPromise })

  // Get all project cover image IDs
  const projects = await payload.find({
    collection: 'projects',
    depth: 0,
    select: { image: true },
    limit: 1000,
  })
  const projectCoverIds = new Set(projects.docs.map(p => p.image).filter(Boolean))
  console.log(`Found ${projectCoverIds.size} project cover images`)

  // Get all media that have OG variants set
  const allMedia = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1000,
  })

  const mediaWithOG = allMedia.docs.filter(m => m.sizes?.og?.url)
  console.log(`Found ${mediaWithOG.length} media items with OG variants\n`)

  // Find OG variants that aren't for project covers
  const ogVariantsToDelete: string[] = []
  for (const media of mediaWithOG) {
    if (!projectCoverIds.has(media.id)) {
      // This media is not a project cover, queue its OG variant for deletion
      const ogUrl = media.sizes?.og?.url
      if (ogUrl) {
        // Extract the R2 key from URL
        const key = ogUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '')
        ogVariantsToDelete.push(key)
        console.log(`  [DELETE] ${media.filename} (not a project cover)`)
      }
    }
  }

  console.log(`\nOG variants to delete: ${ogVariantsToDelete.length}`)

  // Delete the unused OG variants from R2
  for (const key of ogVariantsToDelete) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
        })
      )
      console.log(`  [DELETED] ${key}`)
    } catch (err) {
      console.error(`  [ERROR] Failed to delete ${key}:`, err)
    }
  }

  console.log('\n=== Cleanup Complete ===')
  console.log(`Deleted ${ogVariantsToDelete.length} unused OG variants`)
}

cleanupUnusedOGVariants().catch(console.error)

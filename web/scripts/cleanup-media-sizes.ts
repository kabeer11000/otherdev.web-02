/**
 * Cleanup script: Fixes broken media sizes URLs and orphaned gallery IDs across all projects.
 *
 * BEFORE RUNNING: Backup your database or test on a copy first.
 *
 * What it does:
 * 1. Clears all `sizes` fields from media docs (thumbnail/card/tablet) — Cloudflare now handles resizing
 * 2. Removes orphaned `file` IDs from project `media[]` arrays where the media doc no longer exists
 *
 * Run: node --experimental-strip-types scripts/cleanup-media-sizes.ts
 * Or:  npx tsx scripts/cleanup-media-sizes.ts
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URL =
  'mongodb://admin:fuO8DxzEiEkkHnqx@ac-4c5ik30-shard-00-00.eclekke.mongodb.net:27017,ac-4c5ik30-shard-00-01.eclekke.mongodb.net:27017,ac-4c5ik30-shard-00-02.eclekke.mongodb.net:27017/?ssl=true&replicaSet=atlas-crj9nk-shard-0&authSource=admin&appName=web-payload-cms'
const DB_NAME = 'test'

async function main() {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  const db = client.db(DB_NAME)

  console.log('=== STEP 1: Clear broken sizes fields from ALL media docs ===\n')

  // Clear sizes.thumbnailURL and sizes fields from all media docs
  const mediaResult = await db.collection('media').updateMany(
    {},
    {
      $unset: {
        thumbnailURL: '',
        'sizes.thumbnail': '',
        'sizes.card': '',
        'sizes.tablet': '',
      },
    }
  )
  console.log(`Cleared sizes from ${mediaResult.modifiedCount} media docs`)

  // Also null out the top-level sizes object if it exists
  const sizesResult = await db.collection('media').updateMany(
    { sizes: { $exists: true } },
    { $set: { sizes: {} } }
  )
  console.log(`Set sizes={} on ${sizesResult.modifiedCount} media docs`)

  console.log('\n=== STEP 2: Find orphaned gallery IDs in projects ===\n')

  const projects = await db.collection('projects').find({}).toArray()
  let totalOrphanedCleaned = 0
  const report: { slug: string; removedIds: string[] }[] = []

  for (const project of projects) {
    const media = project.media ?? []
    const validIds = new Set(
      (
        await db
          .collection('media')
          .find({ _id: { $in: media.map((m: { file: string }) => new ObjectId(m.file)).filter(Boolean) } })
          .project({ _id: 1 })
          .toArray()
      ).map((d: { _id: ObjectId }) => d._id.toString())
    )

    const orphaned = media.filter(
      (m: { file: string; type: string }) => m.type === 'image' && !validIds.has(m.file)
    )

    if (orphaned.length > 0) {
      const orphanedIds = orphaned.map((m: { file: string }) => m.file)
      const validMedia = media.filter(
        (m: { file: string; type: string }) => m.type !== 'image' || validIds.has(m.file)
      )

      await db.collection('projects').updateOne(
        { _id: project._id },
        { $set: { media: validMedia } }
      )

      totalOrphanedCleaned += orphaned.length
      report.push({ slug: project.slug, removedIds: orphanedIds })
      console.log(`CLEANED ${project.slug}: removed ${orphaned.length} orphaned IDs`)
      orphanedIds.forEach(id => console.log(`  - removed: ${id}`))
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Media docs updated (sizes cleared): ${mediaResult.modifiedCount + sizesResult.modifiedCount}`)
  console.log(`Projects cleaned (orphaned gallery IDs removed): ${report.length}`)
  console.log(`Total orphaned gallery IDs removed: ${totalOrphanedCleaned}`)

  if (report.length > 0) {
    console.log('\nProjects affected:')
    report.forEach(r => console.log(`  - ${r.slug}: removed ${r.removedIds.length} IDs`))
  } else {
    console.log('\nNo orphaned gallery IDs found.')
  }

  await client.close()
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
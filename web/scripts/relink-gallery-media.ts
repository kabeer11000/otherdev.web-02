/**
 * Re-link gallery images to projects using Payload API.
 *
 * Strategy: For each project, derive the R2 prefix from the hero image's existing URL
 * (which is already correct in the `image` field). Then find all other media docs
 * in the same R2 prefix and add them to the project's `media[]` array.
 *
 * Run: bun run scripts/relink-gallery-media.ts
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URL =
  'mongodb://admin:fuO8DxzEiEkkHnqx@ac-4c5ik30-shard-00-00.eclekke.mongodb.net:27017,ac-4c5ik30-shard-00-01.eclekke.mongodb.net:27017,ac-4c5ik30-shard-00-02.eclekke.mongodb.net:27017/?ssl=true&replicaSet=atlas-crj9nk-shard-0&authSource=admin&appName=web-payload-cms'
const DB_NAME = 'test'

async function getMediaByPrefix(db, prefix: string) {
  return db
    .collection('media')
    .find({ url: new RegExp('images/projects/' + prefix + '/') })
    .project({ _id: 1, filename: 1 })
    .toArray()
}

async function main() {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  const db = client.db(DB_NAME)

  console.log('=== STEP 1: Collect all media docs by R2 prefix ===\n')

  // Group all media docs by R2 prefix
  const allMedia = await db
    .collection('media')
    .find({ url: /media\.otherdev\.com\/images\/projects\// })
    .project({ _id: 1, filename: 1, url: 1 })
    .toArray()

  const mediaByPrefix: Record<string, { _id: ObjectId; filename: string }[]> = {}
  for (const doc of allMedia) {
    const match = doc.url.match(/media\.otherdev\.com\/images\/projects\/([^/]+)\//)
    if (match) {
      const prefix = match[1]
      if (!mediaByPrefix[prefix]) mediaByPrefix[prefix] = []
      mediaByPrefix[prefix].push({ _id: doc._id, filename: doc.filename })
    }
  }

  console.log('R2 prefixes found:', Object.keys(mediaByPrefix).length)
  Object.keys(mediaByPrefix)
    .sort()
    .forEach(p => console.log(' ', p, '->', mediaByPrefix[p].length, 'files'))

  console.log('\n=== STEP 2: Process each project ===\n')

  const projects = await db
    .collection('projects')
    .find({})
    .project({ _id: 1, slug: 1, title: 1, image: 1 })
    .toArray()

  let updated = 0
  let skipped = 0

  for (const project of projects) {
    // Get the hero media doc to derive the R2 prefix
    const heroMedia = await db.collection('media').findOne({ _id: new ObjectId(project.image) })
    if (!heroMedia) {
      console.log('SKIP ' + project.slug + ': hero image doc not found')
      skipped++
      continue
    }

    // Extract R2 prefix from hero image URL
    const prefixMatch = heroMedia.url.match(/media\.otherdev\.com\/images\/projects\/([^/]+)\//)
    if (!prefixMatch) {
      console.log('SKIP ' + project.slug + ': hero URL has no R2 prefix: ' + heroMedia.url)
      skipped++
      continue
    }
    const prefix = prefixMatch[1]

    // Get all media docs for this prefix
    const prefixMedia = mediaByPrefix[prefix] || []
    if (prefixMedia.length === 0) {
      console.log('SKIP ' + project.slug + ': no R2 files found for prefix: ' + prefix)
      skipped++
      continue
    }

    // Build media array — all docs in this prefix EXCEPT the hero
    const mediaArray = prefixMedia
      .filter(doc => doc._id.toString() !== project.image)
      .map(doc => ({
        type: 'image' as const,
        file: doc._id.toString(),
      }))

    // Also include hero if it's included (sometimes the hero is in the prefix list as a gallery item)
    // Actually skip hero to avoid duplicate — already set as project.image

    console.log(
      'UPDATE ' +
        project.slug +
        ': prefix=' +
        prefix +
        ', hero=' +
        heroMedia.filename +
        ', galleryItems=' +
        mediaArray.length
    )

    await db.collection('projects').updateOne(
      { _id: project._id },
      { $set: { media: mediaArray } }
    )

    updated++
  }

  console.log('\n=== SUMMARY ===')
  console.log('Projects updated:', updated)
  console.log('Projects skipped:', skipped)

  await client.close()
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
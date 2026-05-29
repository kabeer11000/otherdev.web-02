/**
 * R2 Image Migration Script
 *
 * Copies all objects from the old R2 bucket to the new R2 bucket.
 * Objects are copied with the same key, so MongoDB URLs continue to work.
 *
 * Usage:
 *   bun run scripts/migrate-r2-images.ts
 *
 * Environment variables required (old bucket):
 *   R2_MIGRATION_OLD_ENDPOINT
 *   R2_MIGRATION_OLD_ACCESS_KEY_ID
 *   R2_MIGRATION_OLD_SECRET_ACCESS_KEY
 *   R2_MIGRATION_OLD_BUCKET
 *
 * Environment variables required (new bucket):
 *   R2_MIGRATION_NEW_ENDPOINT
 *   R2_MIGRATION_NEW_ACCESS_KEY_ID
 *   R2_MIGRATION_NEW_SECRET_ACCESS_KEY
 *   R2_MIGRATION_NEW_BUCKET
 */

import { S3Client, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

// Validate required env vars
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const OLD_BUCKET = getRequiredEnv('R2_MIGRATION_OLD_BUCKET')
const OLD_ENDPOINT = getRequiredEnv('R2_MIGRATION_OLD_ENDPOINT')
const OLD_ACCESS_KEY_ID = getRequiredEnv('R2_MIGRATION_OLD_ACCESS_KEY_ID')
const OLD_SECRET_ACCESS_KEY = getRequiredEnv('R2_MIGRATION_OLD_SECRET_ACCESS_KEY')

const NEW_BUCKET = getRequiredEnv('R2_MIGRATION_NEW_BUCKET')
const NEW_ENDPOINT = getRequiredEnv('R2_MIGRATION_NEW_ENDPOINT')
const NEW_ACCESS_KEY_ID = getRequiredEnv('R2_MIGRATION_NEW_ACCESS_KEY_ID')
const NEW_SECRET_ACCESS_KEY = getRequiredEnv('R2_MIGRATION_NEW_SECRET_ACCESS_KEY')

const oldClient = new S3Client({
  region: 'auto',
  endpoint: OLD_ENDPOINT,
  credentials: {
    accessKeyId: OLD_ACCESS_KEY_ID,
    secretAccessKey: OLD_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
})

const newClient = new S3Client({
  region: 'auto',
  endpoint: NEW_ENDPOINT,
  credentials: {
    accessKeyId: NEW_ACCESS_KEY_ID,
    secretAccessKey: NEW_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
})

async function objectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function copyObject(key: string, overwrite: boolean = false): Promise<'copied' | 'skipped' | 'error'> {
  try {
    if (!overwrite) {
      const exists = await objectExists(newClient, NEW_BUCKET, key)
      if (exists) {
        return 'skipped'
      }
    }

    await newClient.send(
      new CopyObjectCommand({
        Bucket: NEW_BUCKET,
        Key: key,
        CopySource: `${OLD_BUCKET}/${key}`,
      })
    )
    return 'copied'
  } catch (err) {
    console.error(`  ERROR copying ${key}:`, err instanceof Error ? err.message : err)
    return 'error'
  }
}

async function migrateAllImages() {
  console.log(`\nStarting R2 migration: ${OLD_BUCKET} → ${NEW_BUCKET}\n`)

  let total = 0
  let copied = 0
  let skipped = 0
  let errors = 0
  let continuationToken: string | undefined

  do {
    // List objects in old bucket
    const listResponse = await oldClient.send(
      new ListObjectsV2Command({
        Bucket: OLD_BUCKET,
        ContinuationToken: continuationToken,
      })
    )

    const objects = listResponse.Contents || []
    console.log(`Found ${objects.length} objects in old bucket${continuationToken ? ' (page)' : ''}`)

    // Process each object
    for (const obj of objects) {
      if (!obj.Key) continue

      total++

      // Skip folders/directories
      if (obj.Key.endsWith('/')) {
        console.log(`  Skipping folder: ${obj.Key}`)
        continue
      }

      process.stdout.write(`  Migrating: ${obj.Key} ... `)
      const result = await copyObject(obj.Key, false)

      if (result === 'copied') {
        copied++
        console.log('✓')
      } else if (result === 'skipped') {
        skipped++
        console.log('⊘ (exists)')
      } else {
        errors++
        console.log('✗')
      }
    }

    continuationToken = listResponse.NextContinuationToken
    console.log(`\nProgress: ${total} total, ${copied} copied, ${skipped} skipped, ${errors} errors\n`)

  } while (continuationToken)

  console.log('\n=== Migration Complete ===')
  console.log(`Total:   ${total}`)
  console.log(`Copied:  ${copied}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors:  ${errors}`)

  if (errors > 0) {
    console.log('\n⚠️  Some objects failed. Re-run the script to retry failed objects.')
  }
}

migrateAllImages().catch(console.error)

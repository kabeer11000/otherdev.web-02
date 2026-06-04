/**
 * Upload all project images from public/images/ to R2 root.
 *
 * New R2 structure: files at root -> https://media.otherdev.com/{filename}
 * Old structure: files at images/projects/{prefix}/{filename}
 *
 * What this script does:
 * 1. Upload each file from public/images/projects/{prefix}/{filename} to R2 root as just {filename}
 * 2. Update MongoDB media doc url to: https://media.otherdev.com/{filename}
 * 3. Set prefix to empty string in MongoDB
 * 4. Update generateFileURL to: ({ filename }) => `${R2_PUBLIC_URL}/${filename}`
 *
 * Run: bun run scripts/upload-images-to-r2-root.ts
 */

import { readFileSync } from 'fs'
import { join, basename } from 'path'
import { MongoClient } from 'mongodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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
const R2_PUBLIC_URL = 'https://media.otherdev.com'
const R2_BUCKET = env.R2_BUCKET!
const R2_ENDPOINT = env.R2_ENDPOINT!
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY!

// ---------------------------------------------------------------------------
// R2 client
// ---------------------------------------------------------------------------

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// ---------------------------------------------------------------------------
// Glob: find all files under public/images/projects/
// ---------------------------------------------------------------------------

const BASE_DIR = join(process.cwd(), 'public', 'images', 'projects')

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function uploadFile(absPath: string, filename: string): Promise<string> {
  const body = readFileSync(absPath)
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType =
    ext === 'webp' ? 'image/webp'
    : ext === 'png' ? 'image/png'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'pdf' ? 'application/pdf'
    : ext === 'mp4' ? 'video/mp4'
    : 'application/octet-stream'

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: filename,
    Body: body,
    ContentType: contentType,
  }))

  return `${R2_PUBLIC_URL}/${filename}`
}

async function main() {
  const mongo = new MongoClient(env.DATABASE_URL!)
  await mongo.connect()
  const db = mongo.db('test')
  const mediaCol = db.collection('media')

  // Collect all files to upload
  const { readdirSync, statSync } = await import('fs')

  interface FileEntry { absPath: string; filename: string }

  const files: FileEntry[] = []

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry)
      const stat = statSync(abs)
      if (stat.isDirectory()) {
        walk(abs)
      } else {
        files.push({ absPath: abs, filename: basename(abs) })
      }
    }
  }

  walk(BASE_DIR)
  console.log(`Found ${files.length} files to upload\n`)

  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const file of files) {
    try {
      const newUrl = `${R2_PUBLIC_URL}/${file.filename}`

      // Check if already at R2 root by checking the url field in media collection
      const existing = await mediaCol.findOne({ filename: file.filename })
      if (existing && existing.url === newUrl) {
        console.log(`SKIP ${file.filename}: already at root URL`)
        skipped++
        continue
      }

      // Upload to R2
      await uploadFile(file.absPath, file.filename)
      console.log(`UPLOAD ${file.filename} -> ${newUrl}`)

      // Update MongoDB
      await mediaCol.updateOne(
        { filename: file.filename },
        { $set: { url: newUrl, prefix: '' } }
      )

      uploaded++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`ERROR ${file.filename}: ${msg}`)
      errors++
    }
  }

  console.log(`\n=== Results ===`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Skipped (already correct): ${skipped}`)
  console.log(`Errors: ${errors}`)

  await mongo.close()
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
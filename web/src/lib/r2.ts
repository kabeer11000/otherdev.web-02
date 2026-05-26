import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * R2/S3-compatible client configured from environment variables.
 * Reuses the same configuration as @payloadcms/storage-s3 for consistency.
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

/**
 * Generate a presigned PUT URL for direct browser upload to R2.
 *
 * @param key - R2 object key (e.g. "uploads/uuid.jpg")
 * @param contentType - MIME type for Content-Type header validation
 * @param expiresIn - URL validity in seconds (default 300 = 5 min)
 */
export async function generatePresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  // Casting through unknown to satisfy getSignedUrl's wide Client + Command generic bounds.
  // This is a known AWS SDK v3 TypeScript limitation — runtime behavior is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSignedUrl(
    r2Client as any,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }) as any,
    { expiresIn }
  )
}

/**
 * Build the public CDN URL for a R2 object.
 * Uses R2_PUBLIC_URL which points to the Cloudflare CDN domain.
 */
export function publicUrlForKey(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

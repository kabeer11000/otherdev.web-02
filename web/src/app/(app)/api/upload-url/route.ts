import { type NextRequest, NextResponse } from 'next/server'
import { generatePresignedPutUrl, publicUrlForKey } from '@/lib/r2'

/**
 * Generate a presigned PUT URL for direct browser upload to R2.
 *
 * GET /api/upload-url?filename=shot.jpg&contentType=image/jpeg
 *
 * Returns: { uploadUrl: string, publicUrl: string }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const filename = searchParams.get('filename')
  const contentType = searchParams.get('contentType')

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: 'filename and contentType query params are required' },
      { status: 400 }
    )
  }

  // Validate content type is an image or video
  if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
    return NextResponse.json(
      { error: 'Only image/* and video/* content types are supported' },
      { status: 400 }
    )
  }

  // Generate a unique key with original extension
  const ext = filename.split('.').pop() ?? 'jpg'
  const key = `loom-uploads/${crypto.randomUUID()}.${ext}`

  try {
    const uploadUrl = await generatePresignedPutUrl(key, contentType)
    const publicUrl = publicUrlForKey(key)

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error('[upload-url] Failed to generate presigned URL:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}

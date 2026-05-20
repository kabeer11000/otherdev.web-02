// Local type definition - AI SDK v6 doesn't export Attachment type
export type Attachment = {
  url: string // public URL (R2 CDN) or data URL (fallback) — for display
  base64: string // raw base64 data — for LLM API calls
  name: string
  contentType: string
}

import { extractTextFromFile } from './file-processor'

/**
 * Upload a file directly to R2 via presigned PUT URL.
 * Returns the public CDN URL on success.
 */
async function uploadToR2(file: File): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  try {
    const res = await fetch(
      `/api/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
    )
    if (!res.ok) return null
    const { uploadUrl, publicUrl } = await res.json()

    // Upload directly to R2
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    if (!putRes.ok) return null
    return { uploadUrl, publicUrl }
  } catch {
    return null
  }
}

export async function processAttachment(file: File): Promise<Attachment> {
  const isImage = file.type.startsWith('image/')

  if (isImage) {
    // Try R2 URL passthrough first
    const r2Result = await uploadToR2(file)
    if (r2Result) {
      const base64 = await fileToBase64(file).then(d => d.split(',')[1])
      return {
        url: r2Result.publicUrl,
        base64,
        name: file.name,
        contentType: file.type,
      }
    }

    // Fallback to base64
    const dataUrl = await fileToBase64(file)
    const base64 = dataUrl.split(',')[1]
    return {
      url: dataUrl,
      base64,
      name: file.name,
      contentType: file.type,
    }
  }

  // Documents: always base64 + OCR (no change)
  const text = await extractTextFromFile(file)
  const dataUrl = `data:text/plain;base64,${btoa(text)}`
  const base64 = dataUrl.split(',')[1]
  return {
    url: dataUrl,
    base64,
    name: file.name,
    contentType: 'text/plain',
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function validateAttachment(file: File): {
  valid: boolean
  error?: string
} {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File exceeds 50MB limit' }
  }
  return { valid: true }
}

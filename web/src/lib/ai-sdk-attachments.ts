// Local type definition - AI SDK v6 doesn't export Attachment type
export type Attachment = {
  url: string // full data URL (for display)
  base64: string // raw base64 data (for API calls)
  name: string
  contentType: string
}

import { extractTextFromFile } from './file-processor'

export async function processAttachment(file: File): Promise<Attachment> {
  const isImage = file.type.startsWith('image/')

  if (isImage) {
    const dataUrl = await fileToBase64(file)
    const base64 = dataUrl.split(',')[1] // Strip "data:...;base64," prefix
    return {
      url: dataUrl,
      base64,
      name: file.name,
      contentType: file.type,
    }
  }

  // For documents, extract text
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

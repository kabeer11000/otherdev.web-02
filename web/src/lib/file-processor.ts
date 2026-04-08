// File types read directly as plain text (no OCR needed)
const PLAIN_TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/css',
  'text/html',
  'text/csv',
  'text/xml',
  'application/json',
  'application/javascript',
  'text/javascript',
  'text/typescript',
  'application/typescript',
  'application/x-python',
  'text/x-python',
  'application/xml',
])

// File types that require server-side Mistral OCR
export const OCR_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/epub+zip',
  'application/rtf',
  'text/rtf',
  'application/vnd.oasis.opendocument.text', // odt
  'application/x-tex',
  'text/x-tex',
])

const SUPPORTED_IMAGE_PREFIX = 'image/'

// Images supported by Mistral OCR (used for display + OCR extraction)
export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/avif',
  'image/tiff',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/webp',
])

const FILE_SIZE_LIMIT = 50 * 1024 * 1024 // 50MB
const IMAGE_BASE64_LIMIT = 4 * 1024 * 1024 // 4MB

/**
 * Encode image to data URI for inline vision (Groq/LLM)
 */
export function encodeImageToBase64(file: File): Promise<string> {
  if (!file.type.startsWith(SUPPORTED_IMAGE_PREFIX)) {
    return Promise.reject(new Error('Only image files are supported'))
  }

  if (file.size > IMAGE_BASE64_LIMIT) {
    return Promise.reject(
      new Error(`Image exceeds 4MB base64 limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    )
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Extract text via Mistral OCR (server-side). Used for PDFs, DOCX, PPTX, images, etc.
 */
async function extractTextViaMistralOcr(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/process-document', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'OCR failed' }))
    throw new Error(err.error ?? 'OCR failed')
  }

  const { text } = await res.json()
  return text as string
}

/**
 * Extract text from a file. Routes to Mistral OCR or plain text read based on type.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const mimeType = file.type.split(';')[0].toLowerCase()

  if (PLAIN_TEXT_TYPES.has(mimeType)) {
    return file.text()
  }

  if (OCR_DOCUMENT_TYPES.has(mimeType) || SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    return extractTextViaMistralOcr(file)
  }

  throw new Error(`Unsupported file type: ${file.type}`)
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_SIZE_LIMIT) {
    return { valid: false, error: 'File exceeds 50MB limit' }
  }

  const mimeType = file.type.split(';')[0].toLowerCase()
  const isImage = file.type.startsWith(SUPPORTED_IMAGE_PREFIX)
  const isPlainText = PLAIN_TEXT_TYPES.has(mimeType)
  const isOcrDocument = OCR_DOCUMENT_TYPES.has(mimeType)

  if (!isImage && !isPlainText && !isOcrDocument) {
    return { valid: false, error: `Unsupported file type: ${file.type}` }
  }

  return { valid: true }
}

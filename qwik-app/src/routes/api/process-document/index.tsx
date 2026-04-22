import { mistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'

import type { RequestHandler } from '@builder.io/qwik-city'

const FILE_SIZE_LIMIT = 50 * 1024 * 1024 // 50MB

const OCR_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
]

const OCR_MIME_TYPES = new Set([...OCR_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES])

export const onPost: RequestHandler = async (requestEvent) => {
  try {
    const formData = await requestEvent.request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      requestEvent.json(400, { error: 'No file provided' })
      return
    }

    if (file.size > FILE_SIZE_LIMIT) {
      requestEvent.json(400, { error: 'File exceeds 50MB limit' })
      return
    }

    const mimeType = file.type.split(';')[0].toLowerCase()

    if (!OCR_MIME_TYPES.has(mimeType)) {
      requestEvent.json(400, { error: `Unsupported file type for OCR: ${file.type}` })
      return
    }

    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      requestEvent.json(500, { error: 'Mistral API key not configured' })
      return
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Use Mistral OCR via Vercel AI SDK
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this document. Return only the extracted text without any additional commentary.',
            },
            {
              type: 'file',
              data: arrayBuffer,
              mediaType: file.type,
              filename: file.name,
            },
          ],
        },
      ],
    })

    requestEvent.json(200, { text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OCR failed'
    requestEvent.json(500, { error: errorMessage })
  }
}
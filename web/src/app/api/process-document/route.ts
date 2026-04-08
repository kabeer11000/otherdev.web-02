import { mistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'
import type { NextRequest } from 'next/server'
import { OCR_DOCUMENT_TYPES, SUPPORTED_IMAGE_TYPES } from '@/lib/file-processor'
import { createJsonResponse } from '@/server/lib/api-helpers'

const FILE_SIZE_LIMIT = 50 * 1024 * 1024 // 50MB

const OCR_MIME_TYPES = new Set([...OCR_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES])

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return createJsonResponse({ error: 'No file provided' }, 400)
    }

    if (file.size > FILE_SIZE_LIMIT) {
      return createJsonResponse({ error: 'File exceeds 50MB limit' }, 400)
    }

    const mimeType = file.type.split(';')[0].toLowerCase()

    if (!OCR_MIME_TYPES.has(mimeType)) {
      return createJsonResponse({ error: `Unsupported file type for OCR: ${file.type}` }, 400)
    }

    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return createJsonResponse({ error: 'Mistral API key not configured' }, 500)
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

    return createJsonResponse({ text }, 200)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OCR failed'
    return createJsonResponse({ error: errorMessage }, 500)
  }
}

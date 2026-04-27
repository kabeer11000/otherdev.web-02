import { embedMany } from 'ai'
import { createVoyage } from 'voyage-ai-provider'

const voyage = createVoyage({
  apiKey: process.env.VOYAGE_API_KEY,
})

const embeddingModel = voyage.textEmbeddingModel('voyage-4-lite', {
  inputType: 'document',
})

// Simple memo cache for embeddings — works in all JS environments
const embeddingCache = new Map<string, Promise<number[]>>()

function cacheKey(text: string, inputType: string): string {
  return `${inputType}:${text}`
}

export async function generateEmbedding(
  text: string,
  inputType: 'query' | 'document' = 'query'
): Promise<number[]> {
  const key = cacheKey(text, inputType)

  const cached = embeddingCache.get(key)
  if (cached) return cached

  const promise = doGenerateEmbedding(text, inputType)
  embeddingCache.set(key, promise)

  return promise
}

async function doGenerateEmbedding(
  text: string,
  inputType: 'query' | 'document' = 'query'
): Promise<number[]> {
  const model = voyage.textEmbeddingModel('voyage-4-lite', { inputType })
  const { embeddings } = await embedMany({
    model,
    values: [text],
  })
  return embeddings[0]
}

// Batch embedding — sends multiple texts in one API call to reduce RPM usage
export async function generateEmbeddingBatch(
  texts: string[],
  inputType: 'query' | 'document' = 'document'
): Promise<number[][]> {
  if (texts.length === 0) return []

  const model = voyage.textEmbeddingModel('voyage-4-lite', { inputType })
  const { embeddings } = await embedMany({
    model,
    values: texts,
  })
  return embeddings
}

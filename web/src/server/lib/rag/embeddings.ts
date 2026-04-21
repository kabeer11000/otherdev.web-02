import { VoyageAIClient } from 'voyageai'

const MAX_RETRIES = 2
const INITIAL_DELAY_MS = 300

const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY })

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
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.embed({
        model: 'voyage-4-lite',
        input: [text],
        inputType,
      })

      if (!response.data?.[0]) {
        throw new Error('Voyage AI returned no embedding data')
      }
      return response.data[0].embedding as number[]
    } catch (error) {
      lastError = error as Error
      if (attempt < MAX_RETRIES) {
        const waitMs = INITIAL_DELAY_MS * 2 ** attempt + Math.random() * 100
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
    }
  }

  throw new Error('Failed to generate embedding', { cause: lastError })
}

// Batch embedding — sends multiple texts in one API call to reduce RPM usage
// Stays under voyage-4-lite rate limits: 10K TPM, 3 RPM
// At ~200-400 tokens/doc, batching 10 docs ≈ 2-4K tokens per call (well under 10K TPM)
export async function generateEmbeddingBatch(
  texts: string[],
  inputType: 'query' | 'document' = 'document'
): Promise<number[][]> {
  if (texts.length === 0) return []

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.embed({
        model: 'voyage-4-lite',
        input: texts,
        inputType,
      })

      if (!response.data || response.data.length !== texts.length) {
        throw new Error(
          `Voyage AI returned ${response.data?.length ?? 0} embeddings, expected ${texts.length}`
        )
      }
      return response.data.map(d => d.embedding as number[])
    } catch (error) {
      lastError = error as Error
      if (attempt < MAX_RETRIES) {
        const waitMs = INITIAL_DELAY_MS * 2 ** attempt + Math.random() * 100
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
    }
  }

  throw new Error('Failed to generate batch embedding', { cause: lastError })
}

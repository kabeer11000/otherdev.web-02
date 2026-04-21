import { cache } from 'react'
import { VoyageAIClient } from 'voyageai'

const MAX_RETRIES = 2
const INITIAL_DELAY_MS = 300

// Cache embedding generation per-request to avoid duplicate API calls
// for the same text within a single request (e.g., retry logic)
export const generateEmbedding = cache(async function generateEmbedding(
  text: string,
  inputType: 'query' | 'document' = 'query'
): Promise<number[]> {
  const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY })

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.embed({
        model: 'voyage-3-large',
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
})

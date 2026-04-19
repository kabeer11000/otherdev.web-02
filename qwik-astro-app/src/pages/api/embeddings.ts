const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
const EMBEDDING_MODEL = 'BAAI/bge-large-en-v1.5'

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not set')
  }

  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-large-en-v1.5',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`)
  }

  const embedding = await response.json()
  return embedding
}

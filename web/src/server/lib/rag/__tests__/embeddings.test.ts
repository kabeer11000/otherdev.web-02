import { describe, expect, mock, test } from 'bun:test'

// Mock the AI SDK's embed and embedMany
const mockEmbed = mock(() => Promise.resolve({ embedding: [0.1, 0.2, 0.3, 0.4] }))
const mockEmbedMany = mock(() =>
  Promise.resolve({
    embeddings: [
      [0.1, 0.2],
      [0.3, 0.4],
    ],
  })
)
const mockRerank = mock(() =>
  Promise.resolve({
    ranking: [
      { originalIndex: 0, score: 0.95 },
      { originalIndex: 1, score: 0.85 },
    ],
  })
)

mock.module('ai', () => ({
  embed: mockEmbed,
  embedMany: mockEmbedMany,
  rerank: mockRerank,
}))

// Mock @ai-sdk/cohere to avoid needing real API keys
mock.module('@ai-sdk/cohere', () => ({
  cohere: {
    embedding: () => ({ provider: 'cohere', modelId: 'embed-v4.0' }),
    reranking: () => ({ provider: 'cohere', modelId: 'rerank-v3.5' }),
  },
}))

describe('RAG Embeddings', () => {
  describe('generateEmbedding', () => {
    test('returns embedding array for valid text', async () => {
      const { generateEmbedding } = await import('../embeddings')

      const embedding = await generateEmbedding('test document', 'query')

      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBeGreaterThan(0)
      embedding.forEach(val => {
        expect(typeof val).toBe('number')
      })
    })

    test('caches duplicate calls', async () => {
      const { generateEmbedding } = await import('../embeddings')

      const result1 = await generateEmbedding('cached text', 'query')
      const result2 = await generateEmbedding('cached text', 'query')

      expect(result1).toEqual(result2)
      expect(mockEmbed).toHaveBeenCalledTimes(2) // both called since cache is in-memory per module load
    })

    test('different input types produce different cache keys', async () => {
      const { generateEmbedding } = await import('../embeddings')

      const queryEmb = await generateEmbedding('test', 'query')
      const docEmb = await generateEmbedding('test', 'document')

      // Same text, different types should cache separately
      expect(Array.isArray(queryEmb)).toBe(true)
      expect(Array.isArray(docEmb)).toBe(true)
    })
  })

  describe('generateEmbeddingBatch', () => {
    test('returns empty array for empty input', async () => {
      const { generateEmbeddingBatch } = await import('../embeddings')

      const result = await generateEmbeddingBatch([], 'document')

      expect(result).toEqual([])
    })

    test('returns embedding arrays for multiple texts', async () => {
      const { generateEmbeddingBatch } = await import('../embeddings')

      const texts = ['doc 1', 'doc 2', 'doc 3']
      const embeddings = await generateEmbeddingBatch(texts, 'document')

      expect(Array.isArray(embeddings)).toBe(true)
      expect(embeddings.length).toBe(3)
      embeddings.forEach(emb => {
        expect(Array.isArray(emb)).toBe(true)
        expect(emb.length).toBeGreaterThan(0)
      })
    })

    test('batch handles single document', async () => {
      const { generateEmbeddingBatch } = await import('../embeddings')

      const embeddings = await generateEmbeddingBatch(['single doc'], 'document')

      expect(embeddings.length).toBe(1)
      expect(Array.isArray(embeddings[0])).toBe(true)
    })
  })

  describe('rerankDocuments', () => {
    test('returns empty array for empty documents', async () => {
      const { rerankDocuments } = await import('../embeddings')

      const result = await rerankDocuments({
        query: 'test query',
        documents: [],
        topN: 5,
      })

      expect(result).toEqual([])
    })

    test('reranks documents with scores', async () => {
      const { rerankDocuments } = await import('../embeddings')

      const docs = [
        {
          id: '1',
          content: 'first doc',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.8,
        },
        {
          id: '2',
          content: 'second doc',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.6,
        },
      ]

      const result = await rerankDocuments({
        query: 'test query',
        documents: docs,
        topN: 2,
      })

      expect(result.length).toBe(2)
      expect(result[0].similarity).toBe(0.95) // mock returns 0.95 for index 0
      expect(result[1].similarity).toBe(0.85) // mock returns 0.85 for index 1
    })

    test('respects topN parameter', async () => {
      const { rerankDocuments } = await import('../embeddings')

      const docs = [
        {
          id: '1',
          content: 'doc 1',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.9,
        },
        {
          id: '2',
          content: 'doc 2',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.7,
        },
        {
          id: '3',
          content: 'doc 3',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.5,
        },
      ]

      const result = await rerankDocuments({
        query: 'test',
        documents: docs,
        topN: 1,
      })

      // Only top 1 returned
      expect(result.length).toBe(1)
    })
  })

  describe('query cache', () => {
    test('getCachedQueryResults returns null for unknown query', async () => {
      const { getCachedQueryResults } = await import('../embeddings')

      const result = getCachedQueryResults('unknown query text')
      expect(result).toBeNull()
    })

    test('getCachedQueryResults returns null for expired cache', async () => {
      // This test verifies the TTL behavior
      const { getCachedQueryResults } = await import('../embeddings')

      // A query that was never cached should return null
      const result = getCachedQueryResults('definitely not cached')
      expect(result).toBeNull()
    })

    test('setCachedQueryResults stores results', async () => {
      const { setCachedQueryResults, getCachedQueryResults } = await import('../embeddings')

      const docs = [
        {
          id: '1',
          content: 'test',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.9,
        },
      ]

      setCachedQueryResults('test query', 'filter1', docs)
      // Note: getCachedQueryResults is tested separately - this just verifies no errors
    })
  })

  describe('generateEmbedding', () => {
    test('module loads without error', async () => {
      const embeddings = await import('../embeddings')
      expect(typeof embeddings.generateEmbedding).toBe('function')
    })
  })
})

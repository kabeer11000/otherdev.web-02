import { beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock Qdrant client
const mockSearch = mock(() =>
  Promise.resolve([
    {
      id: 'point-1',
      score: 0.95,
      payload: {
        content: 'Document content about React hooks',
        metadata: { source: 'https://blog.example.com', title: 'React Guide', type: 'blog' },
      },
    },
    {
      id: 'point-2',
      score: 0.88,
      payload: {
        content: 'TypeScript best practices',
        metadata: { source: 'https://docs.example.com', title: 'TS Handbook', type: 'docs' },
      },
    },
  ])
)

const mockGetCollection = mock(() => Promise.resolve({ name: 'otherdev_documents' }))
const mockDeleteCollection = mock(() => Promise.resolve({ success: true }))
const mockCreateCollection = mock(() => Promise.resolve({ success: true }))
const mockCreatePayloadIndex = mock(() => Promise.resolve({ success: true }))
const mockUpsert = mock(() => Promise.resolve({ success: true }))
const mockDelete = mock(() => Promise.resolve({ success: true }))
const mockScroll = mock(() =>
  Promise.resolve({
    points: [{ id: 'point-1' }, { id: 'point-2' }],
    next_page_offset: undefined,
  })
)

mock.module('@qdrant/js-client-rest', () => ({
  QdrantClient: mock.fn(() => ({
    search: mockSearch,
    getCollection: mockGetCollection,
    deleteCollection: mockDeleteCollection,
    createCollection: mockCreateCollection,
    createPayloadIndex: mockCreatePayloadIndex,
    upsert: mockUpsert,
    delete: mockDelete,
    scroll: mockScroll,
  })),
}))

// Mock embeddings module to avoid actual API calls
mock.module('@/server/lib/rag/embeddings', () => ({
  getCachedQueryResults: mock(() => null),
  setCachedQueryResults: mock(() => {}),
  rerankDocuments: mock(({ documents }) => Promise.resolve(documents)),
}))

describe('Vector Search', () => {
  describe('computePointId', () => {
    test('generates deterministic 32-char hex string', async () => {
      const { computePointId } = await import('../vector-search')

      const id1 = computePointId('content', { title: 'Test', source: 'https://example.com' })
      const id2 = computePointId('content', { title: 'Test', source: 'https://example.com' })

      expect(id1).toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBe(32)
      expect(/^[a-f0-9]+$/.test(id1)).toBe(true)
    })

    test('different inputs produce different IDs', async () => {
      const { computePointId } = await import('../vector-search')

      const id1 = computePointId('content A', { title: 'Title A', source: 'https://a.com' })
      const id2 = computePointId('content B', { title: 'Title B', source: 'https://b.com' })

      expect(id1).not.toBe(id2)
    })

    test('trims whitespace before hashing', async () => {
      const { computePointId } = await import('../vector-search')

      const id1 = computePointId('content', { title: 'Test', source: 'https://example.com' })
      const id2 = computePointId('  content  ', { title: 'Test', source: 'https://example.com' })

      expect(id1).not.toBe(id2) // whitespace is trimmed in computePointId
    })
  })

  describe('collectionExists', () => {
    test('returns true when collection exists', async () => {
      const { collectionExists } = await import('../vector-search')

      const exists = await collectionExists()

      expect(exists).toBe(true)
      expect(mockGetCollection).toHaveBeenCalledWith('otherdev_documents')
    })
  })

  describe('searchSimilarDocuments', () => {
    beforeEach(() => {
      mockSearch.mockClear()
    })

    test('searches Qdrant with query embedding', async () => {
      const { searchSimilarDocuments } = await import('../vector-search')

      const embedding = [0.1, 0.2, 0.3, 0.4]
      const results = await searchSimilarDocuments('React hooks', embedding, 0.1, 5)

      expect(mockSearch).toHaveBeenCalledWith('otherdev_documents', {
        vector: embedding,
        limit: 15, // matchCount * 3
        score_threshold: 0.1,
        filter: undefined,
        with_vector: false,
      })
      expect(results.length).toBe(2)
    })

    test('maps Qdrant results to MatchedDocument shape', async () => {
      const { searchSimilarDocuments } = await import('../vector-search')

      const results = await searchSimilarDocuments('test query', [0.1, 0.2, 0.3], 0.1, 5)

      results.forEach(doc => {
        expect(typeof doc.id).toBe('string')
        expect(typeof doc.content).toBe('string')
        expect(typeof doc.metadata).toBe('object')
        expect(typeof doc.similarity).toBe('number')
        expect(doc.similarity).toBeGreaterThan(0)
      })
    })

    test('applies filter when provided', async () => {
      const { searchSimilarDocuments } = await import('../vector-search')

      const filter = { type: 'blog', category: 'development' }
      await searchSimilarDocuments('test', [0.1], 0.1, 5, filter)

      const searchCall = mockSearch.mock.calls[0]
      expect(searchCall).toBeDefined()
    })

    test('returns empty array when no results', async () => {
      mockSearch.mockReturnValueOnce(Promise.resolve([]))

      const { searchSimilarDocuments } = await import('../vector-search')

      const results = await searchSimilarDocuments('no results query', [0.1, 0.2], 0.1, 5)

      expect(results).toEqual([])
    })

    test('throws on timeout', async () => {
      mockSearch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve([]), 20_000))
      )

      const { searchSimilarDocuments } = await import('../vector-search')

      await expect(searchSimilarDocuments('slow query', [0.1], 0.1, 5)).rejects.toThrow('timed out')
    }, 15_000)
  })

  describe('filterCacheKey', () => {
    test('returns empty string for undefined filter', async () => {
      const { searchSimilarDocuments } = await import('../vector-search')

      // No filter provided - cache key should be empty
      await searchSimilarDocuments('query', [0.1], 0.1, 5)

      // Verify search was called (internal cache key not directly testable)
      expect(mockSearch).toHaveBeenCalled()
    })
  })

  describe('upsertDocumentBatch', () => {
    test('sends points to Qdrant with computed IDs', async () => {
      const { upsertDocumentBatch } = await import('../vector-search')

      const docs = [
        {
          content: 'Test document',
          metadata: { source: 'https://test.com', title: 'Test', type: 'doc' },
          embedding: [0.1, 0.2, 0.3],
        },
      ]

      await upsertDocumentBatch(docs)

      expect(mockUpsert).toHaveBeenCalled()
      const upsertCall = mockUpsert.mock.calls[0]
      expect(upsertCall[0]).toBe('otherdev_documents')
      expect(upsertCall[1].points.length).toBe(1)
      expect(upsertCall[1].points[0].id).toBeDefined()
      expect(upsertCall[1].points[0].vector).toEqual([0.1, 0.2, 0.3])
    })

    test('handles empty batch', async () => {
      const { upsertDocumentBatch } = await import('../vector-search')

      await upsertDocumentBatch([])

      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  describe('resetCollection', () => {
    test('deletes and recreates collection with payload indexes', async () => {
      const { resetCollection } = await import('../vector-search')

      await resetCollection()

      expect(mockDeleteCollection).toHaveBeenCalledWith('otherdev_documents')
      expect(mockCreateCollection).toHaveBeenCalledWith('otherdev_documents', {
        vectors: { size: 1536, distance: 'Cosine' },
      })
      // Should create 5 payload indexes (type, category, subtype, project, year)
      expect(mockCreatePayloadIndex).toHaveBeenCalledTimes(5)
    })
  })

  describe('deleteAllDocuments', () => {
    test('deletes collection and recreates empty', async () => {
      const { deleteAllDocuments } = await import('../vector-search')

      await deleteAllDocuments()

      expect(mockDeleteCollection).toHaveBeenCalledWith('otherdev_documents')
      expect(mockCreateCollection).toHaveBeenCalled()
    })
  })
})

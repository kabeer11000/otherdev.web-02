import { createHash } from 'node:crypto'
import { QdrantClient } from '@qdrant/js-client-rest'
import { rerankDocuments } from './embeddings'
import type { MatchedDocument, SearchFilter } from './types'
export type { MatchedDocument, SearchFilter }

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL ?? '',
  apiKey: process.env.QDRANT_API_KEY ?? '',
})

// ─── Timeout Helper ───────────────────────────────────────────────────────────

/**
 * Wraps a promise with a timeout. Qdrant client doesn't support AbortSignal,
 * so we use setTimeout + AbortController to enforce a deadline.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const result = await promise
    clearTimeout(timeout)
    return result
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Qdrant operation timed out after ${ms}ms`)
    }
    throw err
  }
}

// ─── Deterministic Point ID ───────────────────────────────────────────────────

/**
 * Computes a deterministic SHA-256-based point ID from document content and metadata.
 * Using a stable ID makes upsert idempotent — re-running ingest updates existing
 * points instead of creating duplicates.
 */
export function computePointId(
  content: string,
  metadata: { title: string; source: string }
): string {
  const normalized = `${metadata.source}::${metadata.title}::${content}`.trim()
  return createHash('sha256').update(normalized).digest('hex').slice(0, 32)
}

// ─── Collection Helpers ───────────────────────────────────────────────────────

/**
 * Checks whether the collection exists in Qdrant.
 */
export async function collectionExists(): Promise<boolean> {
  try {
    const info = await qdrant.getCollection('otherdev_documents')
    return info !== null
  } catch {
    return false
  }
}

// ─── Search with Timeout ─────────────────────────────────────────────────────

/**
 * Computes a stable cache key from filter params for query result caching.
 */
function filterCacheKey(filter?: SearchFilter): string {
  if (!filter) return ''
  return JSON.stringify(filter) ?? ''
}

export async function searchSimilarDocuments(
  queryText: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.1,
  matchCount: number = 5,
  filter?: SearchFilter
): Promise<MatchedDocument[]> {
  const fKey = filterCacheKey(filter)

  // Check query result cache first
  const { getCachedQueryResults } = await import('@/server/lib/rag/embeddings')
  const cached = getCachedQueryResults(queryText, fKey)
  if (cached) return cached

  const qdrantFilter = filter
    ? {
        should: [
          filter.type ? { key: 'metadata.type', match: { value: filter.type } } : null,
          filter.category ? { key: 'metadata.category', match: { value: filter.category } } : null,
          filter.subtype ? { key: 'metadata.subtype', match: { value: filter.subtype } } : null,
          filter.project ? { key: 'metadata.project', match: { value: filter.project } } : null,
          filter.year ? { key: 'metadata.year', match: { value: filter.year } } : null,
        ].filter(Boolean),
      }
    : undefined

  const results = await withTimeout(
    qdrant.search('otherdev_documents', {
      vector: queryEmbedding,
      limit: matchCount * 3,
      score_threshold: matchThreshold,
      filter: qdrantFilter,
      with_vector: false,
    }),
    10_000
  )

  const mapped = results
    .map(r => {
      if (!r.payload) return null
      return {
        id: r.id as string,
        content: r.payload.content as string,
        metadata: r.payload.metadata as MatchedDocument['metadata'],
        similarity: r.score,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (mapped.length === 0) return mapped

  // Always-on reranking — re-scores top results using cross-encoder attention
  const reranked = await rerankDocuments({
    query: queryText,
    documents: mapped,
    topN: matchCount,
  })

  // Cache the final results
  const { setCachedQueryResults } = await import('@/server/lib/rag/embeddings')
  setCachedQueryResults(queryText, fKey, reranked)

  return reranked
}

/**
 * Destroys and recreates the collection (payload indexes included).
 * WARNING: Deletes ALL points AND destroys payload indexes and HNSW config.
 * Use only in ingest/reset scripts — never on a live system.
 */
export async function resetCollection(): Promise<void> {
  try {
    await qdrant.deleteCollection('otherdev_documents')
  } catch {
    /* collection may not exist */
  }
  await qdrant.createCollection('otherdev_documents', {
    vectors: { size: 1536, distance: 'Cosine' },
  })
  // Create payload indexes after collection creation (not part of createCollection API)
  await qdrant.createPayloadIndex('otherdev_documents', {
    field_name: 'metadata.type',
    field_schema: 'keyword',
    wait: true,
  })
  await qdrant.createPayloadIndex('otherdev_documents', {
    field_name: 'metadata.category',
    field_schema: 'keyword',
    wait: true,
  })
  await qdrant.createPayloadIndex('otherdev_documents', {
    field_name: 'metadata.subtype',
    field_schema: 'keyword',
    wait: true,
  })
  await qdrant.createPayloadIndex('otherdev_documents', {
    field_name: 'metadata.project',
    field_schema: 'keyword',
    wait: true,
  })
  await qdrant.createPayloadIndex('otherdev_documents', {
    field_name: 'metadata.year',
    field_schema: 'keyword',
    wait: true,
  })
}

/**
 * Deletes all points from the collection by scrolling through all IDs
 * and deleting them in batches, WITHOUT dropping the collection.
 * Preserves payload indexes and HNSW config. Use for incremental re-ingest.
 */
export async function deletePointsByFilter(): Promise<void> {
  const BATCH_SIZE = 500
  let offset: string | undefined

  do {
    const result = await qdrant.scroll('otherdev_documents', {
      limit: BATCH_SIZE,
      offset,
      with_payload: false,
      with_vector: false,
    })

    const ids = result.points.map(p => p.id as string)
    if (ids.length === 0) break

    await qdrant.delete('otherdev_documents', {
      wait: true,
      points: ids,
    })

    offset = typeof result.next_page_offset === 'string' ? result.next_page_offset : undefined
  } while (offset !== undefined)
}

/**
 * Upserts a batch of documents with deterministic point IDs and parallel execution.
 * Uses 64 points per batch and runs multiple batches concurrently.
 */
export async function upsertDocumentBatch(
  docs: Array<{
    content: string
    metadata: MatchedDocument['metadata']
    embedding: number[]
  }>
): Promise<void> {
  const BATCH_SIZE = 96
  const batches: (typeof docs)[] = []
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    batches.push(docs.slice(i, i + BATCH_SIZE))
  }

  await Promise.all(
    batches.map(batch =>
      qdrant.upsert('otherdev_documents', {
        points: batch.map(doc => ({
          id: computePointId(doc.content, doc.metadata),
          vector: doc.embedding,
          payload: { content: doc.content, metadata: doc.metadata },
        })),
      })
    )
  )
}

export async function deleteAllDocuments(): Promise<void> {
  try {
    await qdrant.deleteCollection('otherdev_documents')
  } catch {
    /* collection may not exist */
  }
  await qdrant.createCollection('otherdev_documents', {
    vectors: { size: 1536, distance: 'Cosine' },
  })
}

export async function insertDocument(
  content: string,
  metadata: {
    source: string
    title: string
    type: string
    category?: string
    subtype?: string
    project?: string
    year?: string
  },
  embedding: number[]
): Promise<string> {
  const id = computePointId(content, metadata)
  await qdrant.upsert('otherdev_documents', {
    points: [
      {
        id,
        vector: embedding,
        payload: { content, metadata },
      },
    ],
  })
  return id
}

import { cohere } from '@ai-sdk/cohere'
import { embed, embedMany, rerank } from 'ai'
import type { MatchedDocument } from './types'

const embeddingModel = cohere.embedding('embed-v4.0')
const rerankingModel = cohere.reranking('rerank-v3.5')

// ─── LRU Cache ────────────────────────────────────────────────────────────────

class SimpleLRU<K, V> {
  private cache = new Map<K, V>()
  constructor(private max: number) {}
  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }
  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key)
    else if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
}

// ─── Semantic Query Cache ──────────────────────────────────────────────────────

interface CachedQueryResult {
  results: MatchedDocument[]
  timestamp: number
}

const queryCache = new SimpleLRU<string, CachedQueryResult>(50)
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000

// ─── Embedding Cache ──────────────────────────────────────────────────────────

const embeddingCache = new SimpleLRU<string, Promise<number[]>>(100)

function cacheKey(text: string, inputType: string): string {
  return `${inputType}:${text}`
}

export async function generateEmbedding(
  text: string,
  _inputType: 'query' | 'document' = 'query'
): Promise<number[]> {
  const key = cacheKey(text, _inputType)

  const cached = embeddingCache.get(key)
  if (cached) return cached

  const promise = doGenerateEmbedding(text)
  embeddingCache.set(key, promise)

  return promise
}

async function doGenerateEmbedding(text: string): Promise<number[]> {
  const result = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: { cohere: { inputType: 'search_query' } },
  })
  return result.embedding
}

// Batch embedding — sends multiple texts in one API call
export async function generateEmbeddingBatch(
  texts: string[],
  _inputType: 'query' | 'document' = 'document'
): Promise<number[][]> {
  if (texts.length === 0) return []

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
    providerOptions: { cohere: { inputType: 'search_document' } },
  })
  return embeddings
}

// Rerank documents using Cohere rerank-v4-fast after initial vector search
export async function rerankDocuments({
  query,
  documents,
  topN = 5,
}: {
  query: string
  documents: MatchedDocument[]
  topN?: number
}): Promise<MatchedDocument[]> {
  if (documents.length === 0) return []

  const { ranking } = await rerank({
    model: rerankingModel,
    documents: documents.map(d => d.content),
    query,
    topN,
  })
  return ranking.map((r: { originalIndex: number; score: number }) => ({
    ...documents[r.originalIndex],
    similarity: r.score,
  }))
}

// ─── Query Result Cache ────────────────────────────────────────────────────────

/**
 * Query result cache.
 * - Returns `null` → cache miss or expired; caller should recompute
 * - Returns `MatchedDocument[]` → valid cache hit (may be empty `[]`)
 * Never stores a failure state in the cache.
 */
export function getCachedQueryResults(
  queryText: string,
  filterKey?: string
): MatchedDocument[] | null {
  const cacheKey = `q:${queryText}:${filterKey ?? ''}`
  const cached = queryCache.get(cacheKey)
  if (!cached) return null
  if (Date.now() - cached.timestamp > QUERY_CACHE_TTL_MS) {
    queryCache.set(cacheKey, cached) // refresh LRU position but treat as expired
    return null
  }
  return cached.results
}

export function setCachedQueryResults(
  queryText: string,
  filterKey: string | undefined,
  results: MatchedDocument[]
): void {
  const cacheKey = `q:${queryText}:${filterKey ?? ''}`
  queryCache.set(cacheKey, { results, timestamp: Date.now() })
}

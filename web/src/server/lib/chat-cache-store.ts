import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import type { UIMessage } from 'ai'
import { knowledgeBase } from '@/lib/knowledge-base'

const redis = Redis.fromEnv()

const CHAT_HISTORY_TTL_SECONDS = Number.parseInt(
  process.env.CHAT_HISTORY_TTL_SECONDS || `${14 * 24 * 60 * 60}`,
  10
)
const RAG_RETRIEVAL_CACHE_TTL_SECONDS = Number.parseInt(
  process.env.RAG_RETRIEVAL_CACHE_TTL_SECONDS || `${6 * 60 * 60}`,
  10
)
const CHAT_RESPONSE_CACHE_TTL_SECONDS = Number.parseInt(
  process.env.CHAT_RESPONSE_CACHE_TTL_SECONDS || `${24 * 60 * 60}`,
  10
)

function computeKbVersionFromKnowledgeBase(): string {
  const payload = JSON.stringify(
    knowledgeBase.map(doc => ({
      content: doc.content,
      metadata: doc.metadata,
    }))
  )
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 12)
  return `kb-${hash}`
}

export const KB_VERSION = process.env.RAG_KB_VERSION || computeKbVersionFromKnowledgeBase()

function hashText(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function normalizeQuery(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim()
}

function historyKey(chatId: string): string {
  return `chat:history:v1:${chatId}`
}

function retrievalKey(query: string): string {
  return `rag:retrieval:v1:${KB_VERSION}:${hashText(normalizeQuery(query))}`
}

function responseKey(query: string, model: string): string {
  return `chat:response:v1:${KB_VERSION}:${model}:${hashText(normalizeQuery(query))}`
}

function safeParseJson<T>(value: unknown): T | null {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function loadChatMessages(chatId: string): Promise<UIMessage[]> {
  try {
    const raw = await redis.get(historyKey(chatId))
    const parsed = safeParseJson<UIMessage[]>(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveChatMessages(chatId: string, messages: UIMessage[]): Promise<void> {
  try {
    await redis.setex(historyKey(chatId), CHAT_HISTORY_TTL_SECONDS, JSON.stringify(messages))
  } catch {
    // Do not fail request path when persistence is unavailable.
  }
}

export async function getCachedRetrievalContext(query: string): Promise<string | null> {
  try {
    const raw = await redis.get(retrievalKey(query))
    return typeof raw === 'string' ? raw : null
  } catch {
    return null
  }
}

export async function setCachedRetrievalContext(query: string, context: string): Promise<void> {
  try {
    await redis.setex(retrievalKey(query), RAG_RETRIEVAL_CACHE_TTL_SECONDS, context)
  } catch {
    // Best-effort cache.
  }
}

export async function getCachedResponse(
  query: string,
  model: string
): Promise<{ text: string; suggestion: string | null } | null> {
  try {
    const raw = await redis.get(responseKey(query, model))
    const parsed = safeParseJson<{ text: string; suggestion: string | null }>(raw)
    if (!parsed || typeof parsed.text !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export async function setCachedResponse(
  query: string,
  model: string,
  text: string,
  suggestion: string | null
): Promise<void> {
  try {
    await redis.setex(
      responseKey(query, model),
      CHAT_RESPONSE_CACHE_TTL_SECONDS,
      JSON.stringify({ text, suggestion })
    )
  } catch {
    // Best-effort cache.
  }
}

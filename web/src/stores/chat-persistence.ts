/**
 * Chat persistence store using @nanostores/persistent.
 *
 * - $chatId: stable conversation ID, shared across tabs (localStorage)
 * - $chatMessages: messages scoped to current tab (sessionStorage)
 */

import { atom } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'

const EXPIRATION_MS = 60 * 60 * 1000 // 1 hour — ponytail: change here if you need longer

// --- Chat ID (shared across tabs via localStorage) ---

export const $chatId = persistentAtom<string>('otherdev-chat-id', '', {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const val = JSON.parse(raw)
      return typeof val === 'string' ? val : ''
    } catch {
      return ''
    }
  },
})

let _chatIdInitialized = false

/** Call once on mount to ensure a stable chat ID exists. Idempotent on server. */
export function ensureChatId(): string {
  if (typeof window === 'undefined') return ''
  if (_chatIdInitialized) return $chatId.get()
  _chatIdInitialized = true
  const existing = $chatId.get()
  if (existing) return existing
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  $chatId.set(id)
  return id
}

// --- Chat Messages (tab-scoped via sessionStorage) ---

interface StoredMessages<T> {
  messages: T
  timestamp: number
}

function isExpired(ts: number): boolean {
  return Date.now() - ts > EXPIRATION_MS
}

function sessionEncode<T>(val: StoredMessages<T>): string {
  return JSON.stringify(val)
}

function sessionDecode<T>(raw: string): StoredMessages<T> {
  try {
    const stored: StoredMessages<T> = JSON.parse(raw)
    if (isExpired(stored.timestamp)) {
      return { messages: [] as T, timestamp: 0 }
    }
    return stored
  } catch {
    return { messages: [] as T, timestamp: 0 }
  }
}

// Manual sessionStorage-backed atom — ponytail: replace with persistentAtom sessionStorage
// support when @nanostores/persistent adds it.
export const $chatMessages = atom<StoredMessages<unknown>>({ messages: [], timestamp: 0 })

let _messagesInitialized = false

/** Load messages from sessionStorage into the atom. Call once on mount. */
export function loadChatMessagesFromStorage(): void {
  if (typeof window === 'undefined') return
  if (_messagesInitialized) return
  _messagesInitialized = true
  try {
    const raw = sessionStorage.getItem('otherdev-chat-messages')
    if (raw !== null) {
      $chatMessages.set(sessionDecode<unknown>(raw))
    }
  } catch {
    // ignore
  }
}

/** Sync messages to sessionStorage and update the atom. */
export function persistMessages(messages: unknown[]): void {
  const val: StoredMessages<unknown> = { messages, timestamp: Date.now() }
  $chatMessages.set(val)
  try {
    sessionStorage.setItem('otherdev-chat-messages', sessionEncode<unknown>(val))
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

/** Clear persisted messages (on user-initiated clear). */
export function clearPersistedMessages(): void {
  $chatMessages.set({ messages: [], timestamp: 0 })
  try {
    sessionStorage.removeItem('otherdev-chat-messages')
  } catch {
    // ignore
  }
}

/** Load messages from the atom. Returns the stored messages array. */
export function loadPersistedMessages<T>(): T[] {
  const stored = $chatMessages.get()
  return (stored.messages ?? []) as T[]
}

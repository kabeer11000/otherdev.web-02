/**
 * Chat UI state atoms.
 * Collapses scattered useState calls from chat-core.tsx into co-located stores.
 *
 * Per nanostores best practice: keep logic in stores, not components.
 */

import { atom } from 'nanostores'

// --- Input state ---

export const $inputValue = atom('')
export const $suggestion = atom('')
export const $inputError = atom('')
export const $attachments = atom<File[]>([])
export const $isDragging = atom(false)

// --- Recording state ---

export const $isRecording = atom(false)
export const $isRecordingProcessing = atom(false)

// --- Message editing & branching ---

export const $editingMessageId = atom<string | null>(null)

export type MessageBranchState = {
  snapshots: unknown[][]
  activeIndex: number
}

export const $messageBranches = atom<Map<string, MessageBranchState>>(new Map())

// --- Follow-up suggestions ---

export const $followUpSuggestions = atom<string[]>([])

// --- New message count (for scroll-to-bottom badge) ---

export const $newMessageCount = atom(0)

export function incrementNewMessageCount() {
  $newMessageCount.set($newMessageCount.get() + 1)
}

export function resetNewMessageCount() {
  $newMessageCount.set(0)
}

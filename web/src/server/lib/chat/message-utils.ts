import type { UIMessage } from 'ai'

/**
 * Replaces the message at messageId with the replacement message.
 * The replacement must have the same id to maintain conversation continuity.
 * Returns the sliced + replaced message array ready for re-streaming.
 */
export function replaceMessageAtId(
  messages: UIMessage[],
  messageId: string,
  replacement: UIMessage
): UIMessage[] {
  const index = messages.findIndex(m => m.id === messageId)
  if (index === -1) return messages
  messages.splice(index, 1, replacement)
  return messages
}

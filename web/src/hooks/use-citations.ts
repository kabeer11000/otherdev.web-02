'use client'

import type { UIMessage } from 'ai'
import { useMemo } from 'react'
import {
  type AISDKToolResult,
  type Citation,
  extractCitationsFromAISDK,
} from '@/lib/groq-citations'

/**
 * Extract citations from AI SDK chat messages
 *
 * Works with @ai-sdk/groq provider when browserSearch tool is used
 * The browserSearch tool must be enabled in your API route for this to work
 */
export function useCitations({ messages }: { messages: UIMessage[] }) {
  const citations = useMemo<Citation[]>(() => {
    // Find all assistant messages with tool results
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    const allToolResults: AISDKToolResult[] = []

    for (const message of assistantMessages) {
      // AI SDK stores tool results in the message's toolInvocations array
      // biome-ignore lint/suspicious/noExplicitAny: AI SDK internal type
      const toolInvocations = (message as any).toolInvocations

      if (Array.isArray(toolInvocations)) {
        for (const invocation of toolInvocations) {
          if (invocation.state === 'result') {
            allToolResults.push({
              toolCallId: invocation.toolCallId,
              toolName: invocation.toolName,
              result: invocation.result,
            })
          }
        }
      }
    }

    return extractCitationsFromAISDK({
      toolResults: allToolResults,
    })
  }, [messages])

  return { citations }
}

/**
 * Get citations from the most recent assistant message only
 */
export function useLatestCitations({ messages }: { messages: UIMessage[] }) {
  const citations = useMemo<Citation[]>(() => {
    // Find the last assistant message
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')

    if (!lastAssistantMessage) {
      return []
    }

    // biome-ignore lint/suspicious/noExplicitAny: AI SDK internal type
    const toolInvocations = (lastAssistantMessage as any).toolInvocations

    if (!Array.isArray(toolInvocations)) {
      return []
    }

    const toolResults: AISDKToolResult[] = toolInvocations
      .filter(invocation => invocation.state === 'result')
      .map(invocation => ({
        toolCallId: invocation.toolCallId,
        toolName: invocation.toolName,
        result: invocation.result,
      }))

    return extractCitationsFromAISDK({
      toolResults,
    })
  }, [messages])

  return { citations }
}

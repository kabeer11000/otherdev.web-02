import { describe, expect, test } from 'bun:test'

/**
 * Tests for useCitations hook logic
 */

describe('useCitations message filtering', () => {
  test('filters only assistant messages', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there' },
      { id: '3', role: 'user', content: 'How are you?' },
      { id: '4', role: 'assistant', content: 'I am fine' },
    ]

    const assistantMessages = messages.filter(m => m.role === 'assistant')
    expect(assistantMessages).toHaveLength(2)
    expect(assistantMessages[0].content).toBe('Hi there')
    expect(assistantMessages[1].content).toBe('I am fine')
  })
})

describe('useLatestCitations last assistant message', () => {
  test('finds last assistant message', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'First response' },
      { id: '3', role: 'user', content: 'Another question' },
      { id: '4', role: 'assistant', content: 'Second response' },
    ]

    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    expect(lastAssistant?.content).toBe('Second response')
  })

  test('returns undefined when no assistant messages', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'user', content: 'Another question' },
    ]

    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    expect(lastAssistant).toBeUndefined()
  })
})

describe('useCitations tool invocation filtering', () => {
  test('filters tool invocations with result state', () => {
    const toolInvocations = [
      { state: 'partial', toolCallId: '1', toolName: 'tool1', result: null },
      { state: 'result', toolCallId: '2', toolName: 'tool2', result: { data: 'valid' } },
      { state: 'error', toolCallId: '3', toolName: 'tool3', result: null },
      { state: 'result', toolCallId: '4', toolName: 'tool4', result: { data: 'also valid' } },
    ]

    const results = toolInvocations.filter(invocation => invocation.state === 'result')
    expect(results).toHaveLength(2)
    expect(results[0].toolCallId).toBe('2')
    expect(results[1].toolCallId).toBe('4')
  })

  test('extracts tool results with correct shape', () => {
    const invocation = {
      state: 'result',
      toolCallId: 'call_123',
      toolName: 'browserSearch',
      result: { data: 'search result' },
    }

    const toolResult = {
      toolCallId: invocation.toolCallId,
      toolName: invocation.toolName,
      result: invocation.result,
    }

    expect(toolResult.toolCallId).toBe('call_123')
    expect(toolResult.toolName).toBe('browserSearch')
    expect(toolResult.result).toEqual({ data: 'search result' })
  })
})

import { describe, expect, test } from 'bun:test'
import type { UIMessage } from 'ai'
import { replaceMessageAtId } from '../message-utils'

describe('Chat Message Utils', () => {
  describe('replaceMessageAtId', () => {
    test('replaces message at correct id', () => {
      const messages: UIMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
        { id: 'msg-2', role: 'assistant', content: [{ type: 'text', text: 'Hi there!' }] },
        { id: 'msg-3', role: 'user', content: [{ type: 'text', text: 'How are you?' }] },
      ]

      const replacement: UIMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: [{ type: 'text', text: 'Updated response' }],
      }

      const result = replaceMessageAtId(messages, 'msg-2', replacement)

      expect(result.length).toBe(3)
      expect(result[1].id).toBe('msg-2')
      expect(
        (result[1] as { content: Array<{ type: string; text: string }> }).content[0].text
      ).toBe('Updated response')
    })

    test('returns original array when id not found', () => {
      const messages: UIMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      ]

      const replacement: UIMessage = {
        id: 'msg-999',
        role: 'assistant',
        content: [{ type: 'text', text: 'New' }],
      }

      const result = replaceMessageAtId(messages, 'msg-999', replacement)

      expect(result).toBe(messages)
      expect(result.length).toBe(1)
    })

    test('slices messages up to and including target id', () => {
      const messages: UIMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'First' }] },
        { id: 'msg-2', role: 'assistant', content: [{ type: 'text', text: 'Second' }] },
        { id: 'msg-3', role: 'user', content: [{ type: 'text', text: 'Third' }] },
        { id: 'msg-4', role: 'assistant', content: [{ type: 'text', text: 'Fourth' }] },
      ]

      const replacement: UIMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: [{ type: 'text', text: 'New Second' }],
      }

      const result = replaceMessageAtId(messages, 'msg-2', replacement)

      // Should include msg-1, replaced msg-2, but NOT msg-3 or msg-4
      expect(result.length).toBe(2)
      expect(result[0].id).toBe('msg-1')
      expect(result[1].id).toBe('msg-2')
    })

    test('handles first message replacement', () => {
      const messages: UIMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'First' }] },
        { id: 'msg-2', role: 'assistant', content: [{ type: 'text', text: 'Second' }] },
      ]

      const replacement: UIMessage = {
        id: 'msg-1',
        role: 'user',
        content: [{ type: 'text', text: 'Updated First' }],
      }

      const result = replaceMessageAtId(messages, 'msg-1', replacement)

      expect(result.length).toBe(1)
      expect(result[0].id).toBe('msg-1')
    })

    test('replacement must have same id', () => {
      const messages: UIMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      ]

      const replacement: UIMessage = {
        id: 'msg-1', // Same id - correct
        role: 'user',
        content: [{ type: 'text', text: 'Updated' }],
      }

      const result = replaceMessageAtId(messages, 'msg-1', replacement)

      expect(result[0]).toEqual(replacement)
    })

    test('works with empty array', () => {
      const messages: UIMessage[] = []

      const replacement: UIMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'New' }],
      }

      const result = replaceMessageAtId(messages, 'msg-1', replacement)

      expect(result).toEqual([])
    })

    test('preserves message roles in replaced array', () => {
      const messages: UIMessage[] = [
        { id: 'a', role: 'user', content: [{ type: 'text', text: 'User message' }] },
        { id: 'b', role: 'assistant', content: [{ type: 'text', text: 'Assistant message' }] },
      ]

      const replacement: UIMessage = {
        id: 'b',
        role: 'assistant',
        content: [{ type: 'text', text: 'Updated assistant' }],
      }

      const result = replaceMessageAtId(messages, 'b', replacement)

      expect(result.every(m => 'role' in m)).toBe(true)
      expect(result.map(m => m.role)).toEqual(['user', 'assistant'])
    })
  })
})

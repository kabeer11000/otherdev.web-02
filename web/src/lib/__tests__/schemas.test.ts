import { describe, expect, test } from 'bun:test'
import { suggestionDataSchema } from '../schemas'

describe('suggestionDataSchema', () => {
  test('parses valid suggestion data', () => {
    const result = suggestionDataSchema.parse({ suggestion: 'Fix this typo' })
    expect(result.suggestion).toBe('Fix this typo')
  })

  test('rejects missing suggestion field', () => {
    expect(() => suggestionDataSchema.parse({})).toThrow()
  })

  test('rejects null input', () => {
    expect(() => suggestionDataSchema.parse(null)).toThrow()
  })

  test('rejects non-string suggestion', () => {
    expect(() => suggestionDataSchema.parse({ suggestion: 123 })).toThrow()
    expect(() => suggestionDataSchema.parse({ suggestion: true })).toThrow()
    expect(() => suggestionDataSchema.parse({ suggestion: {} })).toThrow()
  })

  test('accepts empty string', () => {
    const result = suggestionDataSchema.parse({ suggestion: '' })
    expect(result.suggestion).toBe('')
  })

  test('accepts whitespace-only string', () => {
    const result = suggestionDataSchema.parse({ suggestion: '   ' })
    expect(result.suggestion).toBe('   ')
  })

  test('accepts unicode characters', () => {
    const result = suggestionDataSchema.parse({ suggestion: 'こんにちは世界' })
    expect(result.suggestion).toBe('こんにちは世界')
  })

  test('accepts multiline string', () => {
    const result = suggestionDataSchema.parse({ suggestion: 'Line 1\nLine 2\nLine 3' })
    expect(result.suggestion).toBe('Line 1\nLine 2\nLine 3')
  })

  test('can infer SuggestionData type', () => {
    const data: { suggestion: string } = suggestionDataSchema.parse({ suggestion: 'test' })
    expect(data.suggestion).toBe('test')
  })
})

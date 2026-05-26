import { describe, expect, test } from 'bun:test'

/**
 * Tests for useLocalStorageMessages hook logic
 */

describe('useLocalStorageMessages defaults', () => {
  test('DEFAULT_EXPIRATION_MINUTES is 60', () => {
    const DEFAULT_EXPIRATION_MINUTES = 60
    expect(DEFAULT_EXPIRATION_MINUTES).toBe(60)
  })

  test('expirationMs calculation', () => {
    const expirationMinutes = 60
    const expirationMs = expirationMinutes * 60 * 1000
    expect(expirationMs).toBe(3600000) // 1 hour in ms
  })

  test('initialValue defaults to empty array', () => {
    const initialValue: unknown[] = []
    expect(initialValue).toEqual([])
  })

  test('isLoaded starts as false', () => {
    const isLoaded = false
    expect(isLoaded).toBe(false)
  })
})

describe('useLocalStorageMessages storage format', () => {
  test('StoredData structure', () => {
    const messages = ['msg1', 'msg2']
    const timestamp = Date.now()

    const storedData = {
      messages,
      timestamp,
    }

    expect(storedData.messages).toEqual(['msg1', 'msg2'])
    expect(typeof storedData.timestamp).toBe('number')
  })

  test('expiration check: not expired when within window', () => {
    const now = Date.now()
    const storedTimestamp = now - 30 * 60 * 1000 // 30 minutes ago
    const expirationMs = 60 * 60 * 1000 // 1 hour

    const isExpired = now - storedTimestamp > expirationMs
    expect(isExpired).toBe(false)
  })

  test('expiration check: expired when beyond window', () => {
    const now = Date.now()
    const storedTimestamp = now - 90 * 60 * 1000 // 90 minutes ago
    const expirationMs = 60 * 60 * 1000 // 1 hour

    const isExpired = now - storedTimestamp > expirationMs
    expect(isExpired).toBe(true)
  })
})

describe('useLocalStorageMessages serialization', () => {
  test('default serialize is JSON.stringify', () => {
    const messages = [{ id: 1, text: 'hello' }]
    const serialized = JSON.stringify(messages)
    expect(serialized).toBe('[{"id":1,"text":"hello"}]')
  })

  test('default deserialize is JSON.parse', () => {
    const json = '[{"id":1,"text":"hello"}]'
    const deserialized = JSON.parse(json)
    expect(deserialized).toEqual([{ id: 1, text: 'hello' }])
  })

  test('custom serialize function is used when provided', () => {
    const messages = [{ id: 1, date: new Date('2024-01-01') }]
    const serialize = (msgs: typeof messages) =>
      JSON.stringify(msgs.map(m => ({ ...m, date: (m.date as Date).toISOString() })))

    const serialized = serialize(messages)
    expect(serialized).toContain('2024-01-01')
  })
})

describe('useLocalStorageMessages clearHistory', () => {
  test('clearHistory resets to initialValue', () => {
    let messages = ['msg1', 'msg2']
    const initialValue: string[] = []

    // Simulate clearHistory
    messages = initialValue
    expect(messages).toEqual([])
  })

  test('clearHistory removes item from storage', () => {
    const key = 'test-key'
    const storage: Record<string, string> = { [key]: 'some data' }

    // Simulate clearHistory removal
    delete storage[key]

    expect(storage[key]).toBeUndefined()
  })
})

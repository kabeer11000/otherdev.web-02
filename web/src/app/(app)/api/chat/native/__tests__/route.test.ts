import { beforeEach, describe, expect, test, vi } from 'bun:test'
import { createJsonResponse } from '@/server/lib/api-helpers'
import { checkRateLimit } from '@/server/lib/rate-limit'

// Mock the rate-limit module
vi.mock('@/server/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getClientIdentifier: vi.fn().mockReturnValue('test-client'),
  REQUESTS_PER_WINDOW: 10,
}))

// Mock the chat module
vi.mock('@/server/lib/chat', () => ({
  handleStreamChat: vi.fn(),
}))

// Mock the AI SDK
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    validateUIMessages: vi.fn().mockResolvedValue([]),
  }
})

// Mock the tools
vi.mock('@/server/lib/chat/tools', () => ({
  createArtifactTool: vi.fn(),
  retrieveKnowledgeTool: vi.fn(),
  tavilySearchTool: vi.fn(),
}))

// Mock the schemas
vi.mock('@/lib/schemas', () => ({
  suggestionDataSchema: {},
}))

describe('POST /api/chat/native', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 400 when no messages provided', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('No messages provided')
  })

  test('returns 400 when messages array is missing', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  test('returns 400 when edit-message trigger without messageId', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
        trigger: 'edit-message',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('messageId')
  })

  test('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toContain('Too many requests')
  })

  test('returns 500 on unexpected error', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockRejectedValue(new Error('Redis connection failed'))

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('Internal server error')
  })

  test('validates message structure - rejects user message without parts', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  test('validates message structure - rejects user message with empty text', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: '   ' }] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  test('accepts valid user message with text part', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    const { handleStreamChat } = await import('@/server/lib/chat')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })
    vi.mocked(handleStreamChat).mockResolvedValue({
      result: null,
      response: createJsonResponse({ message: 'Hello!' }, 200),
      suggestions: [],
    })

    const response = await fetch('http://localhost/api/chat/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello!' }] }],
      }),
    })

    expect(response.ok).toBe(true)
  })
})

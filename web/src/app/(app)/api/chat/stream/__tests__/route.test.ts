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

describe('POST /api/chat/stream', () => {
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

    const response = await fetch('http://localhost/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('No messages provided')
  })

  test('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(429)
  })

  test('returns 400 for invalid message payload', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    // Mock validateUIMessages to throw TypeValidationError
    const { validateUIMessages } = await import('ai')
    const { TypeValidationError } = await import('ai')
    vi.mocked(validateUIMessages).mockRejectedValue(
      new TypeValidationError('Invalid message structure')
    )

    const response = await fetch('http://localhost/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: '' }] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid message payload')
  })

  test('returns 500 on unexpected error', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockRejectedValue(new Error('Redis connection failed'))

    const response = await fetch('http://localhost/api/chat/stream', {
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

  test('accepts valid streaming request', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    const { handleStreamChat } = await import('@/server/lib/chat')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    // Mock a streaming response
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"text","content":"Hello!"}\n\n'))
        controller.close()
      },
    })

    const mockResult = {
      consumeStream: vi.fn(),
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response(mockStream, {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      ),
    }

    vi.mocked(handleStreamChat).mockResolvedValue({
      result: mockResult as unknown as ReturnType<typeof handleStreamChat>['result'],
      response: null,
      suggestions: [],
    })

    const response = await fetch('http://localhost/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello!' }] }],
      }),
    })

    expect(response.ok).toBe(true)
    expect(response.headers.get('Content-Type')).toContain('text/event-stream')
  })

  test('returns 400 when edit-message trigger without messageId', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/stream', {
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

  test('filters empty user messages', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: '' }] }],
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })
})

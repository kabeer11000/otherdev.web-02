import { beforeEach, describe, expect, test, vi } from 'bun:test'

// Mock the AI SDK's transcribe function
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    transcribe: vi.fn(),
  }
})

// Mock @ai-sdk/groq
vi.mock('@ai-sdk/groq', () => ({
  groq: {
    transcription: vi.fn().mockReturnValue('whisper-large-v3-turbo'),
  },
}))

describe('POST /api/transcribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 400 when no audio file provided', async () => {
    const response = await fetch('http://localhost/api/transcribe', {
      method: 'POST',
      // Note: transcribe route uses formData, but we test the missing file case first
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('No audio file provided')
  })

  test('returns 400 when audio field is missing from FormData', async () => {
    const formData = new FormData()
    formData.append('notAudio', 'some file')

    const response = await fetch('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  test('returns streaming response with text/event-stream content type', async () => {
    const { transcribe } = await import('ai')
    vi.mocked(transcribe).mockResolvedValue({
      text: 'This is a test transcription',
    })

    // Create a minimal audio file
    const audioBuffer = new ArrayBuffer(128)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    const file = new File([audioBlob], 'test-audio.webm', { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('audio', file)

    const response = await fetch('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(true)
    expect(response.headers.get('Content-Type')).toContain('text/event-stream')
  })

  test('streams transcription in chunks', async () => {
    const { transcribe } = await import('ai')
    vi.mocked(transcribe).mockResolvedValue({
      text: 'Hello world this is a test transcription',
    })

    const audioBuffer = new ArrayBuffer(128)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    const file = new File([audioBlob], 'test-audio.webm', { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('audio', file)

    const response = await fetch('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(true)

    // Read the stream and verify SSE format
    const reader = response.body?.getReader()
    expect(reader).toBeDefined()

    const chunks: string[] = []
    let result
    while (!result?.done) {
      result = await reader!.read()
      if (result.value) {
        chunks.push(new TextDecoder().decode(result.value))
      }
    }

    // Verify we got transcript chunks
    const fullResponse = chunks.join('')
    expect(fullResponse).toContain('transcript-chunk')
    expect(fullResponse).toContain('transcript-complete')
    expect(fullResponse).toContain('[DONE]')
  })

  test('returns 500 when transcription fails', async () => {
    const { transcribe } = await import('ai')
    vi.mocked(transcribe).mockRejectedValue(new Error('Transcription API error'))

    const audioBuffer = new ArrayBuffer(128)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    const file = new File([audioBlob], 'test-audio.webm', { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('audio', file)

    const response = await fetch('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('Transcription failed')
  })

  test('handles empty transcription text', async () => {
    const { transcribe } = await import('ai')
    vi.mocked(transcribe).mockResolvedValue({
      text: '',
    })

    const audioBuffer = new ArrayBuffer(128)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    const file = new File([audioBlob], 'test-audio.webm', { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('audio', file)

    const response = await fetch('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(true)
    // Empty text should still produce valid SSE with done signal
    const reader = response.body?.getReader()
    const result = await reader?.read()
    expect(result?.done).toBe(false) // Should have data
  })
})

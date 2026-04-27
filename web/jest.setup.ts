import '@testing-library/jest-dom'

// Mock stream APIs needed by eventsource-parser (web streams polyfill)
class MockTransformStream {
  constructor(transform) {
    this.readable = new ReadableStream({
      start(controller) {
        // noop
      },
    })
    this.writable = new WritableStream({
      write(chunk) {
        // noop
      },
    })
  }
}

class MockReadableStream {
  constructor(underlyingSource) {
    this._underlyingSource = underlyingSource
  }
  getReader() {
    return {
      read: jest.fn(),
      releaseLock: jest.fn(),
    }
  }
  cancel() {}
}

class MockWritableStream {
  constructor(underlyingSink) {
    this._underlyingSink = underlyingSink
  }
  getWriter() {
    return {
      write: jest.fn(),
      releaseLock: jest.fn(),
    }
  }
  close() {}
  abort() {}
}

// Set up globals if not present
if (typeof global.TransformStream === 'undefined') {
  Object.defineProperty(global, 'TransformStream', {
    value: MockTransformStream,
    writable: true,
    configurable: true,
  })
}

if (typeof global.ReadableStream === 'undefined') {
  Object.defineProperty(global, 'ReadableStream', {
    value: MockReadableStream,
    writable: true,
    configurable: true,
  })
}

if (typeof global.WritableStream === 'undefined') {
  Object.defineProperty(global, 'WritableStream', {
    value: MockWritableStream,
    writable: true,
    configurable: true,
  })
}

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    h2: 'h2',
    button: 'button',
  },
  AnimatePresence: 'AnimatePresence',
}))

// Mock voice recorder
jest.mock('@/lib/voice-recorder', () => ({
  VoiceRecorder: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn().mockResolvedValue(new Blob()),
    release: jest.fn(),
  })),
  requestMicrophone: jest.fn().mockResolvedValue({
    getTracks: () => [],
    getAudioTracks: () => [{ stop: jest.fn() }],
  }),
}))

// Mock ai-sdk-attachments
jest.mock('@/lib/ai-sdk-attachments', () => ({
  processAttachment: jest.fn().mockResolvedValue({
    contentType: 'text/plain',
    url: 'blob:mock',
    name: 'test.txt',
  }),
}))

// Mock SSE parser
jest.mock('@/lib/sse', () => ({
  parseSSEStream: jest.fn(),
}))

// Mock constants
jest.mock('@/lib/constants', () => ({
  SUGGESTED_PROMPTS: [],
}))

// Mock @ai-sdk/react
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    sendMessage: jest.fn(),
    status: 'ready',
    setMessages: jest.fn(),
    addToolOutput: jest.fn(),
  })),
  DefaultChatTransport: jest.fn().mockImplementation(config => config),
  getToolName: jest.fn(),
  isToolUIPart: jest.fn(),
  lastAssistantMessageIsCompleteWithToolCalls: jest.fn(),
}))

// Mock 'ai' package (the main AI SDK)
jest.mock('ai', () => ({
  streamText: jest.fn(),
  createUIMessageStream: jest.fn(),
  createUIMessageStreamResponse: jest.fn(),
  stepCountIs: jest.fn(),
  tool: jest.fn(),
  validateUIMessages: jest.fn(),
  TypeValidationError: class TypeValidationError extends Error {},
}))

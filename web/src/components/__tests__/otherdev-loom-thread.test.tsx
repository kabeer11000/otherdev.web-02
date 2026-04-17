import { render, screen } from '@testing-library/react'
import { ChatCore } from '../chat-core'

// Mock framer-motion to avoid 30kb+ import issues
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    h2: 'h2',
    button: 'button',
  },
  AnimatePresence: 'AnimatePresence',
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

describe('ChatCore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders chat input field', () => {
    render(<ChatCore showGreeting={false} onArtifactOpen={jest.fn()} />)
    const input = screen.getByPlaceholderText(/type your message/i)
    expect(input).toBeInTheDocument()
  })

  it('renders send button', () => {
    render(<ChatCore showGreeting={false} onArtifactOpen={jest.fn()} />)
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeInTheDocument()
  })

  it('renders attach file button', () => {
    render(<ChatCore showGreeting={false} onArtifactOpen={jest.fn()} />)
    const attachButton = screen.getByRole('button', { name: /attach file/i })
    expect(attachButton).toBeInTheDocument()
  })

  it('renders voice mode button', () => {
    render(<ChatCore showGreeting={false} onArtifactOpen={jest.fn()} />)
    const voiceButton = screen.getByRole('button', { name: /voice mode/i })
    expect(voiceButton).toBeInTheDocument()
  })

  it('shows greeting when showGreeting is true', () => {
    render(<ChatCore showGreeting={true} onArtifactOpen={jest.fn()} />)
    expect(screen.getByText(/ask me anything about other dev/i)).toBeInTheDocument()
  })
})
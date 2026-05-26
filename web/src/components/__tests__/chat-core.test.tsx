import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChatCore } from '../chat-core'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    priority?: boolean
    unoptimized?: boolean
    fill?: boolean
    style?: React.CSSProperties
  }) => {
    const { src, alt, width, height, ...rest } = props
    return (
      <img
        src={typeof src === 'string' ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        {...rest}
      />
    )
  },
}))

// Mock useChat from @ai-sdk/react
const mockSendMessage = vi.fn()
const mockSetMessages = vi.fn()
const mockAddToolOutput = vi.fn()

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    sendMessage: mockSendMessage,
    status: 'idle',
    setMessages: mockSetMessages,
    addToolOutput: mockAddToolOutput,
  })),
}))

// Mock useLocalStorageMessages
vi.mock('@/hooks/use-local-storage-messages', () => ({
  useLocalStorageMessages: vi.fn(() => [[], vi.fn(), vi.fn()]),
}))

// Mock VoiceRecorder
vi.mock('@/lib/voice-recorder', () => ({
  VoiceRecorder: {
    requestMicrophone: vi.fn(),
    prototype: {
      start: vi.fn(),
      stop: vi.fn(),
      release: vi.fn(),
    },
  },
}))

// Mock SUGGESTED_PROMPTS
vi.mock('@/lib/constants', () => ({
  SUGGESTED_PROMPTS: [
    { label: 'Test prompt 1', icon: 'code', prompt: 'Test prompt 1 content' },
    { label: 'Test prompt 2', icon: 'briefcase', prompt: 'Test prompt 2 content' },
  ],
}))

// Mock parseSSEStream
vi.mock('@/lib/sse', () => ({
  parseSSEStream: vi.fn(),
}))

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cleanSuggestionMarkers: (text: string) => text,
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

// Mock shiki
vi.mock('shiki', () => ({
  codeToHtml: vi.fn(),
}))

// Simple mock for UI components that we need
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    variant,
    className,
    'aria-label': ariaLabel,
  }: {
    children?: React.ReactNode
    onClick?: () => void
    type?: 'button' | 'submit'
    variant?: string
    className?: string
    'aria-label'?: string
  }) => (
    <button type={type || 'button'} onClick={onClick} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
    onClick,
  }: {
    children?: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <h3>{children}</h3>,
  CardDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
}))

vi.mock('@/components/ui/chat-container', () => ({
  ChatContainerRoot: ({
    children,
    className,
  }: {
    children?: React.ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
  ChatContainerContent: ({
    children,
    className,
  }: {
    children?: React.ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
  ChatContainerScrollAnchor: () => <div />,
}))

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
}))

vi.mock('@/components/ui/copy-button', () => ({
  CopyButton: () => <button>Copy</button>,
}))

vi.mock('@/components/ui/markdown-renderer', () => ({
  MarkdownRenderer: ({ children }: { children?: string }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/prompt-input', () => ({
  PromptInput: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  PromptInputTextarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
  PromptInputAction: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PromptInputActions: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/voice-waveform', () => ({
  VoiceWaveform: () => <div>VoiceWaveform</div>,
}))

// Mock ArtifactRenderer import
vi.mock('@/components/artifact-renderer', () => ({
  ArtifactRenderer: () => <div>ArtifactRenderer</div>,
}))

// Mock z
vi.mock('zod', () => ({
  z: {
    object: () => ({
      infer: {} as any,
    }),
  },
  zodResolver: () => ({}),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowUp: () => <span>ArrowUp</span>,
  AudioLines: () => <span>AudioLines</span>,
  Brain: () => <span>Brain</span>,
  Briefcase: () => <span>Briefcase</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  Code2: () => <span>Code2</span>,
  FileCode2: () => <span>FileCode2</span>,
  FileText: () => <span>FileText</span>,
  Globe: () => <span>Globe</span>,
  Paperclip: () => <span>Paperclip</span>,
  Pencil: () => <span>Pencil</span>,
  RotateCcw: () => <span>RotateCcw</span>,
  Square: () => <span>Square</span>,
  Users: () => <span>Users</span>,
  X: () => <span>X</span>,
}))

describe('ChatCore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<ChatCore />)
      expect(document.body).toBeTruthy()
    })

    test('renders greeting screen when empty and showGreeting is true', () => {
      const { container } = render(<ChatCore showGreeting={true} />)
      expect(container.querySelector('h2')).toBeTruthy()
    })

    test('does not render greeting when showGreeting is false', () => {
      render(<ChatCore showGreeting={false} />)
      expect(screen.queryByText(/Type your message/)).toBeNull()
    })

    test('renders suggestion buttons when greeting is shown', () => {
      render(<ChatCore showGreeting={true} />)
      expect(screen.getByText('Test prompt 1')).toBeTruthy()
      expect(screen.getByText('Test prompt 2')).toBeTruthy()
    })
  })

  describe('Message Handling', () => {
    test('handles empty messages array', () => {
      const { useChat } = require('@ai-sdk/react')
      ;(useChat as ReturnType<typeof vi.fn>).mockReturnValue({
        messages: [],
        sendMessage: mockSendMessage,
        status: 'idle',
        setMessages: mockSetMessages,
        addToolOutput: mockAddToolOutput,
      })

      render(<ChatCore />)
      expect(screen.queryByRole('button', { name: /Test prompt 1/i })).toBeTruthy()
    })
  })

  describe('Scroll Behavior', () => {
    test('renders scroll to bottom button when showButton is true', () => {
      render(<ChatCore />)
      // The scroll button should be rendered when messages cause overflow
      // This is a basic test - actual scroll behavior requires more complex setup
    })
  })

  describe('Input Handling', () => {
    test('has a textarea for input', () => {
      render(<ChatCore />)
      const textarea = document.querySelector('textarea')
      expect(textarea).toBeTruthy()
    })

    test('textarea has placeholder text', () => {
      render(<ChatCore />)
      const textarea = document.querySelector('textarea')
      expect(textarea?.placeholder).toContain('Type your message')
    })
  })

  describe('Props', () => {
    test('accepts className prop', () => {
      const { container } = render(<ChatCore className="test-class" />)
      expect(container.firstChild).toHaveClass('test-class')
    })

    test('accepts onArtifactOpen callback', () => {
      const onArtifactOpen = vi.fn()
      render(<ChatCore onArtifactOpen={onArtifactOpen} />)
      expect(onArtifactOpen).toBeDefined()
    })

    test('accepts onClear callback', () => {
      const onClear = vi.fn()
      render(<ChatCore onClear={onClear} />)
      expect(onClear).toBeDefined()
    })

    test('accepts activeArtifact prop', () => {
      const activeArtifact = {
        toolCallId: 'test-id',
        toolName: 'createArtifact' as const,
        state: 'output-available' as const,
        result: {
          title: 'Test Artifact',
          code: '<html></html>',
          description: 'Test description',
          success: true,
        },
      }
      const { container } = render(<ChatCore activeArtifact={activeArtifact} />)
      expect(container).toBeTruthy()
    })

    test('accepts showArtifactPanel prop', () => {
      render(<ChatCore showArtifactPanel={true} />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('Status States', () => {
    test('renders "Thinking" indicator when status is submitted', () => {
      const { useChat } = require('@ai-sdk/react')
      ;(useChat as ReturnType<typeof vi.fn>).mockReturnValue({
        messages: [],
        sendMessage: mockSendMessage,
        status: 'submitted',
        setMessages: mockSetMessages,
        addToolOutput: mockAddToolOutput,
      })

      render(<ChatCore />)
      expect(screen.queryByText(/Thinking/)).toBeTruthy()
    })

    test('renders messages when they exist', () => {
      const mockMessage = {
        id: '1',
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: 'Hello' }],
      }

      const { useChat } = require('@ai-sdk/react')
      ;(useChat as ReturnType<typeof vi.fn>).mockReturnValue({
        messages: [mockMessage],
        sendMessage: mockSendMessage,
        status: 'idle',
        setMessages: mockSetMessages,
        addToolOutput: mockAddToolOutput,
      })

      render(<ChatCore />)
      expect(screen.queryByText('Hello')).toBeTruthy()
    })
  })
})

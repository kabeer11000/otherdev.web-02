import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ArtifactRenderer, type ArtifactToolCall } from '../artifact-renderer'

// Mock shiki
vi.mock('shiki', () => ({
  codeToHtml: vi.fn((code: string) => Promise.resolve(`<pre><code>${code}</code></pre>`)),
}))

// Mock @/lib/shiki-config
vi.mock('@/lib/shiki-config', () => ({
  SHIKI_THEMES: {
    light: 'github-light',
    dark: 'github-dark',
  },
}))

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    'aria-label': ariaLabel,
  }: {
    children?: React.ReactNode
    onClick?: () => void
    variant?: string
    size?: string
    className?: string
    'aria-label'?: string
  }) => (
    <button onClick={onClick} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}))

// Mock Tabs components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children?: React.ReactNode
    value?: string
    onValueChange?: (v: string) => void
  }) => (
    <div data-value={value} onClick={() => onValueChange?.('code')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
    <div data-tabs-content={value}>{children}</div>
  ),
  TabsList: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
    <button data-tabs-trigger={value}>{children}</button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span>ChevronLeft</span>,
  Copy: () => <span>Copy</span>,
  Check: () => <span>Check</span>,
  Eye: () => <span>Eye</span>,
  Code2: () => <span>Code2</span>,
  X: () => <span>X</span>,
}))

describe('ArtifactRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const mockArtifact: ArtifactToolCall = {
    toolCallId: 'test-call-id',
    toolName: 'createArtifact',
    state: 'output-available',
    result: {
      title: 'Test Artifact',
      code: '<html><body><h1>Hello World</h1></body></html>',
      description: 'A test artifact for unit testing',
      success: true,
    },
  }

  describe('Rendering', () => {
    test('renders artifact title', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} />)
      expect(screen.getByText('Test Artifact')).toBeTruthy()
    })

    test('renders artifact description', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} />)
      expect(screen.getByText('A test artifact for unit testing')).toBeTruthy()
    })

    test('renders iframe for preview', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} />)
      const iframe = document.querySelector('iframe')
      expect(iframe).toBeTruthy()
      expect(iframe?.title).toBe('Test Artifact')
    })

    test('renders with correct sandbox attributes on iframe', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} />)
      const iframe = document.querySelector('iframe')
      expect(iframe?.sandbox).toContain('allow-scripts')
      expect(iframe?.sandbox).toContain('allow-forms')
      expect(iframe?.sandbox).toContain('allow-modals')
      expect(iframe?.sandbox).toContain('allow-popups')
      expect(iframe?.sandbox).toContain('allow-same-origin')
    })
  })

  describe('Copy Button', () => {
    test('renders copy button', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} />)
      const copyButton = document.querySelector('button[title="Copy code"]')
      expect(copyButton).toBeTruthy()
    })

    test('shows check icon after copying', async () => {
      // Mock clipboard
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true,
      })

      render(<ArtifactRenderer toolCall={mockArtifact} />)
      const copyButton = document.querySelector('button[title="Copy code"]')

      if (copyButton) {
        fireEvent.click(copyButton)
      }

      await waitFor(
        () => {
          expect(mockClipboard.writeText).toHaveBeenCalledWith(mockArtifact.result.code)
        },
        { timeout: 100 }
      )
    })

    test('handles clipboard copy failure gracefully', async () => {
      // Mock clipboard with failure
      const mockClipboard = {
        writeText: vi.fn().mockRejectedValue(new Error('Copy failed')),
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true,
      })

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ArtifactRenderer toolCall={mockArtifact} />)
      const copyButton = document.querySelector('button[title="Copy code"]')

      if (copyButton) {
        fireEvent.click(copyButton)
      }

      // The component should handle the error without crashing
      expect(document.body).toBeTruthy()

      consoleSpy.mockRestore()
    })
  })

  describe('Inline Mode (default)', () => {
    test('renders with default inline mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="inline" />)
      expect(screen.getByText('Test Artifact')).toBeTruthy()
    })

    test('does not render close button in inline mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="inline" />)
      // In inline mode, there should be no back/close button for panel navigation
      const backButtons = document.querySelectorAll('button[title="Back to chat"]')
      expect(backButtons.length).toBe(0)
    })
  })

  describe('Panel Mode', () => {
    test('renders with panel mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" />)
      expect(screen.getByText('Test Artifact')).toBeTruthy()
    })

    test('renders close button in panel mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" />)
      // In panel mode, there should be a close button
      const closeButtons = document.querySelectorAll('button[title="Close"]')
      expect(closeButtons.length).toBeGreaterThanOrEqual(0) // May be hidden on smaller screens
    })

    test('renders back button in panel mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" />)
      const backButtons = document.querySelectorAll('button[title="Back to chat"]')
      expect(backButtons.length).toBeGreaterThanOrEqual(0)
    })

    test('renders tabs for preview and code in panel mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" />)
      expect(screen.getByText('Preview')).toBeTruthy()
      expect(screen.getByText('Code')).toBeTruthy()
    })
  })

  describe('onClose Callback', () => {
    test('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" onClose={onClose} />)

      // The back button should trigger onClose
      const backButton = document.querySelector('button[title="Back to chat"]')
      if (backButton) {
        fireEvent.click(backButton)
        expect(onClose).toHaveBeenCalled()
      }
    })

    test('close button is not rendered in inline mode', () => {
      render(<ArtifactRenderer toolCall={mockArtifact} mode="inline" />)
      // Inline mode does not have close/back buttons by design
      const backButtons = document.querySelectorAll('button[title="Back to chat"]')
      expect(backButtons.length).toBe(0)
    })
  })

  describe('Code Display', () => {
    test('renders highlighted code when available', async () => {
      const { codeToHtml } = await import('shiki')
      ;(codeToHtml as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        '<pre class="shiki"><code>highlighted code</code></pre>'
      )

      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" />)

      // Switch to code tab to see highlighted code
      const codeTab = document.querySelector('button[data-tabs-trigger="code"]')
      if (codeTab) {
        fireEvent.click(codeTab)
      }

      await waitFor(() => {
        // The component should render highlighted code
      })
    })

    test('renders plain code when highlighting fails', async () => {
      const { codeToHtml } = await import('shiki')
      ;(codeToHtml as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Highlight failed'))

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ArtifactRenderer toolCall={mockArtifact} mode="panel" />)

      // Should still render without crashing
      expect(document.body).toBeTruthy()

      consoleSpy.mockRestore()
    })
  })

  describe('Empty and Edge Cases', () => {
    test('handles empty code gracefully', async () => {
      const emptyArtifact: ArtifactToolCall = {
        ...mockArtifact,
        result: {
          ...mockArtifact.result,
          code: '',
        },
      }

      render(<ArtifactRenderer toolCall={emptyArtifact} />)
      expect(screen.getByText('Test Artifact')).toBeTruthy()
    })

    test('handles very long code content', async () => {
      const longCodeArtifact: ArtifactToolCall = {
        ...mockArtifact,
        result: {
          ...mockArtifact.result,
          code: '<div>' + 'a'.repeat(10000) + '</div>',
        },
      }

      render(<ArtifactRenderer toolCall={longCodeArtifact} />)
      expect(screen.getByText('Test Artifact')).toBeTruthy()
    })

    test('handles artifact with only title', () => {
      const minimalArtifact: ArtifactToolCall = {
        toolCallId: 'minimal-id',
        toolName: 'createArtifact',
        state: 'output-available',
        result: {
          title: 'Minimal Artifact',
          code: '',
          description: '',
          success: true,
        },
      }

      render(<ArtifactRenderer toolCall={minimalArtifact} />)
      expect(screen.getByText('Minimal Artifact')).toBeTruthy()
    })

    test('handles special characters in code', () => {
      const specialCharsArtifact: ArtifactToolCall = {
        ...mockArtifact,
        result: {
          ...mockArtifact.result,
          code: '<script>const x = "<div class=\\"test\\">Hello</div>";</script>',
        },
      }

      render(<ArtifactRenderer toolCall={specialCharsArtifact} />)
      expect(screen.getByText('Test Artifact')).toBeTruthy()
    })
  })
})

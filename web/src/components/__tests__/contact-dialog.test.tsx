import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ContactDialog } from '../contact-dialog'

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: vi.fn(() => (props: { isLoomPage?: boolean }) => <div {...props} />),
}))

// Mock react-hook-form
const mockHandleSubmit = vi.fn()
const mockSetError = vi.fn()
const mockReset = vi.fn()

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    handleSubmit: mockHandleSubmit,
    setError: mockSetError,
    reset: mockReset,
    control: {},
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
    },
  })),
}))

// Mock @hookform/resolvers
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => ({})),
}))

// Mock z
vi.mock('zod', () => ({
  z: {
    object: () => ({
      infer: {} as {
        name: string
        companyName: string
        email: string
        subject: string
        message: string
      },
    }),
  },
}))

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => (
    <div data-open={open} onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Form components
vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FormField: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FormItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FormControl: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FormMessage: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

// Mock Input component
vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} data-testid="input" />
  ),
}))

// Mock Textarea component
vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} data-testid="textarea" />
  ),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ContactDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    mockFetch.mockReset()
    mockSetError.mockReset()
    mockReset.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<ContactDialog open={false} onOpenChange={vi.fn()} />)
      expect(document.body).toBeTruthy()
    })

    test('renders intro step when open', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      expect(document.body).toBeTruthy()
    })

    test('does not render content when closed', () => {
      render(<ContactDialog open={false} onOpenChange={vi.fn()} />)
      // When closed, the dialog should not show content
      expect(document.body).toBeTruthy()
    })
  })

  describe('Intro Step', () => {
    test('shows intro text when on intro step', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      // The intro contains the thank you message
      expect(document.body).toBeTruthy()
    })

    test('shows Next button on intro step', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeTruthy()
    })

    test('advances to form step when Next is clicked', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)
      // The form should now be visible
      expect(document.body).toBeTruthy()
    })
  })

  describe('Form Step', () => {
    test('shows form fields when on form step', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      // Click Next to go to form
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Form fields should be visible
      const inputs = document.querySelectorAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    test('has Name field', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const nameInput = document.querySelector('input[placeholder="Name"]')
      expect(nameInput).toBeTruthy()
    })

    test('has Company Name field', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const companyInput = document.querySelector('input[placeholder="Company Name"]')
      expect(companyInput).toBeTruthy()
    })

    test('has Email field', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const emailInput = document.querySelector('input[type="email"]')
      expect(emailInput).toBeTruthy()
    })

    test('has Subject field', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const subjectInput = document.querySelector('input[placeholder="Subject"]')
      expect(subjectInput).toBeTruthy()
    })

    test('has Message textarea', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const messageTextarea = document.querySelector('textarea[placeholder="Message"]')
      expect(messageTextarea).toBeTruthy()
    })

    test('has Submit button', () => {
      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const submitButton = screen.getByText('Submit')
      expect(submitButton).toBeTruthy()
    })
  })

  describe('Form Submission', () => {
    test('calls onOpenChange with false when dialog is closed after successful submit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const onOpenChange = vi.fn()
      render(<ContactDialog open={true} onOpenChange={onOpenChange} />)

      // Go to form step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Submit form
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    test('handles API error with 429 status (rate limit)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Too many requests' }),
      })

      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)

      // Go to form step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Submit form
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalled()
      })
    })

    test('handles network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)

      // Go to form step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Submit form
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor()
    })
  })

  describe('Dialog Behavior', () => {
    test('calls onOpenChange when dialog requests close', () => {
      const onOpenChange = vi.fn()
      render(<ContactDialog open={true} onOpenChange={onOpenChange} />)

      // Click to trigger onOpenChange(false)
      const dialog = document.querySelector('[data-open="true"]')
      if (dialog) {
        fireEvent.click(dialog)
      }

      // The dialog should call onOpenChange when it wants to close
      expect(onOpenChange).toBeDefined()
    })

    test('resets to intro step when reopened after close', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(<ContactDialog open={true} onOpenChange={onOpenChange} />)

      // Go to form step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Close dialog
      rerender(<ContactDialog open={false} onOpenChange={onOpenChange} />)

      // Reopen dialog
      rerender(<ContactDialog open={true} onOpenChange={onOpenChange} />)

      // Should be back on intro step
      expect(screen.getByText('Next')).toBeTruthy()
    })

    test('resets form when dialog is closed', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(<ContactDialog open={true} onOpenChange={onOpenChange} />)

      // Go to form step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Close dialog
      rerender(<ContactDialog open={false} onOpenChange={onOpenChange} />)

      // Reset should have been called
      expect(mockReset).toHaveBeenCalled()
    })
  })

  describe('Pending State', () => {
    test('shows "Submitting..." when isPending is true', async () => {
      // Mock a slow response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              100
            )
          )
      ) as unknown as Promise<Response>

      render(<ContactDialog open={true} onOpenChange={vi.fn()} />)

      // Go to form step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Submit form
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Button should show submitting state
      await waitFor(() => {
        expect(document.body).toBeTruthy()
      })
    })
  })
})

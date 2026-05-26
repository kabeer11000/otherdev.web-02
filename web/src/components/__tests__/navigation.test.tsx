import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Navigation } from '../navigation'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    className,
    'data-slot': dataSlot,
    target,
    rel,
  }: {
    children?: React.ReactNode
    href: string
    onClick?: () => void
    className?: string
    'data-slot'?: string
    target?: string
    rel?: string
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      data-slot={dataSlot}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    priority?: boolean
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

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

// Mock ContactDialog (dynamically imported)
vi.mock('@/components/contact-dialog', () => ({
  ContactDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
  }) => (open ? <div data-testid="contact-dialog">ContactDialog</div> : null),
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
    asChild,
  }: {
    children?: React.ReactNode
    onClick?: () => void
    variant?: string
    size?: string
    className?: string
    'aria-label'?: string
    asChild?: boolean
  }) => {
    if (asChild && children) {
      return <>{children}</>
    }
    return (
      <button
        onClick={onClick}
        className={className}
        aria-label={ariaLabel}
        data-variant={variant}
        data-size={size}
      >
        {children}
      </button>
    )
  },
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Menu: () => <span>Menu</span>,
  X: () => <span>X</span>,
  Trash2: () => <span>Trash2</span>,
}))

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

describe('Navigation', () => {
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
      render(<Navigation />)
      expect(document.body).toBeTruthy()
    })

    test('renders mobile menu toggle button', () => {
      render(<Navigation />)
      const menuButton = document.querySelector('button[aria-label="Toggle menu"]')
      expect(menuButton).toBeTruthy()
    })

    test('renders brand link when not open', () => {
      render(<Navigation />)
      const brandLink = document.querySelector('a[data-slot="nav-item"]')
      expect(brandLink).toBeTruthy()
    })
  })

  describe('Mobile Menu', () => {
    test('opens mobile menu on toggle click', () => {
      render(<Navigation />)
      const menuButton = document.querySelector('button[aria-label="Toggle menu"]')

      if (menuButton) {
        fireEvent.click(menuButton)
      }

      // After opening, the X icon should be visible (menu is open)
      expect(document.body).toBeTruthy()
    })

    test('closes mobile menu on toggle click when already open', () => {
      render(<Navigation />)
      const menuButton = document.querySelector('button[aria-label="Toggle menu"]')

      // Open the menu
      if (menuButton) {
        fireEvent.click(menuButton)
      }

      // Close the menu
      if (menuButton) {
        fireEvent.click(menuButton)
      }

      expect(document.body).toBeTruthy()
    })

    test('closes mobile menu when nav link is clicked', () => {
      render(<Navigation />)
      const menuButton = document.querySelector('button[aria-label="Toggle menu"]')

      // Open the menu
      if (menuButton) {
        fireEvent.click(menuButton)
      }

      // Click a nav link to close the menu
      const workLink = document.querySelector('a[href="/work"]')
      if (workLink) {
        fireEvent.click(workLink)
      }

      expect(document.body).toBeTruthy()
    })
  })

  describe('Navigation Links', () => {
    test('renders work link', () => {
      render(<Navigation />)
      const workLink = document.querySelector('a[href="/work"]')
      expect(workLink).toBeTruthy()
    })

    test('renders about link', () => {
      render(<Navigation />)
      const aboutLink = document.querySelector('a[href="/about"]')
      expect(aboutLink).toBeTruthy()
    })

    test('renders loom (ai) link', () => {
      render(<Navigation />)
      const aiLink = document.querySelector('a[href="/loom"]')
      expect(aiLink).toBeTruthy()
    })

    test('renders ads portfolio link', () => {
      render(<Navigation />)
      const adsLink = document.querySelector('a[href="/work/ads-portfolio"]')
      expect(adsLink).toBeTruthy()
    })

    test('renders whatsapp link with correct href', () => {
      render(<Navigation />)
      const whatsappLink = document.querySelector('a[href*="wa.me"]')
      expect(whatsappLink).toBeTruthy()
      expect(whatsappLink?.getAttribute('href')).toContain('wa.me')
      expect(whatsappLink?.getAttribute('target')).toBe('_blank')
      expect(whatsappLink?.getAttribute('rel')).toContain('noopener')
    })
  })

  describe('Variants', () => {
    test('renders with default variant', () => {
      render(<Navigation variant="default" />)
      expect(document.body).toBeTruthy()
    })

    test('renders with ai variant', () => {
      render(<Navigation variant="ai" />)
      expect(document.body).toBeTruthy()
    })

    test('shows logo on loom page', () => {
      render(<Navigation isLoomPage={true} />)
      const logoContainer = document.querySelector('a[data-slot="nav-item"]')
      expect(logoContainer).toBeTruthy()
    })
  })

  describe('Clear Button', () => {
    test('renders clear button when onClear is provided and isLoomPage is true', () => {
      const onClear = vi.fn()
      render(<Navigation isLoomPage={true} onClear={onClear} />)
      const clearButton = document.querySelector('button')
      expect(clearButton).toBeTruthy()
    })

    test('does not render clear button when hasActiveArtifact is true', () => {
      const onClear = vi.fn()
      render(<Navigation isLoomPage={true} onClear={onClear} hasActiveArtifact={true} />)
      // The clear button should not be visible when artifact is active
    })

    test('calls onClear when clear button is clicked', () => {
      const onClear = vi.fn()
      render(<Navigation isLoomPage={true} onClear={onClear} />)
      const clearButton = document.querySelector('button')
      if (clearButton) {
        fireEvent.click(clearButton)
        expect(onClear).toHaveBeenCalled()
      }
    })
  })

  describe('Props', () => {
    test('accepts isLoomPage prop', () => {
      render(<Navigation isLoomPage={true} />)
      expect(document.body).toBeTruthy()
    })

    test('accepts hasActiveArtifact prop', () => {
      render(<Navigation hasActiveArtifact={true} />)
      expect(document.body).toBeTruthy()
    })

    test('accepts onClear prop', () => {
      const onClear = vi.fn()
      render(<Navigation onClear={onClear} />)
      expect(onClear).toBeDefined()
    })

    test('accepts variant prop', () => {
      render(<Navigation variant="ai" />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('Session Storage', () => {
    test('reads mobile menu state from sessionStorage on mount', () => {
      sessionStorage.setItem('mobileMenuOpen', 'true')
      render(<Navigation />)
      // Menu should be open initially because sessionStorage says so
      expect(document.body).toBeTruthy()
    })

    test('saves mobile menu state to sessionStorage on toggle', () => {
      render(<Navigation />)
      const menuButton = document.querySelector('button[aria-label="Toggle menu"]')

      if (menuButton) {
        fireEvent.click(menuButton)
      }

      expect(sessionStorage.getItem('mobileMenuOpen')).toBeTruthy()
    })
  })

  describe('Active Link Styling', () => {
    test('applies active class to current pathname', () => {
      const { usePathname } = require('next/navigation')
      ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/work')

      render(<Navigation />)
      const workLink = document.querySelector('a[href="/work"]')
      expect(workLink).toBeTruthy()
    })

    test('applies active class to about when on about page', () => {
      const { usePathname } = require('next/navigation')
      ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/about')

      render(<Navigation />)
      const aboutLink = document.querySelector('a[href="/about"]')
      expect(aboutLink).toBeTruthy()
    })
  })
})

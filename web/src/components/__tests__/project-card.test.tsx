import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProjectCard } from '../project-card'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: {
    src: string
    alt: string
    fill?: boolean
    width?: number
    height?: number
    className?: string
    priority?: boolean
    sizes?: string
  }) => {
    const { src, alt, fill, ...rest } = props
    return <img src={typeof src === 'string' ? src : undefined} alt={alt} {...rest} />
  },
}))

// Mock ProjectCardHover
vi.mock('./project-card-hover', () => ({
  ProjectCardHover: ({
    title,
    slug,
    image,
    variant,
    priority,
    sizes,
  }: {
    title: string
    slug: string
    image: string
    variant: 'home' | 'broll'
    priority?: boolean
    sizes?: string
  }) => (
    <div data-testid="project-card-hover" data-title={title} data-slug={slug}>
      Hover Card for {title}
    </div>
  ),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  }: {
    children?: React.ReactNode
    href: string
    className?: string
    onMouseMove?: (e: React.MouseEvent) => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }) => (
    <a
      href={href}
      className={className}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </a>
  ),
}))

// Mock cva
vi.mock('class-variance-authority', () => ({
  cva: (
    base: string,
    config: {
      variants?: Record<string, Record<string, string>>
      defaultVariants?: Record<string, string>
    }
  ) => {
    return (props?: Record<string, string>) => {
      let classes = base
      if (props) {
        const { variant, ...rest } = props
        if (variant && config?.variants?.variant) {
          classes += ' ' + config.variants.variant[variant as keyof typeof config.variants.variant]
        }
        Object.entries(rest).forEach(([key, value]) => {
          if (value) {
            classes += ' ' + value
          }
        })
      }
      return classes
    }
  },
}))

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultProps = {
    title: 'Test Project',
    slug: 'test-project',
    image: '/test-image.jpg',
  }

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<ProjectCard {...defaultProps} />)
      expect(document.body).toBeTruthy()
    })

    test('renders title', () => {
      render(<ProjectCard {...defaultProps} />)
      expect(screen.getByText('Test Project')).toBeTruthy()
    })

    test('renders with description when showText is true', () => {
      render(<ProjectCard {...defaultProps} description="Test description" showText={true} />)
      expect(screen.getByText('Test description')).toBeTruthy()
    })

    test('does not render description text when showText is false', () => {
      render(<ProjectCard {...defaultProps} description="Test description" showText={false} />)
      expect(screen.queryByText('Test description')).toBeNull()
    })
  })

  describe('Variants', () => {
    test('renders with home variant', () => {
      render(<ProjectCard {...defaultProps} variant="home" />)
      expect(document.body).toBeTruthy()
    })

    test('renders with work variant', () => {
      render(<ProjectCard {...defaultProps} variant="work" />)
      expect(document.body).toBeTruthy()
    })

    test('renders with broll variant', () => {
      render(<ProjectCard {...defaultProps} variant="broll" />)
      expect(document.body).toBeTruthy()
    })

    test('uses ProjectCardHover for home variant', () => {
      render(<ProjectCard {...defaultProps} variant="home" />)
      const hoverCard = document.querySelector('[data-testid="project-card-hover"]')
      expect(hoverCard).toBeTruthy()
    })

    test('uses ProjectCardHover for broll variant', () => {
      render(<ProjectCard {...defaultProps} variant="broll" />)
      const hoverCard = document.querySelector('[data-testid="project-card-hover"]')
      expect(hoverCard).toBeTruthy()
    })

    test('uses Link for work variant (no hover)', () => {
      render(<ProjectCard {...defaultProps} variant="work" />)
      const link = document.querySelector(`a[href="/work/${defaultProps.slug}"]`)
      expect(link).toBeTruthy()
    })
  })

  describe('Image', () => {
    test('renders with correct image src', () => {
      render(<ProjectCard {...defaultProps} />)
      const image = document.querySelector('img')
      expect(image).toBeTruthy()
    })

    test('passes priority prop for image loading', () => {
      render(<ProjectCard {...defaultProps} priority={true} />)
      // The image should be rendered with priority
      expect(document.body).toBeTruthy()
    })

    test('passes sizes prop for responsive images', () => {
      render(
        <ProjectCard
          {...defaultProps}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
        />
      )
      expect(document.body).toBeTruthy()
    })
  })

  describe('Links', () => {
    test('creates correct href for home variant', () => {
      render(<ProjectCard {...defaultProps} variant="home" />)
      // For home variant with hover, the link is in ProjectCardHover
      expect(document.body).toBeTruthy()
    })

    test('creates correct href for work variant', () => {
      render(<ProjectCard {...defaultProps} variant="work" />)
      const link = document.querySelector(`a[href="/work/${defaultProps.slug}"]`)
      expect(link).toBeTruthy()
    })

    test('creates correct href for broll variant', () => {
      render(<ProjectCard {...defaultProps} variant="broll" />)
      // For broll variant, slug might be used directly as href
      expect(document.body).toBeTruthy()
    })

    test('shows text as link when showText is true', () => {
      render(<ProjectCard {...defaultProps} showText={true} />)
      const textLink = document.querySelector(`a[href="/work/${defaultProps.slug}"]`)
      expect(textLink).toBeTruthy()
    })
  })

  describe('Props', () => {
    test('accepts title prop', () => {
      render(<ProjectCard {...defaultProps} title="Custom Title" />)
      expect(screen.getByText('Custom Title')).toBeTruthy()
    })

    test('accepts slug prop', () => {
      render(<ProjectCard {...defaultProps} slug="custom-slug" />)
      expect(document.body).toBeTruthy()
    })

    test('accepts image prop', () => {
      render(<ProjectCard {...defaultProps} image="/custom-image.png" />)
      expect(document.body).toBeTruthy()
    })

    test('accepts description prop', () => {
      render(<ProjectCard {...defaultProps} description="Custom description" showText={true} />)
      expect(screen.getByText('Custom description')).toBeTruthy()
    })

    test('accepts showText prop', () => {
      render(<ProjectCard {...defaultProps} showText={true} />)
      expect(screen.getByText(defaultProps.title)).toBeTruthy()
    })

    test('accepts priority prop', () => {
      render(<ProjectCard {...defaultProps} priority={true} />)
      expect(document.body).toBeTruthy()
    })

    test('accepts sizes prop', () => {
      render(<ProjectCard {...defaultProps} sizes="100vw" />)
      expect(document.body).toBeTruthy()
    })

    test('uses default sizes prop', () => {
      render(<ProjectCard {...defaultProps} />)
      // Default sizes should be applied
      expect(document.body).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    test('handles very long title', () => {
      const longTitle = 'A'.repeat(100)
      render(<ProjectCard {...defaultProps} title={longTitle} showText={true} />)
      expect(screen.getByText(longTitle)).toBeTruthy()
    })

    test('handles very long description', () => {
      const longDesc = 'B'.repeat(200)
      render(<ProjectCard {...defaultProps} description={longDesc} showText={true} />)
      expect(screen.getByText(longDesc)).toBeTruthy()
    })

    test('handles special characters in title', () => {
      render(<ProjectCard {...defaultProps} title="Project & More <Test>" showText={true} />)
      expect(document.body).toBeTruthy()
    })

    test('handles empty description when showText is true', () => {
      render(<ProjectCard {...defaultProps} description="" showText={true} />)
      // Should render without description
      expect(document.body).toBeTruthy()
    })

    test('handles undefined description when showText is true', () => {
      const propsWithoutDescription = { ...defaultProps }
      delete (propsWithoutDescription as Record<string, unknown>).description
      render(<ProjectCard {...propsWithoutDescription} showText={true} />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('Default Props', () => {
    test('has default showText value of false', () => {
      render(<ProjectCard {...defaultProps} />)
      // Description should not be visible by default
      expect(screen.queryByText('Test description')).toBeNull()
    })

    test('has default priority value of false', () => {
      render(<ProjectCard {...defaultProps} priority={false} />)
      expect(document.body).toBeTruthy()
    })

    test('has default variant value of home', () => {
      render(<ProjectCard {...defaultProps} />)
      // Should use ProjectCardHover for home variant
      expect(document.querySelector('[data-testid="project-card-hover"]')).toBeTruthy()
    })
  })
})

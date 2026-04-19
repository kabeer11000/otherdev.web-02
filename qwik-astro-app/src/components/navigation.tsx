/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  variant?: 'default' | 'ai'
  isLoomPage?: boolean
}

function NavigationComponent({ variant = 'default', isLoomPage = false }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pathname] = useState(typeof window !== 'undefined' ? window.location.pathname : '/')
  const isAIVariant = variant === 'ai'

  const navLinks = [
    { href: '/work', label: 'work' },
    { href: '/about', label: 'about' },
    { href: '/loom', label: 'ai' },
    { href: '/work/ads-portfolio', label: 'ads' },
  ]

  return (
    <nav className={cn(
      'fixed top-[15px] left-0 right-0 z-[60] px-3 pointer-events-none',
      isAIVariant ? '' : 'sm:block'
    )}>
      {/* Mobile Navigation */}
      <div
        className={cn(
          'flex items-center justify-between w-full pointer-events-auto relative z-50',
          isAIVariant ? '' : 'sm:hidden'
        )}
      >
        {/* Logo pill - hidden when menu open */}
        <div
          className={cn(
            'transition-all duration-200 origin-left',
            !isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          )}
        >
          <a
            href="/"
            className={cn(
              'h-[25px] px-3 py-1.5 text-[11.4px] font-twk rounded-full transition-colors',
              'backdrop-blur-sm bg-stone-200/70',
              'text-muted-foreground hover:text-foreground',
              pathname === '/' && 'text-foreground'
            )}
          >
            other dev
          </a>
        </div>

        {/* Menu button and links container */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Nav links - visible when menu open */}
          <div
            className={cn(
              'flex items-center gap-1.5 mr-2 transition-all duration-200',
              isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            )}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'h-[25px] px-3 py-1.5 text-[11.4px] font-twk rounded-full transition-colors',
                  'backdrop-blur-sm bg-stone-200/70',
                  'text-muted-foreground hover:text-foreground',
                  pathname.startsWith(link.href) && 'text-foreground'
                )}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'h-[25px] px-3 py-1.5 text-[11.4px] font-twk rounded-full transition-colors',
                'backdrop-blur-sm bg-stone-200/70',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              whatsapp
            </a>
          </div>

          {/* Hamburger/X Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className={cn(
              'h-[25px] w-[25px] flex items-center justify-center rounded-full transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-stone-200/50'
            )}
          >
            <div
              className={cn(
                'absolute transition-all duration-200',
                isOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
              )}
            >
              <X size={16} strokeWidth={1.5} />
            </div>
            <div
              className={cn(
                'transition-all duration-200',
                isOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
              )}
            >
              <Menu size={16} strokeWidth={1.5} />
            </div>
          </button>
        </div>
      </div>

      {/* Desktop Navigation */}
      {!isAIVariant && (
        <div className="hidden sm:flex items-center gap-1.5 pointer-events-auto">
          <a
            href="/"
            className={cn(
              'h-[25px] px-3 py-1.5 text-[11.4px] font-twk rounded-full transition-colors',
              'backdrop-blur-sm bg-stone-200/70',
              'text-muted-foreground hover:text-foreground',
              pathname === '/' && 'text-foreground'
            )}
          >
            other dev
          </a>
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'h-[25px] px-3 py-1.5 text-[11.4px] font-twk rounded-full transition-colors',
                'backdrop-blur-sm bg-stone-200/70',
                'text-muted-foreground hover:text-foreground',
                pathname.startsWith(link.href) && 'text-foreground'
              )}
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'h-[25px] px-3 py-1.5 text-[11.4px] font-twk rounded-full transition-colors',
              'backdrop-blur-sm bg-stone-200/70',
              'text-muted-foreground hover:text-foreground'
            )}
          >
            whatsapp
          </a>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-30 backdrop-blur-lg pointer-events-none',
            isAIVariant ? '' : 'sm:hidden'
          )}
        />
      )}
    </nav>
  )
}

export const Navigation = qwikify$(NavigationComponent)
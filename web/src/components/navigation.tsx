'use client'

import { Menu, Trash2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ContactDialog = dynamic(
  () => import('@/components/contact-dialog').then(mod => mod.ContactDialog),
  { ssr: false }
)

interface NavigationProps {
  variant?: 'default' | 'ai'
  isLoomPage?: boolean
  onClear?: () => void
  hasActiveArtifact?: boolean
}

export function Navigation({
  variant = 'default',
  isLoomPage = false,
  onClear,
  hasActiveArtifact = false,
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isAIVariant = variant === 'ai'

  useEffect(() => {
    const saved = sessionStorage.getItem('mobileMenuOpen')
    if (saved === 'true') {
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('mobileMenuOpen', isOpen.toString())
  }, [isOpen])

  const _handleContactClick = () => {
    setContactDialogOpen(true)
  }

  return (
    <nav className="fixed top-[15px] left-0 right-0 z-[60] px-3 pointer-events-none">
      <div
        className={cn(
          'flex items-center justify-between w-full pointer-events-auto relative z-50',
          isAIVariant ? '' : 'sm:hidden'
        )}
      >
        {!isOpen && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {isLoomPage ? (
              <Button
                variant="nav"
                size="icon"
                className={cn('flex items-center bg-transparent gap-1.5 rounded-full')}
              >
                <Image
                  src="/otherdev-chat-logo-32.webp"
                  alt="Other Dev"
                  width={16}
                  height={16}
                  className="object-contain"
                  priority
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Button>
            ) : (
              <Button
                asChild
                variant="nav"
                size="nav-default"
                className={pathname === '/' ? 'text-foreground' : ''}
              >
                <Link href="/" data-slot="nav-item">
                  other dev
                </Link>
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {isLoomPage && onClear && !hasActiveArtifact && (
            <Button
              variant="nav"
              size="nav-default"
              onClick={onClear}
              className={cn(
                'mr-2 bg-red-50/70 text-red-600 hover:text-red-700 hover:bg-red-100/70 flex items-center',
                isOpen && 'hidden'
              )}
            >
              <Trash2 size={12} strokeWidth={2} />
              clear
            </Button>
          )}
        </div>
        <Button
          variant="nav"
          size="nav-icon"
          onClick={() => setIsOpen(!isOpen)}
          data-slot="nav-item"
          className="text-foreground mr-2"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <span className="animate-in fade-in zoom-in-95 duration-200">
              <X size={16} strokeWidth={1.5} />
            </span>
          ) : (
            <span className="animate-in fade-in zoom-in-95 duration-200">
              <Menu size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>

        {isOpen && (
          <div
            key="menu-open"
            className="flex items-center gap-1.5 flex-1 animate-in fade-in duration-200"
          >
            <div
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: '100ms' }}
            >
              <Button
                asChild
                variant="nav"
                size="nav-mobile"
                className={pathname?.startsWith('/work') ? 'text-foreground' : ''}
              >
                <Link href="/work" data-slot="nav-item">
                  work
                </Link>
              </Button>
            </div>

            <div
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: '150ms' }}
            >
              <Button
                asChild
                variant="nav"
                size="nav-mobile"
                className={pathname?.startsWith('/about') ? 'text-foreground' : ''}
              >
                <Link href="/about" data-slot="nav-item">
                  about
                </Link>
              </Button>
            </div>
            <div
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: '200ms' }}
            >
              <Button
                asChild
                variant="nav"
                size="nav-mobile"
                className={pathname?.startsWith('/loom') ? 'text-foreground' : ''}
              >
                <Link href="/loom" data-slot="nav-item">
                  ai
                </Link>
              </Button>
            </div>
            <div
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: '250ms' }}
            >
              <Button
                asChild
                variant="nav"
                size="nav-mobile"
                className={pathname === '/work/ads-portfolio' ? 'text-foreground' : ''}
              >
                <Link href="/work/ads-portfolio" data-slot="nav-item">
                  ads
                </Link>
              </Button>
            </div>
            <div
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: '300ms' }}
            >
              <Button asChild variant="nav" size="nav-mobile-wide">
                <Link
                  href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
                  target="_blank"
                  rel="noopener noreferrer"
                  data-slot="nav-item"
                >
                  whatsapp
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isAIVariant && (
        <div className="hidden sm:flex items-center gap-1.5 pointer-events-auto">
          {isLoomPage ? (
            <div className="group flex items-center bg-transparent">
              <div className="overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:mr-1.5 w-0 opacity-0 mr-0 transition-all duration-200 ease-out">
                <Button
                  variant="nav"
                  size="nav-default"
                  onClick={() => router.push('/')}
                  className={cn(
                    'cursor-pointer whitespace-nowrap ' +
                      (pathname === '/' ? 'text-foreground' : '')
                  )}
                >
                  other dev
                </Button>
              </div>

              <div className="group-hover:opacity-0 transition-opacity duration-150 ease-out">
                <Link href="/" data-slot="nav-item">
                  <Image
                    src="/otherdev-chat-logo-32.webp"
                    alt="Other Dev"
                    width={16}
                    height={16}
                    className="object-contain"
                    priority
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </Link>
              </div>
            </div>
          ) : (
            <Button
              asChild
              variant="nav"
              size="nav-default"
              className={pathname === '/' ? 'text-foreground' : ''}
            >
              <Link href="/" data-slot="nav-item">
                other dev
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname?.startsWith('/work') ? 'text-foreground' : ''}
          >
            <Link href="/work" data-slot="nav-item">
              work
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname?.startsWith('/about') ? 'text-foreground' : ''}
          >
            <Link href="/about" data-slot="nav-item">
              about
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname?.startsWith('/loom') ? 'text-foreground' : ''}
          >
            <Link href="/loom" data-slot="nav-item">
              ai
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname === '/work/ads-portfolio' ? 'text-foreground' : ''}
          >
            <Link href="/work/ads-portfolio" data-slot="nav-item">
              ads
            </Link>
          </Button>

          <Button asChild variant="nav" size="nav-default">
            <Link
              href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
              target="_blank"
              rel="noopener noreferrer"
              data-slot="nav-item"
            >
              whatsapp
            </Link>
          </Button>
          {isLoomPage && onClear && !hasActiveArtifact && (
            <Button
              variant="nav"
              size="nav-default"
              onClick={onClear}
              className={cn(
                'ml-auto mr-2 bg-red-50/70 text-red-600 hover:text-red-700 hover:bg-red-100/70 flex items-center',
                isOpen && 'hidden'
              )}
            >
              <Trash2 size={12} strokeWidth={2} />
              clear
            </Button>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-30 bg-black/[.02] backdrop-blur-xs pointer-events-none',
            isAIVariant ? '' : 'sm:hidden'
          )}
        />
      )}

      <ContactDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} />
    </nav>
  )
}

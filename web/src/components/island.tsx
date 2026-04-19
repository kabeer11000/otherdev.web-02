import type { ComponentType } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IslandProps extends Props {
  // React islands in @qwikdev/astro are configured via the astro.config
  // This is a placeholder for future React island usage
}

export function Island({ children, className }: IslandProps) {
  return (
    <div className={className} data-island>
      {children}
    </div>
  )
}

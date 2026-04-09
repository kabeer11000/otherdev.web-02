'use client'

import { Separator } from '@base-ui/react/separator'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function SeparatorComponent({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof Separator> & {
  decorative?: boolean
}) {
  return (
    <Separator
      data-slot="separator"
      aria-hidden={decorative || undefined}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  )
}

export { SeparatorComponent as Separator }

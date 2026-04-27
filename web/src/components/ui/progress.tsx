'use client'

import { Progress } from '@base-ui/react/progress'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function ProgressRoot({ className, value, ...props }: React.ComponentProps<typeof Progress.Root>) {
  return (
    <Progress.Root
      data-slot="progress"
      value={value}
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <Progress.Track data-slot="progress-track" className="h-full w-full">
        <Progress.Indicator
          data-slot="progress-indicator"
          className="bg-primary h-full transition-all"
          style={{ width: `${value ?? 0}%` }}
        />
      </Progress.Track>
    </Progress.Root>
  )
}

export { ProgressRoot as Progress }

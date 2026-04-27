'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import type * as React from 'react'

import { cn } from '@/lib/utils'

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollArea.Root> {
  viewportRef?: React.RefObject<HTMLDivElement | null>
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
  onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void
}

function ScrollAreaRoot({
  className,
  children,
  viewportRef,
  onScroll,
  onTouchStart,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollArea.Root data-slot="scroll-area" className={cn('relative', className)} {...props}>
      <ScrollArea.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        onScroll={onScroll}
        onTouchStart={onTouchStart}
      >
        {children}
      </ScrollArea.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollArea.Corner />
    </ScrollArea.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollArea.Scrollbar>) {
  return (
    <ScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
        className
      )}
      {...props}
    >
      <ScrollArea.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-[rgba(174,86,48,0.3)] hover:bg-[rgba(174,86,48,0.5)] transition-colors dark:bg-[rgba(174,86,48,0.4)] dark:hover:bg-[rgba(174,86,48,0.6)]"
      />
    </ScrollArea.Scrollbar>
  )
}

export { ScrollAreaRoot as ScrollArea, ScrollBar }

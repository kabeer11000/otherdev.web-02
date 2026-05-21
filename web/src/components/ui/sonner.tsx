'use client'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          '--error-bg': 'oklch(0.55 0.2 25)',
          '--error-text': 'oklch(0.985 0.001 106)',
          '--error-border': 'oklch(0.45 0.18 25)',
          '--success-bg': 'oklch(0.55 0.15 145)',
          '--success-text': 'oklch(0.985 0.001 106)',
          '--success-border': 'oklch(0.45 0.12 145)',
          '--warning-bg': 'oklch(0.75 0.15 85)',
          '--warning-text': 'oklch(0.2 0.02 80)',
          '--warning-border': 'oklch(0.65 0.12 85)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

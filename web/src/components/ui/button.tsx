import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[11.4px] font-twk font-normal tracking-[-0.24px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] active:bg-[#3a3a3a]',
        nav: 'bg-transparent text-[#686868] hover:bg-neutral-200',
        ghost: 'bg-transparent text-[#686868] hover:bg-neutral-100',
        link: 'bg-transparent text-[#686868] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        'nav-default': 'h-[25px] px-3 py-1.5',
        'nav-icon': 'h-[25px] w-[25px] p-0',
        'nav-mobile': 'h-[25px] px-3 py-1.5',
        'nav-mobile-wide': 'h-[25px] px-4 py-1.5',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

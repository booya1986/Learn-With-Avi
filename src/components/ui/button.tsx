'use client'

import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-green-500 text-[#0a2812] font-semibold shadow hover:bg-green-400 hover:shadow-[var(--glow-success-sm)]',
        destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
        outline: 'border border-green-500/30 bg-transparent text-green-400 hover:bg-green-500/10 hover:border-green-500/60',
        secondary: 'bg-gray-800 text-gray-200 shadow-sm hover:bg-gray-700',
        ghost: 'hover:bg-gray-800 hover:text-green-400',
        link: 'text-green-400 underline-offset-4 hover:underline',
        'orbyto-primary': 'bg-green-500 text-[#0a2812] font-bold shadow hover:bg-green-400 hover:shadow-[var(--glow-success-md)] active:scale-[0.98]',
        'orbyto-secondary': 'bg-transparent border border-green-500/40 text-green-400 hover:bg-green-500/10 hover:border-green-500/70 hover:shadow-[var(--glow-success-sm)]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        orbyto: 'h-11 px-6 py-2.5 rounded-lg text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

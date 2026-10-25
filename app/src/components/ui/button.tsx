import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[.985]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-card hover:bg-primary/90',
        soft: 'bg-primary-soft text-primary hover:bg-primary/10',
        outline: 'border border-line bg-surface text-ink hover:border-primary/40 hover:text-primary',
        ghost: 'text-muted hover:bg-ink/[.04] hover:text-ink',
        danger: 'bg-warn/10 text-warn hover:bg-warn/15',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'

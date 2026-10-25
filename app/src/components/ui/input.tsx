import * as React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[13.5px] text-ink placeholder:text-muted/70',
        'transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

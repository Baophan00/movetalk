import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'neutral' | 'primary' | 'ok' | 'warn' | 'accent'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink/[.05] text-muted',
  primary: 'bg-primary-soft text-primary',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  accent: 'bg-accent/10 text-[#b45309]',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

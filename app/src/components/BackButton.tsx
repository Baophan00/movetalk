import { ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * One Back control for every nested screen. It steps through the app's own history, so a learner who
 * came from Today returns to Today, and one who deep-linked into a lesson lands on its parent instead
 * of leaving MOVE. `to` only names the destination for screen readers.
 */
export function BackButton({ onClick, to, className }: { onClick: () => void; to?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={to ? `Back to ${to}` : 'Back'}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-2 text-[12px] font-semibold text-ink transition hover:border-primary/40 hover:text-primary active:scale-[.97] sm:px-3',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  )
}

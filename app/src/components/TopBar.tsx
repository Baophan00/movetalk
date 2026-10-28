import { Menu } from 'lucide-react'
import { SfxToggle } from './SfxToggle'
import { BackButton } from './BackButton'
import { cn } from '../lib/utils'

type Props = {
  title: string
  crumb?: string
  onMenu: () => void
  onBack?: () => void
  backTo?: string
  right?: React.ReactNode
  className?: string
}

export function TopBar({ title, crumb, onMenu, onBack, backTo, right, className }: Props) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line/80 bg-bg/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8',
        className,
      )}
    >
      {/* A nested screen leads with Back; the drawer stays one tap away behind the menu. */}
      {onBack ? (
        <BackButton onClick={onBack} to={backTo} />
      ) : (
        <button onClick={onMenu} className="rounded-lg p-2 text-ink/70 hover:bg-ink/5 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0">
        {crumb && <p className="truncate text-[11px] font-medium uppercase tracking-[.12em] text-muted">{crumb}</p>}
        <h1 className="truncate text-[15px] font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {onBack && (
          <button onClick={onMenu} className="rounded-lg p-2 text-ink/70 hover:bg-ink/5 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <SfxToggle />
        {right}
      </div>
    </header>
  )
}

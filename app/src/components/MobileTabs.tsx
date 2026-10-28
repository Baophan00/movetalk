import { Compass, Home, Sparkles, TrendingUp, UserRound } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Route } from './Sidebar'

const TABS: { key: Route; label: string; icon: typeof Home }[] = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'lessons', label: 'Class', icon: Compass },
  { key: 'study', label: 'Practice', icon: Sparkles },
  { key: 'progress', label: 'Progress', icon: TrendingUp },
  { key: 'profile', label: 'Profile', icon: UserRound },
]

/** Phones get a reachable bar at the bottom; the sidebar drawer stays for menus and sign-out. */
export function MobileTabs({ route, onNav }: { route: Route; onNav: (r: Route) => void }) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((t) => {
          const on = route === t.key || (t.key === 'lessons' && route === 'lesson')
          const Icon = t.icon
          return (
            <li key={t.key} className="flex-1">
              <button
                onClick={() => onNav(t.key)}
                className={cn(
                  'flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5 transition active:scale-95',
                  on ? 'text-primary' : 'text-muted',
                )}
              >
                <span className={cn('grid h-8 w-12 place-items-center rounded-xl transition', on && 'bg-primary-soft')}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={on ? 2.4 : 2} />
                </span>
                <span className={cn('text-[10.5px] font-semibold tracking-tight', on ? 'text-primary' : 'text-muted')}>{t.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

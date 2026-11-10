import { motion } from 'motion/react'
import { BookOpen, CalendarDays, ClipboardList, Compass, GraduationCap, Home, Library, LogOut, PenLine, Mic, UserRound, Users, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '../lib/utils'

export type Route =
  | 'landing'
  | 'today'
  | 'study'
  | 'progress'
  | 'words'
  | 'mistakes'
  | 'dashboard'
  | 'lessons'
  | 'lesson'
  | 'season1'
  | 'lesson-l01'
  | 'lesson-l02'
  | 'lesson-l03'
  | 'lesson-l04'
  | 'lesson-l05'
  | 'lesson-l06'
  | 'lesson-l07'
  | 'lesson-l08'
  | 'lesson-l09'
  | 'lesson-l10'
  | 'speak-l01'
  | 'speaking30'
  | 'class-practice'
  | 'cefr'
  | 'homework'
  | 'library'
  | 'review'
  | 'practice'
  | 'profile'
  | 't-overview'
  | 't-lesson'
  | 't-schedule'
  | 't-students'
  | 't-assignments'
  | 't-writing'
  | 't-speaking'

export type Role = 'student' | 'teacher'

type NavItem = { key: Route; label: string; icon: typeof Home }

const STUDENT_NAV: NavItem[] = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'lessons', label: 'Class practice', icon: Compass },
  { key: 'speaking30', label: '30 Days Speaking', icon: Mic },
  { key: 'profile', label: 'Profile', icon: UserRound },
]

const TEACHER_NAV: NavItem[] = [
  { key: 't-overview', label: 'Overview', icon: Home },
  { key: 't-lesson', label: 'Lesson', icon: BookOpen },
  { key: 't-schedule', label: 'Schedule', icon: CalendarDays },
  { key: 't-students', label: 'Students', icon: Users },
  { key: 't-assignments', label: 'Assignments', icon: ClipboardList },
  { key: 't-writing', label: 'Writing', icon: PenLine },
  { key: 't-speaking', label: 'Speaking', icon: Mic },
]

type Props = {
  role: Role
  route: Route
  onNav: (r: Route) => void
  open: boolean
  onClose: () => void
  user: { name: string; email: string }
  onSignOut: () => void
  onSwitchRole: () => void
  canSwitch: boolean
  total: number
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ role, route, onNav, open, onClose, user, onSignOut, onSwitchRole, canSwitch, total, collapsed = false, onToggleCollapse }: Props) {
  const items = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/25 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-all duration-300 ease-in-out lg:translate-x-0',
          collapsed ? 'w-[80px]' : 'w-[264px]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center pt-5', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
          <button onClick={() => onNav('landing')} className="focus-ring flex items-center gap-2.5 rounded-xl" title={collapsed ? 'MOVE' : undefined}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-[15px] font-bold text-white">M</span>
            {!collapsed && (
              <span className="text-left leading-tight">
                <span className="block text-[15px] font-bold tracking-tight">MOVE</span>
                <span className="block text-[11px] text-muted">English you can use</span>
              </span>
            )}
          </button>
          {/* Toggle button - desktop only */}
          {onToggleCollapse && !collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-lg p-1.5 text-muted hover:bg-ink/5 hover:text-ink lg:block"
              aria-label="Collapse sidebar"
              title="Collapse"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-ink/5 lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toggle button when collapsed - positioned at top */}
        {onToggleCollapse && collapsed && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="rounded-lg p-1.5 text-muted hover:bg-ink/5 hover:text-ink"
              aria-label="Expand sidebar"
              title="Expand"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Student/Teacher switcher */}
        {canSwitch && !collapsed && (
          <div className="mx-4 mt-4 flex rounded-xl bg-bg p-1">
            <button
              onClick={() => role !== 'student' && onSwitchRole()}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition-colors',
                role === 'student' ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
              )}
            >
              Student
            </button>
            <button
              onClick={() => role !== 'teacher' && onSwitchRole()}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition-colors',
                role === 'teacher' ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
              )}
            >
              Teacher
            </button>
          </div>
        )}

        <nav className={cn('mt-4 flex-1 overflow-y-auto pb-4', collapsed ? 'px-2' : 'px-3')}>
          <ul className="space-y-1">
            {items.map(({ key, label, icon: Icon }) => {
              const active = route === key
              return (
                <li key={key} className="relative group">
                  <button
                    onClick={() => onNav(key)}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex w-full items-center rounded-xl text-left text-[13.5px] font-medium transition-colors',
                      collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2.5',
                      active
                        ? 'bg-primary-soft font-semibold text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/.18)]'
                        : 'text-ink/75 hover:bg-ink/[.04] hover:text-ink',
                    )}
                  >
                    <Icon className={cn('h-[17px] w-[17px] shrink-0', active ? 'text-primary' : 'text-muted group-hover:text-ink')} strokeWidth={2.1} />
                    {!collapsed && (
                      <>
                        {label}
                        {active && <motion.span layoutId="nav-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                      </>
                    )}
                  </button>
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      {label}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          {role === 'student' && !collapsed && (
            <>
              <p className="mt-6 px-2 pb-2 text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">Level</p>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => onNav('lessons')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-ink/[.04]">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-[10.5px] font-bold text-primary">A1</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink/85">Activate 1</span>
                      <span className="block truncate text-[11px] text-muted">{total} lessons open</span>
                    </span>
                  </button>
                </li>
                <li>
                  <div className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 opacity-55">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink/[.05] text-[10.5px] font-bold text-ink/70">A2</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink/85">Activate 2</span>
                      <span className="block truncate text-[11px] text-muted">In preparation</span>
                    </span>
                  </div>
                </li>
              </ul>
            </>
          )}

          {role === 'teacher' && !collapsed && (
            <div className="mt-6 rounded-2xl border border-line bg-bg/60 p-3.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Teaching
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                12 learners, 24 sessions a week. The schedule is a weekly template you can change per date.
              </p>
              <button onClick={() => onNav('t-schedule')} className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary">
                <Library className="h-3 w-3" /> Open the week
              </button>
            </div>
          )}
        </nav>

        <div className={cn('border-t border-line', collapsed ? 'p-2' : 'p-3')}>
          <div className={cn('flex items-center rounded-xl', collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2 py-2')}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary" title={collapsed ? user.name : undefined}>
              {user.name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[12.5px] font-semibold">{user.name.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                  <span className="block truncate text-[11px] text-muted">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
                </span>
                <button onClick={onSignOut} className="rounded-lg p-1.5 text-muted hover:bg-ink/5 hover:text-warn" aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

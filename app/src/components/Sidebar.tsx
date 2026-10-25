import { motion } from 'motion/react'
import {
  BookOpen, CalendarDays, ClipboardList, Compass, GraduationCap, Home, Layers,
  Library, LogOut, Sparkles, Users, X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Ring } from './ui/progress'

export type Route =
  | 'landing'
  | 'dashboard'
  | 'lesson'
  | 'homework'
  | 'library'
  | 't-overview'
  | 't-schedule'
  | 't-students'
  | 't-assignments'

export type Role = 'student' | 'teacher'

type NavItem = { key: Route; label: string; icon: typeof Home }

const STUDENT_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Overview', icon: Home },
  { key: 'lesson', label: 'Lessons', icon: Compass },
  { key: 'library', label: 'Review', icon: Layers },
  { key: 'homework', label: 'Homework', icon: BookOpen },
]

const TEACHER_NAV: NavItem[] = [
  { key: 't-overview', label: 'Overview', icon: Home },
  { key: 't-schedule', label: 'Schedule', icon: CalendarDays },
  { key: 't-students', label: 'Students', icon: Users },
  { key: 't-assignments', label: 'Assignments', icon: ClipboardList },
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
  done: number
  total: number
}

export function Sidebar({ role, route, onNav, open, onClose, user, onSignOut, onSwitchRole, done, total }: Props) {
  const items = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/25 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <button onClick={() => onNav('landing')} className="focus-ring flex items-center gap-2.5 rounded-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[15px] font-bold text-white">M</span>
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-bold tracking-tight">MOVE</span>
              <span className="block text-[11px] text-muted">English you can use</span>
            </span>
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-ink/5 lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

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

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {items.map(({ key, label, icon: Icon }) => {
              const active = route === key
              return (
                <li key={key}>
                  <button
                    onClick={() => onNav(key)}
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors',
                      active ? 'bg-primary-soft text-primary' : 'text-ink/75 hover:bg-ink/[.04] hover:text-ink',
                    )}
                  >
                    <Icon className={cn('h-[17px] w-[17px]', active ? 'text-primary' : 'text-muted group-hover:text-ink')} strokeWidth={2.1} />
                    {label}
                    {active && <motion.span layoutId="nav-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>

          {role === 'student' && (
            <>
              <p className="mt-6 px-2 pb-2 text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">Level</p>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => onNav('lesson')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-ink/[.04]">
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

              <div className="mt-6 rounded-2xl border border-line bg-bg/60 p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-accent" /> This week
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative grid place-items-center">
                    <Ring value={(done / Math.max(1, total)) * 100} size={44} stroke={4} />
                    <span className="absolute text-[10px] font-bold text-ink">{done}/{total}</span>
                  </div>
                  <p className="text-[11.5px] leading-snug text-muted">lessons opened. One part a day is enough.</p>
                </div>
              </div>
            </>
          )}

          {role === 'teacher' && (
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

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-semibold">{user.name}</span>
              <span className="block truncate text-[11px] text-muted">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
            </span>
            <button onClick={onSignOut} className="rounded-lg p-1.5 text-muted hover:bg-ink/5 hover:text-warn" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

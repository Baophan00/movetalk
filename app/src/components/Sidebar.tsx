import { motion } from 'motion/react'
import { BookOpen, Compass, Home, LayoutGrid, Library, Lock, LogOut, Sparkles, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Ring } from './ui/progress'
import { LESSONS } from '../lib/lessons'

export type Route = 'landing' | 'dashboard' | 'lesson' | 'homework' | 'library'

const TRACKS = [
  { key: 'F1', name: 'Dựng câu', hint: 'WHO → VERB → INFO', live: false },
  { key: 'F2', name: 'Kiểm soát thì', hint: 'Present · Past · Future', live: false },
  { key: 'A1', name: 'Bản đồ và chẩn đoán', hint: '10 bài đang mở', live: true },
  { key: 'A2', name: 'Sửa lỗi ngôn ngữ', hint: 'Đang mở dần', live: false },
  { key: 'E1', name: 'Mở rộng 1', hint: 'Đang mở dần', live: false },
  { key: 'E2', name: 'Mở rộng 2', hint: '3 bài đang mở', live: true },
]

const NAV: { key: Route; label: string; icon: typeof Home }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: Home },
  { key: 'lesson', label: 'Việc tiếp theo', icon: Compass },
  { key: 'homework', label: 'Bài tập', icon: BookOpen },
  { key: 'library', label: 'Tài liệu', icon: Library },
]

type Props = {
  route: Route
  onNav: (r: Route) => void
  open: boolean
  onClose: () => void
  user: { name: string; email: string }
  onSignOut: () => void
  done: number
}

export function Sidebar({ route, onNav, open, onClose, user, onSignOut, done }: Props) {
  const total = LESSONS.length

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/25 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <button onClick={() => onNav('landing')} className="flex items-center gap-2.5 focus-ring rounded-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[15px] font-bold text-white">M</span>
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-bold tracking-tight">MOVE</span>
              <span className="block text-[11px] text-muted">English bạn dùng được</span>
            </span>
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-ink/5 lg:hidden" aria-label="Đóng menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-2 text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">Học</p>
          <ul className="space-y-1">
            {NAV.map(({ key, label, icon: Icon }) => {
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

          <p className="mt-6 px-2 pb-2 text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">Lộ trình</p>
          <ul className="space-y-1">
            {TRACKS.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => onNav('lesson')}
                  disabled={!t.live}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors',
                    t.live ? 'hover:bg-ink/[.04]' : 'cursor-default opacity-55',
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink/[.05] text-[10.5px] font-bold text-ink/70">{t.key}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink/85">{t.name}</span>
                    <span className="block truncate text-[11px] text-muted">{t.hint}</span>
                  </span>
                  {!t.live && <Lock className="h-3.5 w-3.5 text-muted/70" />}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border border-line bg-bg/60 p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Tuần này
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative grid place-items-center">
                <Ring value={(done / total) * 100} size={44} stroke={4} />
                <span className="absolute text-[10px] font-bold text-ink">{done}/{total}</span>
              </div>
              <p className="text-[11.5px] leading-snug text-muted">bài đã mở. Mỗi ngày một phần là đủ.</p>
            </div>
          </div>
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-semibold">{user.name}</span>
              <span className="block truncate text-[11px] text-muted">{user.email}</span>
            </span>
            <button onClick={onSignOut} className="rounded-lg p-1.5 text-muted hover:bg-ink/5 hover:text-warn" aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <p className="px-2 pt-1 text-[10px] text-muted/80">
            <LayoutGrid className="mr-1 inline h-3 w-3" /> bản xem trước giao diện mới
          </p>
        </div>
      </aside>
    </>
  )
}

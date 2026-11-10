import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Calendar, ChevronRight, Flame, LogOut, Mic, Repeat2, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Progress, Ring } from '../components/ui/progress'
import { A1, partPlan } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { isPracticeOpen } from '../lib/access'
import { listVoice } from '../lib/voice'
import { myVoice } from '../lib/voiceSync'
import { myAssignments, type Assigned } from '../lib/assignments'
import { dueCards, listCards, readDays, streak } from '../lib/study'
import { myWritings } from '../lib/writings'

/** The learner's own page: what they have finished, what is waiting, and the way out. */
export function Profile({ name, email, role, onSignOut, onGo }: { name: string; email: string; role: 'student' | 'teacher'; onSignOut: () => void; onGo?: (r: 'words' | 'study' | 'progress') => void }) {
  const [takes, setTakes] = useState(() => listVoice().length)
  const [serverWritings, setServerWritings] = useState(0)
  const [waiting, setWaiting] = useState<Assigned[]>([])

  useEffect(() => {
    let alive = true
    void myVoice()
      .then((rows) => {
        if (alive && rows.length) setTakes((n) => Math.max(n, rows.length))
      })
      .catch(() => undefined)
    void myWritings()
      .then((rows) => {
        if (alive) setServerWritings(rows.length)
      })
      .catch(() => undefined)
    void myAssignments()
      .then((rows) => {
        if (alive) setWaiting(rows.filter((a) => a.status === 'assigned'))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const stats = useMemo(() => {
    const totalParts = A1.reduce((n, l) => n + partPlan(l).length, 0)
    const readParts = A1.reduce((n, l) => n + partsSeen(l.n).length, 0)
    const lessonsOpened = A1.filter((l) => partsSeen(l.n).length > 0).length
    const practiceOpen = A1.filter((l) => isPracticeOpen(l.n, waiting.map((a) => a.lessonN))).length
    return { totalParts, readParts, lessonsOpened, practiceOpen }
  }, [waiting])

  const mine = useMemo(() => {
    let writings = 0
    try {
      writings = (JSON.parse(localStorage.getItem('mt2_writings') ?? '[]') as unknown[]).length
    } catch {
      writings = 0
    }
    return { words: listCards().length, due: dueCards().length, run: streak(), writings, days: Object.keys(readDays()).length }
  }, [])

  const initial = (name || email || 'M').trim().charAt(0).toUpperCase()
  const lessonPct = A1.length ? Math.round((stats.lessonsOpened / A1.length) * 100) : 0
  const partPct = stats.totalParts ? Math.round((stats.readParts / stats.totalParts) * 100) : 0

  const quickActions = [
    { label: 'My Vocabulary', icon: BookOpen, onClick: () => onGo?.('words'), desc: `${mine.words} words` },
    { label: 'Practice', icon: Target, onClick: () => onGo?.('study'), desc: 'Your way' },
    { label: 'Progress', icon: TrendingUp, onClick: () => onGo?.('progress'), desc: 'Track growth' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Ring value={lessonPct} size={72} stroke={4} />
              <span className="absolute inset-0 grid place-items-center text-[22px] font-bold text-primary">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[20px] font-bold tracking-tight text-ink">{name || 'Learner'}</p>
              <p className="truncate text-[12.5px] text-muted">{email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="primary">Level A1</Badge>
                <Badge tone="neutral">{role === 'teacher' ? 'Teacher' : 'Student'}</Badge>
                {mine.run > 0 && (
                  <Badge tone="accent">
                    <Flame className="h-3 w-3" /> {mine.run} day streak
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                <span>Lessons</span>
                <span className="tabular-nums">{stats.lessonsOpened}/{A1.length}</span>
              </div>
              <Progress value={lessonPct} />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                <span>Parts read</span>
                <span className="tabular-nums">{stats.readParts}/{stats.totalParts}</span>
              </div>
              <Progress value={partPct} />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Practice open', value: stats.practiceOpen, icon: Repeat2, tone: 'text-primary' },
          { label: 'Voice takes', value: takes, icon: Mic, tone: 'text-accent' },
          { label: 'Streak', value: mine.run, icon: Flame, tone: 'text-warn' },
          { label: 'Words', value: mine.words, icon: BookOpen, tone: 'text-ok', sub: `${mine.due} due` },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.tone}`} />
                <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-muted">{s.label}</p>
              </div>
              <p className="mt-2 text-[26px] font-bold tabular-nums leading-none text-ink">{s.value}</p>
              {s.sub && <p className="mt-1 text-[10.5px] text-muted">{s.sub}</p>}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { label: 'Days active', value: mine.days },
          { label: 'Written', value: Math.max(mine.writings, serverWritings) },
          { label: 'Due cards', value: mine.due },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="px-3 py-3 text-center">
              <p className="text-[22px] font-bold tabular-nums leading-none text-ink">{s.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.08em] text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-white">
              <a.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">{a.label}</p>
              <p className="text-[11px] text-muted">{a.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>

      {/* Waiting assignments */}
      <Card className="mt-4">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-primary" /> Waiting for you
            </p>
            {waiting.length > 0 && (
              <Badge tone="primary">{waiting.length}</Badge>
            )}
          </div>
          {waiting.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {waiting.slice(0, 4).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-bg/60 px-3 py-2.5 transition hover:bg-bg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{a.title}</p>
                    {a.due && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl bg-bg/40 px-4 py-6 text-center">
              <p className="text-[13px] text-muted">Nothing set by your teacher right now.</p>
              <p className="mt-1 text-[11px] text-muted/70">Check back later or explore on your own.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Account */}
      <Card className="mt-4">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink/[.04] text-muted">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink">This account</p>
              <p className="mt-0.5 text-[12px] text-muted">Progress, unlocked lessons and voice takes follow this account to any device.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={onSignOut}>
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

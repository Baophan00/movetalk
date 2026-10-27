import { useEffect, useMemo, useState } from 'react'
import { LogOut, Mic, Repeat2, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { A1, partPlan } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { isPracticeOpen } from '../lib/access'
import { listVoice } from '../lib/voice'
import { myVoice } from '../lib/voiceSync'
import { myAssignments, type Assigned } from '../lib/assignments'
import { dueCards, listCards, readDays, streak } from '../lib/study'

/** The learner's own page: what they have finished, what is waiting, and the way out. */
export function Profile({ name, email, role, onSignOut, onGo }: { name: string; email: string; role: 'student' | 'teacher'; onSignOut: () => void; onGo?: (r: 'words' | 'study' | 'progress') => void }) {
  const [takes, setTakes] = useState(() => listVoice().length)
  const [waiting, setWaiting] = useState<Assigned[]>([])

  useEffect(() => {
    let alive = true
    void myVoice()
      .then((rows) => {
        if (alive && rows.length) setTakes((n) => Math.max(n, rows.length))
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Card>
        <CardBody className="flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-[20px] font-bold text-primary">{initial}</span>
          <div className="min-w-0">
            <p className="truncate text-[19px] font-semibold tracking-tight">{name || 'Learner'}</p>
            <p className="truncate text-[12.5px] text-muted">{email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tone="primary">Level A1</Badge>
              <Badge tone="neutral">{role === 'teacher' ? 'Teacher account' : 'Student'}</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Lessons opened</p>
            <p className="mt-1 text-[26px] font-semibold tabular-nums leading-none">
              {stats.lessonsOpened}
              <span className="text-[14px] font-medium text-muted"> / {A1.length}</span>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Parts read</p>
            <p className="mt-1 text-[26px] font-semibold tabular-nums leading-none">
              {stats.readParts}
              <span className="text-[14px] font-medium text-muted"> / {stats.totalParts}</span>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-muted">
              <Repeat2 className="h-3 w-3" /> Practice open
            </p>
            <p className="mt-1 text-[26px] font-semibold tabular-nums leading-none">{stats.practiceOpen}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-muted">
              <Mic className="h-3 w-3" /> Voice takes
            </p>
            <p className="mt-1 text-[26px] font-semibold tabular-nums leading-none">{takes}</p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Card>
          <CardBody className="p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-muted">Streak</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums leading-none">{mine.run}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Words</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums leading-none">{mine.words}</p>
            <p className="mt-0.5 text-[10.5px] text-muted">{mine.due} due</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Written</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums leading-none">{mine.writings}</p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button onClick={() => onGo?.('words')} className="rounded-2xl border border-line bg-surface px-3 py-2.5 text-[12.5px] font-semibold transition hover:border-primary/40">
          My Vocabulary
        </button>
        <button onClick={() => onGo?.('study')} className="rounded-2xl border border-line bg-surface px-3 py-2.5 text-[12.5px] font-semibold transition hover:border-primary/40">
          Practice your way
        </button>
        <button onClick={() => onGo?.('progress')} className="rounded-2xl border border-line bg-surface px-3 py-2.5 text-[12.5px] font-semibold transition hover:border-primary/40">
          Progress
        </button>
      </div>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="flex items-center gap-1.5 text-[14px] font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Waiting for you
          </p>
          <ul className="mt-3 space-y-1.5">
            {waiting.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-bg/60 px-2.5 py-2">
                <span className="min-w-0 truncate text-[12.5px]">{a.title}</span>
                <span className="shrink-0 text-[11px] text-muted">{a.due ? new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'no date'}</span>
              </li>
            ))}
            {!waiting.length && <li className="rounded-xl bg-bg/60 px-3 py-3 text-[12px] text-muted">Nothing set by your teacher right now.</li>}
          </ul>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="flex items-center gap-1.5 text-[14px] font-semibold">
            <ShieldCheck className="h-4 w-4 text-muted" /> This account
          </p>
          <p className="mt-1 text-[12px] text-muted">Progress, unlocked lessons and voice takes follow this account to any device.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onSignOut}>
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

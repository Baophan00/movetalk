import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, ClipboardList, Mic, Play, RefreshCw, X } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { A1, partPlan, titleOf } from '../lib/curriculum'
import { isPracticeOpen, lockLesson, unlockLesson } from '../lib/access'
import { listVoice, removeVoice, setLocalHeard } from '../lib/voice'
import { allVoice, deleteVoice, setHeard } from '../lib/voiceSync'
import { pullUnlocks, pushUnlock, removeUnlock } from '../lib/unlockSync'
import { closeAssignment, createAssignmentFor, listAccounts, teacherAssignments, type Account, type TeacherAssignment } from '../lib/assignments'
import { cn } from '../lib/utils'

type Take = { id: string; lesson: number; at: number; file: string; heard?: boolean; student?: string }

const DAY = 86400000
const isoIn = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10)

export function TeacherAssignments({ onOpenLesson }: { onOpenLesson: (n: number) => void }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [list, setList] = useState<TeacherAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'queue' | 'library'>('queue')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ lessonN: 1, due: isoIn(3), title: '', studentIds: [] as string[] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [voices, setVoices] = useState<Take[]>(listVoice)
  const [unlocked, setUnlocked] = useState<number[]>([])

  const refresh = async () => {
    const [a, l] = await Promise.all([listAccounts(), teacherAssignments()])
    setAccounts(a)
    setList(l)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  // Practice access is read after mount: localStorage is not available during the first render pass.
  useEffect(() => {
    setUnlocked(A1.map((l) => l.n).filter((n) => isPracticeOpen(n)))
  }, [])

  // Takes and unlocks that live on the account arrive after the first paint.
  useEffect(() => {
    let alive = true
    void (async () => {
      const [server, unlocks] = await Promise.all([allVoice().catch(() => []), pullUnlocks().catch(() => [])])
      if (!alive) return
      if (server.length) {
        setVoices((local) => [...server.map((s) => ({ ...s })), ...local.filter((l) => !server.some((s) => s.id === l.id))])
      }
      if (unlocks.length) setUnlocked(A1.map((l) => l.n).filter((n) => isPracticeOpen(n)))
    })()
    return () => {
      alive = false
    }
  }, [])

  const lesson = useMemo(() => A1.find((l) => l.n === form.lessonN) ?? A1[0], [form.lessonN])

  const open = (lessonN?: number) => {
    const n = lessonN ?? A1[0].n
    const target = A1.find((l) => l.n === n) ?? A1[0]
    setForm({ lessonN: n, due: isoIn(3), title: `Lesson ${n}: ${titleOf(target)}`, studentIds: accounts.map((a) => a.id) })
    setError('')
    setCreating(true)
  }

  const create = async () => {
    if (!form.studentIds.length) {
      setError('Pick at least one student account.')
      return
    }
    setBusy(true)
    const res = await createAssignmentFor({ title: form.title, lessonN: form.lessonN, due: form.due, studentIds: form.studentIds })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the assignment.')
      return
    }
    setCreating(false)
    setTab('queue')
    await refresh()
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Teaching</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Assignments</h2>
          <p className="mt-1 text-[13px] text-muted">Hand out a lesson; students see it in Homework, on any device.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" aria-label="Refresh" onClick={() => void refresh()}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button
            size="sm"
            onClick={() => open()}
            disabled={accounts.length === 0}
            title={accounts.length === 0 ? 'No student account yet' : undefined}
          >
            <ClipboardList className="h-4 w-4" /> New assignment
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-1 rounded-xl bg-bg p-1 sm:w-[320px]">
        {(['queue', 'library'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
              tab === k ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
            )}
          >
            {k === 'queue' ? `Assigned (${list.length})` : `Library (${A1.length})`}
          </button>
        ))}
      </div>

      {tab === 'queue' ? (
        <div className="mt-4 space-y-2">
          {accounts.length === 0 && (
            <Card>
              <CardBody className="py-8 text-center">
                <p className="text-[14px] font-semibold">No student account yet</p>
                <p className="mx-auto mt-1 max-w-md text-[12.5px] text-muted">
                  Work is sent to accounts, so a student appears here the first time they sign up. Until then the library
                  below still opens every lesson.
                </p>
              </CardBody>
            </Card>
          )}

          {list.length === 0 && accounts.length > 0 && (
            <Card>
              <CardBody className="py-10 text-center">
                <p className="text-[14px] font-semibold">Nothing assigned yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted">Pick a lesson, a due date and who gets it.</p>
                <Button size="sm" className="mt-4" onClick={() => open()}>
                  Create the first one
                </Button>
              </CardBody>
            </Card>
          )}

          {list.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex flex-wrap items-center gap-3 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-[11px] font-bold text-primary">
                  {String(a.lessonN).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{a.title}</p>
                  <p className="truncate text-[11.5px] text-muted">
                    <CalendarDays className="mr-1 inline h-3 w-3" />
                    {a.due ? `due ${new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'no due date'} ·{' '}
                    {a.students} {a.students === 1 ? 'student' : 'students'}
                  </p>
                </div>
                <Badge tone={a.status === 'closed' ? 'neutral' : 'ok'}>{a.status === 'closed' ? 'closed' : 'assigned'}</Badge>
                <Button size="sm" variant="ghost" onClick={() => onOpenLesson(a.lessonN)}>
                  Preview <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                {a.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => void closeAssignment(a.id).then(refresh)}>
                    Close
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {A1.map((l) => (
            <Card key={l.n}>
              <CardBody className="flex items-center gap-3 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg text-[11px] font-bold text-primary">
                  {String(l.n).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{titleOf(l) || `Lesson ${l.n}`}</p>
                  <p className="text-[11.5px] text-muted">
                    {l.parts.vocab.length} words · {partPlan(l).length} parts
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => open(l.n)} disabled={accounts.length === 0}>
                  Assign
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogTitle>New assignment</DialogTitle>
          <DialogDescription>One lesson, one due date, the students you pick. It lands in their Homework at once.</DialogDescription>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">Lesson</span>
              <select
                value={form.lessonN}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  setForm({ ...form, lessonN: n, title: `Lesson ${n}: ${titleOf(A1.find((l) => l.n === n) ?? A1[0])}` })
                }}
                className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px]"
              >
                {A1.map((l) => (
                  <option key={l.n} value={l.n}>
                    {String(l.n).padStart(2, '0')} · {titleOf(l)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">Title</span>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">Due</span>
              <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </label>
            <div>
              <span className="mb-1.5 block text-[12px] font-medium text-muted">
                Who gets it ({form.studentIds.length}/{accounts.length})
              </span>
              <div className="max-h-[180px] space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                {accounts.map((s) => {
                  const on = form.studentIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setForm({ ...form, studentIds: on ? form.studentIds.filter((x) => x !== s.id) : [...form.studentIds, s.id] })
                      }
                      className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px]', on ? 'bg-primary-soft text-primary' : 'hover:bg-bg')}
                    >
                      <span className={cn('grid h-4 w-4 place-items-center rounded border', on ? 'border-primary bg-primary text-white' : 'border-line')}>
                        {on && <span className="text-[9px]">✓</span>}
                      </span>
                      {s.name}
                    </button>
                  )
                })}
              </div>
              <div className="mt-1.5 flex gap-2">
                <button className="text-[11.5px] font-semibold text-primary" onClick={() => setForm({ ...form, studentIds: accounts.map((a) => a.id) })}>
                  Everyone
                </button>
                <button className="text-[11.5px] text-muted" onClick={() => setForm({ ...form, studentIds: [] })}>
                  Nobody
                </button>
              </div>
            </div>
            <p className="text-[11.5px] text-muted">
              {lesson ? `${partPlan(lesson).length} parts · ${lesson.parts.vocab.length} words in this lesson` : ''}
            </p>
            {error && <p className="rounded-xl bg-[#fde4e1] px-3 py-2 text-[12px] text-[#8a2b22]">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={() => void create()} disabled={busy}>
                {busy ? 'Sending…' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mt-4">
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold">Practice unlocks</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                A lesson opens when you assign it, or here when you unlock it by hand.
              </p>
            </div>
            <Badge tone="neutral">{unlocked.length} open</Badge>
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {A1.map((l) => {
              const on = unlocked.includes(l.n)
              return (
                <li key={l.n} className="flex items-center justify-between gap-2 rounded-xl bg-bg/60 px-2.5 py-1.5">
                  <span className="min-w-0 truncate text-[12px]">
                    <b className="tabular-nums">{String(l.n).padStart(2, '0')}</b> {titleOf(l) || `Lesson ${l.n}`}
                  </span>
                  <Button
                    size="sm"
                    variant={on ? 'ghost' : 'outline'}
                    className="h-7 shrink-0 px-2 text-[11px]"
                    onClick={() => {
                      if (on) {
                        setUnlocked(lockLesson(l.n))
                        void removeUnlock(l.n)
                      } else {
                        setUnlocked(unlockLesson(l.n))
                        void pushUnlock(l.n)
                      }
                    }}
                  >
                    {on ? 'Lock' : 'Unlock'}
                  </Button>
                </li>
              )
            })}
          </ul>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[14px] font-semibold">
                <Mic className="h-4 w-4 text-[#6b4ef2]" /> Voice from students
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted">Press play, then mark it heard once you have listened.</p>
            </div>
            <Badge tone={voices.length ? 'accent' : 'neutral'}>{voices.length || 'none'}</Badge>
          </div>
          <ul className="mt-3 space-y-1.5">
            {voices.map((v) => (
              <li key={v.id} className="rounded-xl bg-bg/60 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[12px] font-medium">
                    Lesson {v.lesson}
                    {v.student ? ` · ${v.student}` : ''} ·{' '}
                    {new Date(v.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => {
                        const next = !v.heard
                        if (v.id.startsWith('v')) {
                          setVoices(setLocalHeard(v.id, next))
                        } else {
                          setVoices((list) => list.map((x) => (x.id === v.id ? { ...x, heard: next } : x)))
                          void setHeard(v.id, next)
                        }
                      }}
                      className={cn('text-[11px] font-semibold', v.heard ? 'text-[#0f8a5f]' : 'text-muted hover:text-ink')}
                    >
                      {v.heard ? 'heard ✓' : 'mark heard'}
                    </button>
                    <button
                      onClick={() => {
                        if (v.id.startsWith('v')) {
                          setVoices(removeVoice(v.id))
                        } else {
                          setVoices((list) => list.filter((x) => x.id !== v.id))
                          void deleteVoice(v.id)
                        }
                      }}
                      className="text-muted hover:text-[#a33a2c]"
                      aria-label="Delete take"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <audio controls src={v.file} className="mt-1.5 h-8 w-full" />
              </li>
            ))}
            {!voices.length && (
              <li className="flex items-center gap-2 rounded-xl bg-bg/60 px-3 py-3 text-[12px] text-muted">
                <Play className="h-3.5 w-3.5" /> Nothing recorded yet. Students record in Practice → Say it.
              </li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

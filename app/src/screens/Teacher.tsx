import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, GraduationCap, MoreHorizontal, Pause, Play, Plus, Trash2, Users, Video } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { A1 } from '../lib/curriculum'
import { addNote, loadNotes, notesOn, removeNote, toggleNote, type Note } from '../lib/notes'
import {
  addSession,
  addStudent,
  clashFor,
  clearOverride,
  isoDate,
  loadTeaching,
  occurrence,
  removeSession,
  removeStudent,
  setOverride,
  saveTeaching,
  setStudentStatus,
  updateStudent,
  hhmmToMin,
  monthEarnings,
  monthHours,
  vnd,
  type Session,
  type Teaching,
} from '../lib/teaching'
import { addDays, fmtHour, hhmm, weekStart, type Student } from '../lib/schedule'
import { cn } from '../lib/utils'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const START_MIN = 8 * 60
const END_MIN = 23.5 * 60
const PX_PER_MIN = 1.15
const DAY_MS = 86400000

type Shared = { onOpenLesson: (n: number) => void }

function useTeaching() {
  const [data, setData] = useState<Teaching>(loadTeaching)
  return [data, setData] as const
}

/** A removal can be taken back for a few seconds, before the memory of what it was is gone. */
function UndoBar({ label, onUndo, onClose }: { label: string; onUndo: () => void; onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 9000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label])
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-[#1e2438] px-3.5 py-2.5 text-[12.5px] text-white shadow-[0_18px_40px_rgba(16,24,40,.28)]">
      <span>{label}</span>
      <button onClick={onUndo} className="font-semibold text-[#b9cdff] underline">
        Undo
      </button>
      <button onClick={onClose} aria-label="Dismiss" className="text-white/50 hover:text-white">
        ×
      </button>
    </div>
  )
}

function WeekNav({ monday, onChange }: { monday: Date; onChange: (d: Date) => void }) {
  const end = addDays(monday, 6)
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface px-1 py-1">
      <Button variant="ghost" size="icon" aria-label="Previous week" onClick={() => onChange(new Date(monday.getTime() - 7 * DAY_MS))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        onClick={() => onChange(weekStart(new Date()))}
        className="min-w-[132px] px-1 text-center text-[12px] font-semibold tabular-nums"
        title="Back to this week"
      >
        {monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
        {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </button>
      <Button variant="ghost" size="icon" aria-label="Next week" onClick={() => onChange(addDays(monday, 7))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function Block({
  s,
  student,
  date,
  occ,
  onClick,
}: {
  s: Session
  student?: Student
  date: Date
  occ: { start: number; end: number; cancelled: boolean }
  onClick: () => void
}) {
  const top = (occ.start - START_MIN) * PX_PER_MIN
  const height = Math.max(26, (occ.end - occ.start) * PX_PER_MIN - 2)
  const isPast = date.getTime() + occ.end * 60000 < Date.now()
  const moved = occ.start !== s.start || occ.end !== s.end
  return (
    <button
      onClick={onClick}
      style={{ top, height }}
      title={occ.cancelled ? 'Called off this date' : undefined}
      className={cn(
        'absolute inset-x-1 overflow-hidden rounded-lg border-l-2 px-2 py-1 text-left transition-colors',
        occ.cancelled
          ? 'border-l-[#b9b3c9] border border-dashed border-[#d6d1e2] bg-[#f4f2f9] text-[#6b6480]'
          : s.kind === 'trial'
            ? 'border-l-[#de8a1e] bg-[#fde3c2] text-[#7a4300] hover:bg-[#fbd8ae]'
            : 'border-l-[#6b4ef2] bg-[#e2dafb] text-[#2b2350] hover:bg-[#d7ccfa]',
        moved && !occ.cancelled && 'ring-1 ring-[#6b4ef2]/40',
        isPast && 'opacity-70',
      )}
    >
      <span className={cn('block truncate text-[11.5px] font-semibold leading-tight', occ.cancelled && 'line-through')}>
        {student?.name ?? s.studentId}
      </span>
      <span className="block truncate text-[10px] opacity-75">
        {occ.cancelled ? 'called off' : `${hhmm(occ.start)}–${hhmm(occ.end)}`}
      </span>
    </button>
  )
}

export function TeacherSchedule({ onOpenLesson }: Shared) {
  const [data, setData] = useTeaching()
  const [monday, setMonday] = useState(() => weekStart(new Date()))
  const [picked, setPicked] = useState<{ s: Session; date: Date } | null>(null)
  const [move, setMove] = useState({ start: '', end: '' })
  const [undo, setUndo] = useState<{ label: string; before: Teaching } | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ studentId: '', weekday: 0, start: '18:00', kind: 'lesson' as 'lesson' | 'trial' })
  const [error, setError] = useState('')

  const hours = useMemo(() => {
    const list: number[] = []
    for (let m = START_MIN; m <= END_MIN; m += 30) list.push(m)
    return list
  }, [])
  const todayIso = new Date().toDateString()
  const count = data.sessions.length
  const minutes = data.sessions.reduce((n, s) => n + (s.end - s.start), 0)

  const studentById = (id: string) => data.students.find((s) => s.id === id)

  const submit = () => {
    const studentId = form.studentId || data.students[0]?.id
    if (!studentId) {
      setError('Add a student first.')
      return
    }
    const [h, m] = form.start.split(':').map(Number)
    const start = (h || 0) * 60 + (m || 0)
    const clash = clashFor(data, { weekday: form.weekday, start, end: start + 60 })
    if (clash) {
      const who = studentById(clash.studentId)?.name ?? 'another student'
      setError(`${hhmm(clash.start)}–${hhmm(clash.end)} on ${DAY_NAMES[form.weekday]} is already ${who}'s.`)
      return
    }
    const next = addSession(data, { studentId, weekday: form.weekday, start, end: start + 60, kind: form.kind })
    setData(next)
    setAdding(false)
    setError('')
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Teaching</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Your week</h2>
          <p className="mt-1 text-[13px] text-muted">
            {count} sessions · {(minutes / 60).toFixed(1)}h booked · {data.students.filter((s) => s.status === 'trial').length} trials
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <WeekNav monday={monday} onChange={setMonday} />
          <Button size="sm" className="w-full sm:w-auto" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add session
          </Button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-bg/60">
              <div className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">GMT+7</div>
              {DAY_NAMES.map((d, i) => {
                const date = addDays(monday, i)
                const isToday = date.toDateString() === todayIso
                return (
                  <div key={d} className={cn('px-2 py-2 text-center', isToday && 'bg-primary-soft/60')}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{d}</p>
                    <p className={cn('text-[13.5px] font-semibold', isToday ? 'text-primary' : 'text-ink')}>{date.getDate()}</p>
                  </div>
                )
              })}
            </div>

            <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              <div className="relative border-r border-line/70">
                {hours.map((m) => (
                  <div key={m} style={{ height: 30 * PX_PER_MIN }} className="relative">
                    {m % 60 === 0 && <span className="absolute -top-1.5 right-2 text-[10px] tabular-nums text-muted">{fmtHour(m)}</span>}
                  </div>
                ))}
              </div>

              {DAY_NAMES.map((_, weekday) => {
                const date = addDays(monday, weekday)
                const mine = data.sessions.filter((s) => s.weekday === weekday)
                return (
                  <div key={weekday} className="relative border-r border-line/70 last:border-r-0">
                    {hours.map((m) => (
                      <div key={m} style={{ height: 30 * PX_PER_MIN }} className="border-b border-line/40" />
                    ))}
                    {mine.map((s) => {
                      const occ = occurrence(data, s, isoDate(date))
                      return (
                        <Block
                          key={s.id}
                          s={s}
                          student={studentById(s.studentId)}
                          date={date}
                          occ={occ}
                          onClick={() => {
                            setMove({ start: hhmm(occ.start), end: hhmm(occ.end) })
                            setPicked({ s, date })
                          }}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogTitle>Add a session</DialogTitle>
          <DialogDescription>One student, one hour, repeated every week from now on.</DialogDescription>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">Student</span>
              <select
                value={form.studentId || data.students[0]?.id || ''}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px]"
              >
                {data.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">Day</span>
                <select
                  value={form.weekday}
                  onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
                  className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px]"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">Start</span>
                <Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">Type</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as 'lesson' | 'trial' })}
                className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px]"
              >
                <option value="lesson">Regular lesson</option>
                <option value="trial">Trial</option>
              </select>
            </label>
            {error && <p className="rounded-xl bg-[#fde4e1] px-3 py-2 text-[12px] text-[#8a2b22]">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit}>
                Add to the week
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(picked)} onOpenChange={(v) => !v && setPicked(null)}>
        {picked && (() => {
          const { s, date } = picked
          const occ = occurrence(data, s, isoDate(date))
          const when = isoDate(date)
          const student = studentById(s.studentId)
          return (
            <DialogContent>
              <DialogTitle>{student?.name ?? s.studentId}</DialogTitle>
              <DialogDescription>
                {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} ·{' '}
                {occ.cancelled ? 'called off' : `${hhmm(occ.start)}–${hhmm(occ.end)}`} · repeats every {DAY_NAMES[s.weekday]} · GMT+7
              </DialogDescription>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={s.kind === 'trial' ? 'accent' : 'primary'}>{s.kind === 'trial' ? 'Trial lesson' : 'Regular lesson'}</Badge>
                <Badge tone="neutral">{s.end - s.start} min</Badge>
                {occ.cancelled && <Badge tone="neutral">No lesson this date</Badge>}
                {(occ.start !== s.start || occ.end !== s.end) && !occ.cancelled && <Badge tone="accent">Moved this date</Badge>}
              </div>

              <div className="mt-4 rounded-xl border border-line bg-bg/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">This date only</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-muted">From</span>
                    <Input
                      type="time"
                      value={move.start}
                      onChange={(e) => setMove({ ...move, start: e.target.value })}
                      className="h-8 w-[104px] px-2 py-1 text-[12.5px]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-muted">To</span>
                    <Input
                      type="time"
                      value={move.end}
                      onChange={(e) => setMove({ ...move, end: e.target.value })}
                      className="h-8 w-[104px] px-2 py-1 text-[12.5px]"
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const startMin = hhmmToMin(move.start)
                      const endMin = hhmmToMin(move.end)
                      if (endMin <= startMin) {
                        setError('The end has to come after the start.')
                        return
                      }
                      const clash = clashFor(data, { weekday: s.weekday, start: startMin, end: endMin, date: when }, s.id)
                      if (clash) {
                        setError(`${studentById(clash.studentId)?.name ?? 'Another student'} already has that hour on this date.`)
                        return
                      }
                      setData(setOverride(data, { sessionId: s.id, date: when, start: startMin, end: endMin }))
                      setError('')
                      setPicked(null)
                    }}
                  >
                    Move
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setData(occ.cancelled ? clearOverride(data, s.id, when) : setOverride(data, { sessionId: s.id, date: when, cancelled: true }))
                      setPicked(null)
                    }}
                  >
                    {occ.cancelled ? 'Undo call-off' : 'Call this one off'}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  The weekly hour stays; only {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} changes.
                </p>
              </div>

              {error && <p className="mt-3 text-[12px] text-[#8a2b22]">{error}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onOpenLesson(student?.lessonN ?? 1)}>
                  <Video className="h-3.5 w-3.5" /> Open lesson {student?.lessonN ?? 1}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setData(setStudentStatus(data, s.studentId, 'active'))
                    setPicked(null)
                  }}
                >
                  <GraduationCap className="h-3.5 w-3.5" /> Make regular
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setUndo({ label: `Removed ${student?.name ?? 'hour'} · ${DAY_NAMES[s.weekday]} ${hhmm(s.start)}`, before: data })
                    setData(removeSession(data, s.id))
                    setPicked(null)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove from every week
                </Button>
              </div>
            </DialogContent>
          )
        })()}
      </Dialog>

      {undo && <UndoBar label={undo.label} onUndo={() => {
          setData(saveTeaching(undo.before))
          setUndo(null)
        }} onClose={() => setUndo(null)} />}
    </div>
  )
}

function studentSessions(data: Teaching, id: string) {
  return data.sessions.filter((s) => s.studentId === id).sort((a, b) => a.weekday - b.weekday || a.start - b.start)
}

export function TeacherStudents({ onOpenLesson }: Shared) {
  const [data, setData] = useTeaching()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', level: '', rate: '' })
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<{ name: string; email: string; level: string; rate: string; note: string; lessonN: number }>({
    name: '',
    email: '',
    level: '',
    rate: '',
    note: '',
    lessonN: 1,
  })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [undo, setUndo] = useState<{ label: string; before: Teaching } | null>(null)
  const student = data.students.find((s) => s.id === openId)
  const now = new Date()

  const open = (id: string) => {
    const s = data.students.find((x) => x.id === id)
    if (!s) return
    setForm({
      name: s.name,
      email: s.email ?? '',
      level: s.level ?? '',
      rate: s.rate ? String(Math.round(s.rate / 1000)) : '',
      note: s.note ?? '',
      lessonN: s.lessonN ?? 1,
    })
    setConfirmDelete(false)
    setOpenId(id)
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Students</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">{data.students.length} learners, 1-1</h2>
          <p className="mt-1 text-[13px] text-muted">Everyone here studies alone with you. Trials are waiting for a second booking.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add student
        </Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full text-left">
          <thead className="bg-bg/60 text-[10.5px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Student</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Level</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Sessions this week</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">On lesson</th>
              <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">This month</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {data.students.map((s) => {
              const mine = studentSessions(data, s.id)
              return (
                <tr key={s.id} className="cursor-pointer hover:bg-bg/40" onClick={() => open(s.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[11.5px] font-bold text-primary">
                        {s.name.slice(0, 1)}
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium">{s.name}</span>
                        {s.email && <span className="block truncate text-[11px] text-muted">{s.email}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'trial' ? 'accent' : s.status === 'paused' ? 'neutral' : 'ok'}>
                      {s.status === 'trial' ? 'Trial' : s.status === 'paused' ? 'Paused' : 'Regular'}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-muted sm:table-cell">{s.level || '—'}</td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-muted sm:table-cell">{mine.length} × 60 min</td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-muted md:table-cell">Lesson {s.lessonN ?? 1}</td>
                  <td className="hidden px-4 py-3 text-[12.5px] tabular-nums text-muted lg:table-cell">
                    {s.rate ? vnd(monthHours(data, s.id) * s.rate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      aria-label={`Open ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        open(s.id)
                      }}
                      className="inline-grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogTitle>Add a student</DialogTitle>
          <DialogDescription>They start on a trial; book their first hour from the schedule.</DialogDescription>
          <div className="mt-4 space-y-3">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Student name" autoFocus />
            <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email (for the invite)" type="email" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} placeholder="Level, e.g. A1" />
              <Input value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} placeholder="Rate / hour" inputMode="numeric" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!draft.name.trim()}
                onClick={() => {
                  setData(
                    addStudent(data, draft.name, 'trial', {
                      email: draft.email.trim() || undefined,
                      level: draft.level.trim() || undefined,
                      rate: draft.rate ? Number(draft.rate) * 1000 : undefined,
                    }),
                  )
                  setDraft({ name: '', email: '', level: '', rate: '' })
                  setAdding(false)
                }}
              >
                Add student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(student)} onOpenChange={(v) => !v && setOpenId(null)}>
        {student && (
          <DialogContent>
            <DialogTitle>{student.name}</DialogTitle>
            <DialogDescription>
              {student.status === 'trial' ? 'On trial' : student.status === 'paused' ? 'Paused' : 'Regular student'} ·{' '}
              {studentSessions(data, student.id).length} hour{studentSessions(data, student.id).length === 1 ? '' : 's'} a week
            </DialogDescription>

            <div className="mt-4 space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Name</span>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Email</span>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@email.com" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Level</span>
                  <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="A1" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Rate / hour</span>
                  <Input
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    placeholder="180"
                    inputMode="numeric"
                    aria-label="Rate per hour in thousands of đồng"
                  />
                  <span className="mt-1 block text-[10.5px] text-muted">nghìn ₫ · 180 = 180.000₫</span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">On lesson</span>
                  <select
                    value={form.lessonN}
                    onChange={(e) => setForm({ ...form, lessonN: Number(e.target.value) })}
                    className="focus-ring w-full rounded-xl border border-line bg-surface px-2 py-2 text-[13px]"
                  >
                    {A1.map((l) => (
                      <option key={l.n} value={l.n}>
                        {l.n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Note</span>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  placeholder="What to remember before the next hour"
                  className="focus-ring w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-[13px]"
                />
              </label>
              {student.rate ? (
                <p className="rounded-xl bg-bg/60 px-3 py-2 text-[12px] text-muted">
                  {MONTHS[now.getMonth()]}: {monthHours(data, student.id).toFixed(1).replace('.0', '')} hours ×{' '}
                  {vnd(student.rate)} = <b className="font-semibold text-ink">{vnd(monthHours(data, student.id) * student.rate)}</b>
                </p>
              ) : (
                <p className="text-[11.5px] text-muted">Set a rate to see what this student is worth this month.</p>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setData(
                      updateStudent(data, student.id, {
                        name: form.name.trim() || student.name,
                        email: form.email.trim() || undefined,
                        level: form.level.trim() || undefined,
                        rate: form.rate ? Number(form.rate) * 1000 : undefined,
                        note: form.note.trim(),
                        lessonN: form.lessonN,
                      }),
                    )
                    setOpenId(null)
                  }}
                >
                  Save
                </Button>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5">
              {studentSessions(data, student.id).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-[12.5px]">
                  <span className="font-medium">
                    {DAY_NAMES[s.weekday]} {hhmm(s.start)}–{hhmm(s.end)}
                  </span>
                  <button
                    onClick={() => {
                      setUndo({ label: `Removed ${DAY_NAMES[s.weekday]} ${hhmm(s.start)}–${hhmm(s.end)}`, before: data })
                      setData(removeSession(data, s.id))
                    }}
                    className="text-[11.5px] font-semibold text-warn"
                  >
                    Remove hour
                  </button>
                </li>
              ))}
              {studentSessions(data, student.id).length === 0 && <li className="text-[12.5px] text-muted">No hours booked yet.</li>}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpenLesson(student.lessonN ?? 1)}>
                <Play className="h-3.5 w-3.5" /> Open lesson {student.lessonN ?? 1}
              </Button>
              {student.status !== 'active' && (
                <Button size="sm" variant="outline" onClick={() => setData(setStudentStatus(data, student.id, 'active'))}>
                  <GraduationCap className="h-3.5 w-3.5" /> Make regular
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setData(setStudentStatus(data, student.id, 'paused'))}>
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-[#8a2b22] hover:bg-[#fbeceb]"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true)
                    return
                  }
                  setUndo({ label: `Deleted ${student.name}`, before: data })
                  setData(removeStudent(data, student.id))
                  setOpenId(null)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> {confirmDelete ? 'Delete for good?' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {undo && <UndoBar label={undo.label} onUndo={() => {
          setData(saveTeaching(undo.before))
          setUndo(null)
        }} onClose={() => setUndo(null)} />}
    </div>
  )
}

type OverviewProps = Shared & { name?: string; onGo?: (route: 't-schedule' | 't-students' | 't-assignments' | 'library') => void }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function greeting(d: Date) {
  const h = d.getHours()
  if (h < 11) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const TINTS = [
  { edge: 'border-l-[#2f6bff]', chip: 'bg-[#e8f0ff] text-[#2f6bff]' },
  { edge: 'border-l-[#0f8a5f]', chip: 'bg-[#e6f7ef] text-[#0f8a5f]' },
  { edge: 'border-l-[#6b4ef2]', chip: 'bg-[#f0ecff] text-[#6b4ef2]' },
  { edge: 'border-l-[#c2410c]', chip: 'bg-[#fdece3] text-[#b45309]' },
  { edge: 'border-l-[#0e7490]', chip: 'bg-[#e3f6fa] text-[#0e7490]' },
]

/** Same student, same colour, every time the page is opened. */
function tintOf(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return TINTS[Math.abs(h) % TINTS.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase()
}

function Spark({ values, tone }: { values: number[]; tone: string }) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex h-7 w-[54px] shrink-0 items-end justify-end gap-[3px]" aria-hidden>
      {values.map((v, i) => (
        <span key={i} className={cn('w-[5px] rounded-[2px]', tone)} style={{ height: `${Math.max(4, (v / max) * 24)}px`, opacity: v ? 1 : 0.25 }} />
      ))}
    </div>
  )
}

export function TeacherOverview({ onOpenLesson, name, onGo }: OverviewProps) {
  const [data, setData] = useTeaching()
  const now = new Date()
  const todayIdx = (now.getDay() + 6) % 7
  const today = data.sessions.filter((s) => s.weekday === todayIdx).sort((a, b) => a.start - b.start)
  const minutes = data.sessions.reduce((n, s) => n + (s.end - s.start), 0)
  const trials = data.students.filter((s) => s.status === 'trial')
  const [openId, setOpenId] = useState<string | null>(null)
  const openStudent = data.students.find((s) => s.id === openId)

  const perDay = DAY_NAMES.map((_, d) => data.sessions.filter((s) => s.weekday === d).length)
  const earnings = useMemo(() => monthEarnings(data), [data])
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [noteDay, setNoteDay] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')

  /** Hours still ahead this week, counted from now, not from the start of Monday. */
  const minutesLeft = data.sessions.reduce((acc, s) => {
    if (s.weekday < todayIdx) return acc
    if (s.weekday > todayIdx) return acc + (s.end - s.start)
    const nowMin = now.getHours() * 60 + now.getMinutes()
    return acc + Math.max(0, s.end - Math.max(s.start, nowMin))
  }, 0)
  const student = (id: string) => data.students.find((s) => s.id === id)

  /** The next six hours that actually happen, walking forward from today. */
  const upcoming = useMemo(() => {
    const out: { s: Session; date: Date }[] = []
    for (let step = 0; step < 8 && out.length < 6; step++) {
      const weekday = (todayIdx + step) % 7
      const date = addDays(now, step)
      for (const s of data.sessions.filter((x) => x.weekday === weekday).sort((a, b) => a.start - b.start)) {
        if (step === 0 && s.end * 60000 < now.getHours() * 3600000 + now.getMinutes() * 60000) continue
        out.push({ s, date })
        if (out.length === 6) break
      }
    }
    return out
  }, [data.sessions, todayIdx])

  const nextUp = upcoming[0]
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthOffset = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthCells = Array.from({ length: monthOffset + daysInMonth }, (_, i) => (i < monthOffset ? null : i - monthOffset + 1))
  const assignmentsOut = data.assignments.filter((a) => a.status === 'assigned')

  const kpis = [
    { icon: CalendarDays, label: 'Sessions today', value: String(today.length), hint: today.length ? `${hhmm(today[0].start)} first` : 'nothing booked', chip: 'bg-[#e8f0ff] text-[#2f6bff]', bar: 'bg-[#2f6bff]', values: perDay },
    { icon: Clock, label: 'Hours this week', value: (minutes / 60).toFixed(1), hint: `${data.sessions.length} sessions`, chip: 'bg-[#e6f7ef] text-[#0f8a5f]', bar: 'bg-[#0f8a5f]', values: perDay },
    { icon: Users, label: 'Students', value: String(data.students.length), hint: `${data.students.filter((s) => s.status === 'active').length} regular`, chip: 'bg-[#f0ecff] text-[#6b4ef2]', bar: 'bg-[#6b4ef2]', values: perDay },
    {
      icon: Clock,
      label: 'Hours left this week',
      value: (minutesLeft / 60).toFixed(1),
      hint: nextUp ? `next ${DAY_NAMES[nextUp.s.weekday]} ${hhmm(nextUp.s.start)}` : 'week is done',
      chip: 'bg-[#fff3e2] text-[#b57513]',
      bar: 'bg-[#e0a13c]',
      values: perDay,
    },
  ]

  return (
    <div className="mx-auto max-w-[1180px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* greeting */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-[#dbe7ff] bg-[linear-gradient(120deg,#eef5ff_0%,#f7faff_55%,#eef2ff_100%)] px-5 py-5 shadow-card sm:px-6"
        >
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#cfe0ff]/50" />
          <div className="pointer-events-none absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-[#e6dcff]/50" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <img
                src={`${import.meta.env.BASE_URL}teacher.jpg`}
                alt=""
                className="h-36 w-32 rounded-2xl object-cover shadow-[0_14px_34px_rgba(47,107,255,.22)] ring-1 ring-white/70 sm:h-44 sm:w-36"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2f6bff] shadow-sm">
                Teacher
              </span>
            </div>
            <div className="min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-[.16em] text-[#4a6fb5]">Teacher dashboard</p>
            <h2 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight text-[#16233f] sm:text-[30px]">
              {greeting(now)}, {name || 'teacher'}.
            </h2>
            <p className="mt-1 max-w-[46ch] text-[13.5px] leading-relaxed text-[#3f5578]">
              You have <b className="font-semibold text-[#16233f]">{today.length} sessions</b> today
              {trials.length > 0 && (
                <> and <b className="font-semibold text-[#16233f]">{trials.length} trial{trials.length === 1 ? '' : 's'}</b> waiting</>
              )}
              . {(minutes / 60).toFixed(1)} hours booked this week.
              {earnings.total > 0 && (
                <>
                  {' '}
                  {MONTHS[now.getMonth()]} is worth <b className="font-semibold text-[#16233f]">{vnd(earnings.total)}</b>.
                </>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onGo?.('t-schedule')} className="bg-[#2f6bff] text-white hover:bg-[#2559d8]">
                <CalendarDays className="h-3.5 w-3.5" /> Open the week
              </Button>
              <Button size="sm" variant="outline" onClick={() => onGo?.('t-students')}>
                <Users className="h-3.5 w-3.5" /> Students
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onGo?.('t-assignments')}>
                Assign work
              </Button>
            </div>
            </div>
          </div>
        </motion.div>

        {/* next up */}
        <Card className="border-[#e4e9f7]">
          <CardHeader>
            <CardTitle>Next up</CardTitle>
            <Badge tone="primary">{today.length ? 'today' : 'none'}</Badge>
          </CardHeader>
          <CardBody className="pt-1.5">
            {nextUp ? (
              <>
                <p className="text-[20px] font-semibold leading-tight">{nextUp.date.toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                <p className="text-[13px] text-muted">
                  {hhmm(nextUp.s.start)}–{hhmm(nextUp.s.end)} · {student(nextUp.s.studentId)?.name}
                  {nextUp.s.kind === 'trial' && ' · trial'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => onOpenLesson(student(nextUp.s.studentId)?.lessonN ?? 1)}>
                    <Play className="h-3.5 w-3.5" /> Open lesson
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpenId(nextUp.s.studentId)}>
                    Student
                  </Button>
                </div>
              </>
            ) : (
              <p className="py-4 text-[13px] text-muted">Nothing booked ahead yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* kpis */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between">
              <span className={cn('grid h-9 w-9 place-items-center rounded-xl', k.chip)}>
                <k.icon className="h-[17px] w-[17px]" />
              </span>
              <Spark values={k.values} tone={k.bar} />
            </div>
            <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[.12em] text-muted">{k.label}</p>
            <p className="text-[24px] font-bold leading-tight tabular-nums">{k.value}</p>
            <p className="text-[11.5px] text-muted">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* upcoming */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => onGo?.('t-schedule')}>
                See the week <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardBody className="pt-1">
              <ul className="divide-y divide-line/70">
                {upcoming.map(({ s, date }) => (
                  <li key={`${s.id}-${date.toDateString()}`} className="flex items-center gap-3 py-2.5">
                    <span className="w-11 shrink-0 rounded-lg bg-[#eef3ff] py-1 text-center">
                      <span className="block text-[9px] font-bold uppercase tracking-wide text-[#4a6fb5]">{MONTH_SHORT[date.getMonth()]}</span>
                      <span className="block text-[13px] font-semibold leading-tight text-[#16233f]">{date.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {student(s.studentId)?.name} {s.kind === 'trial' && <Badge tone="accent">Trial</Badge>}
                      </span>
                      <span className="block text-[11.5px] text-muted">
                        {DAY_NAMES[s.weekday]} {hhmm(s.start)}–{hhmm(s.end)} · 1-1
                      </span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(s.studentId)}>
                      Open
                    </Button>
                  </li>
                ))}
                {upcoming.length === 0 && <li className="py-5 text-center text-[13px] text-muted">No hours booked.</li>}
              </ul>
            </CardBody>
          </Card>

          {/* quick links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardBody className="pt-1">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Schedule', icon: CalendarDays, go: () => onGo?.('t-schedule') },
                  { label: 'Students', icon: Users, go: () => onGo?.('t-students') },
                  { label: 'Assignments', icon: GraduationCap, go: () => onGo?.('t-assignments') },
                  { label: 'Lesson library', icon: Video, go: () => onGo?.('library') },
                ].map(({ label, icon: Icon, go }) => (
                  <button
                    key={label}
                    onClick={go}
                    className="flex flex-col items-start gap-2 rounded-xl border border-line bg-bg/50 px-3 py-2.5 text-left transition-colors hover:border-[#c9d9ff] hover:bg-[#f4f8ff]"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#4a6fb5] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[12px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          {/* today */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Today&rsquo;s schedule</CardTitle>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <Badge tone={today.length ? 'primary' : 'neutral'}>
                {today.length} hour{today.length === 1 ? '' : 's'}
              </Badge>
            </CardHeader>
            <CardBody className="pt-1">
              {today.length === 0 && (
                <div className="rounded-xl bg-bg/60 px-3 py-6 text-center">
                  <p className="text-[13px] font-medium text-ink">Nothing booked today</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">The next hour shows up here the evening before.</p>
                </div>
              )}
              <ul className="space-y-1">
                {today.map((s) => {
                  const t = tintOf(s.studentId)
                  const name = student(s.studentId)?.name ?? 'Student'
                  const isPast = s.end <= now.getHours() * 60 + now.getMinutes()
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setOpenId(s.studentId)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl border-l-[3px] bg-bg/40 px-2.5 py-2 text-left transition-colors hover:bg-bg',
                          t.edge,
                          isPast && 'opacity-55',
                        )}
                      >
                        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10.5px] font-bold', t.chip)}>
                          {initials(name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-medium">{name}</span>
                            {s.kind === 'trial' && <span className="rounded-full bg-[#fdece3] px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-[#b45309]">trial</span>}
                          </span>
                          <span className="block text-[11px] tabular-nums text-muted">
                            {hhmm(s.start)}–{hhmm(s.end)} · {s.end - s.start} min · 1-1
                          </span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                      </button>
                    </li>
                  )
                })}
              </ul>
              {today.length > 0 && (
                <button
                  onClick={() => onGo?.('t-schedule')}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-line py-1.5 text-[11.5px] font-semibold text-[#4a6fb5] transition-colors hover:bg-[#f4f8ff]"
                >
                  See the whole week <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </CardBody>
          </Card>

          {/* month */}
          <Card>
            <CardHeader>
              <CardTitle>
                {MONTHS[now.getMonth()]} {now.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-1">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={`${d}-${i}`} className="text-[9.5px] font-bold uppercase tracking-wide text-muted">
                    {d}
                  </span>
                ))}
                {monthCells.map((day, i) => {
                  if (!day) return <span key={`empty-${i}`} />
                  const weekday = (new Date(now.getFullYear(), now.getMonth(), day).getDay() + 6) % 7
                  const count = perDay[weekday]
                  const isToday = day === now.getDate()
                  const key = isoDate(new Date(now.getFullYear(), now.getMonth(), day))
                  const dayNotes = notesOn(notes, key)
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setNoteDay(day)
                        setNoteText('')
                      }}
                      className={cn(
                        'relative grid h-7 place-items-center rounded-lg text-[11.5px] tabular-nums transition-colors',
                        isToday
                          ? 'bg-[#2f6bff] font-semibold text-white'
                          : count
                            ? 'bg-[#f2f6ff] text-[#26344f] hover:bg-[#e3ecff]'
                            : 'text-muted hover:bg-bg',
                      )}
                      title={[count ? `${count} hours` : null, dayNotes.length ? `${dayNotes.length} note` : null].filter(Boolean).join(' · ') || 'Add a note'}
                    >
                      {day}
                      <span className="absolute bottom-[2px] flex gap-[2px]">
                        {count > 0 && <span className={cn('h-[3px] w-[3px] rounded-full', isToday ? 'bg-white' : 'bg-[#2f6bff]')} />}
                        {dayNotes.length > 0 && <span className="h-[3px] w-[3px] rounded-full bg-[#d97706]" />}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 flex items-center justify-end gap-3 text-[10.5px] text-muted">
                <span className="flex items-center gap-1"><span className="h-[3px] w-[3px] rounded-full bg-[#2f6bff]" /> teaching day</span>
                <span className="flex items-center gap-1"><span className="h-[3px] w-[3px] rounded-full bg-[#d97706]" /> note</span>
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNoteDay(now.getDate())
                  setNoteText('')
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardBody className="pt-1">
              {notes.length === 0 ? (
                <p className="rounded-xl bg-bg/60 px-3 py-4 text-center text-[12px] text-muted">
                  Tap a day above to keep a note: a call to make, a birthday, a thing to bring.
                </p>
              ) : (
                <ul className="space-y-1">
                  {[...notes]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 5)
                    .map((n) => (
                      <li key={n.id} className="flex items-start gap-2 rounded-xl bg-bg/50 px-2.5 py-1.5">
                        <button
                          aria-label={n.done ? 'Mark as not done' : 'Mark as done'}
                          onClick={() => setNotes(toggleNote(notes, n.id))}
                          className={cn(
                            'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border text-[9px]',
                            n.done ? 'border-[#0f8a5f] bg-[#0f8a5f] text-white' : 'border-line text-transparent hover:border-[#0f8a5f]',
                          )}
                        >
                          ✓
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-[12px] leading-snug', n.done && 'text-muted line-through')}>{n.text}</span>
                          <span className="block text-[10.5px] text-muted">
                            {new Date(n.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </span>
                        <button onClick={() => setNotes(removeNote(notes, n.id))} aria-label="Delete note" className="text-muted hover:text-warn">
                          ×
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Dialog open={noteDay !== null} onOpenChange={(v) => !v && setNoteDay(null)}>
            {noteDay !== null &&
              (() => {
                const d = new Date(now.getFullYear(), now.getMonth(), noteDay)
                const key = isoDate(d)
                const list = notesOn(notes, key)
                return (
                  <DialogContent>
                    <DialogTitle>{d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</DialogTitle>
                    <DialogDescription>Your own note for this date. Students never see it.</DialogDescription>
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Call Chi Hiền at 8 · bring the handout"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && noteText.trim()) {
                            setNotes(addNote(notes, key, noteText))
                            setNoteText('')
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={!noteText.trim()}
                        onClick={() => {
                          setNotes(addNote(notes, key, noteText))
                          setNoteText('')
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {list.map((n) => (
                        <li key={n.id} className="flex items-start gap-2 rounded-xl bg-bg px-3 py-2">
                          <button
                            onClick={() => setNotes(toggleNote(notes, n.id))}
                            className={cn(
                              'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border text-[9px]',
                              n.done ? 'border-[#0f8a5f] bg-[#0f8a5f] text-white' : 'border-line text-transparent',
                            )}
                          >
                            ✓
                          </button>
                          <span className={cn('flex-1 text-[12.5px] leading-snug', n.done && 'text-muted line-through')}>{n.text}</span>
                          <button onClick={() => setNotes(removeNote(notes, n.id))} className="text-muted hover:text-warn" aria-label="Delete note">
                            ×
                          </button>
                        </li>
                      ))}
                      {list.length === 0 && <li className="text-[12px] text-muted">No note on this date yet.</li>}
                    </ul>
                  </DialogContent>
                )
              })()}
          </Dialog>

          {earnings.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{MONTHS[now.getMonth()]} earnings</CardTitle>
                <Badge tone="ok">{vnd(earnings.total)}</Badge>
              </CardHeader>
              <CardBody className="pt-1">
                <ul className="divide-y divide-line/70">
                  {earnings.rows
                    .filter((r) => r.amount > 0)
                    .slice(0, 4)
                    .map((r) => (
                      <li key={r.student.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-medium">{r.student.name}</span>
                          <span className="block text-[11px] text-muted">
                            {r.hours.toFixed(1).replace('.0', '')} h × {vnd(r.student.rate ?? 0)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">{vnd(r.amount)}</span>
                      </li>
                    ))}
                </ul>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  {earnings.rows.filter((r) => r.student.rate).length} of {data.students.length} students have a rate. Called-off
                  dates are already taken out.
                </p>
              </CardBody>
            </Card>
          )}

          {/* reminders */}
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardBody className="space-y-1.5 pt-1">
              {[
                nextUp ? { icon: Clock, text: `Next hour ${hhmm(nextUp.s.start)} with ${student(nextUp.s.studentId)?.name}` } : null,
                trials.length ? { icon: GraduationCap, text: `${trials.length} trial${trials.length > 1 ? 's' : ''} to convert: ${trials.map((t) => t.name).slice(0, 2).join(', ')}` } : null,
                assignmentsOut.length
                  ? { icon: Video, text: `${assignmentsOut.length} assignment${assignmentsOut.length > 1 ? 's' : ''} sent this week` }
                  : { icon: Video, text: 'No assignment sent yet — the library is one click away' },
              ]
                .filter(Boolean)
                .map((item, i) => {
                  const Icon = (item as { icon: typeof Clock }).icon
                  return (
                    <div key={i} className="flex items-start gap-2 rounded-xl bg-bg/60 px-3 py-2">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4a6fb5]" />
                      <p className="text-[12px] leading-relaxed text-ink/75">{(item as { text: string }).text}</p>
                    </div>
                  )
                })}
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(openStudent)} onOpenChange={(v) => !v && setOpenId(null)}>
        {openStudent && (
          <DialogContent>
            <DialogTitle>{openStudent.name}</DialogTitle>
            <DialogDescription>
              Mon to Sun · {studentSessions(data, openStudent.id).length} hour{studentSessions(data, openStudent.id).length === 1 ? '' : 's'} a week
            </DialogDescription>
            <ul className="mt-4 space-y-1.5">
              {studentSessions(data, openStudent.id).map((s) => (
                <li key={s.id} className="rounded-xl bg-bg px-3 py-2 text-[12.5px]">
                  {DAY_NAMES[s.weekday]} {hhmm(s.start)}–{hhmm(s.end)}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpenLesson(openStudent.lessonN ?? 1)}>
                <Video className="h-3.5 w-3.5" /> Open lesson {openStudent.lessonN ?? 1}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setData(setStudentStatus(data, openStudent.id, 'active'))}>
                Make regular
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

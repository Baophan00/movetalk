import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, GraduationCap, MoreHorizontal, Pause, Play, Plus, Trash2, Users, Video } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { addSession, addStudent, loadTeaching, removeSession, setStudentStatus, type Session, type Teaching } from '../lib/teaching'
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

function Block({ s, student, date, onClick }: { s: Session; student?: Student; date: Date; onClick: () => void }) {
  const top = (s.start - START_MIN) * PX_PER_MIN
  const height = Math.max(26, (s.end - s.start) * PX_PER_MIN - 2)
  const isPast = date.getTime() + s.end * 60000 < Date.now()
  return (
    <button
      onClick={onClick}
      style={{ top, height }}
      className={cn(
        'absolute inset-x-1 overflow-hidden rounded-lg border-l-2 px-2 py-1 text-left transition-colors',
        s.kind === 'trial'
          ? 'border-l-[#de8a1e] bg-[#fde3c2] text-[#7a4300] hover:bg-[#fbd8ae]'
          : 'border-l-[#6b4ef2] bg-[#e2dafb] text-[#2b2350] hover:bg-[#d7ccfa]',
        isPast && 'opacity-70',
      )}
    >
      <span className="block truncate text-[11.5px] font-semibold leading-tight">{student?.name ?? s.studentId}</span>
      <span className="block truncate text-[10px] opacity-75">
        {hhmm(s.start)}–{hhmm(s.end)}
      </span>
    </button>
  )
}

export function TeacherSchedule({ onOpenLesson }: Shared) {
  const [data, setData] = useTeaching()
  const [monday, setMonday] = useState(() => weekStart(new Date()))
  const [picked, setPicked] = useState<Session | null>(null)
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
    const next = addSession(data, { studentId, weekday: form.weekday, start, end: start + 60, kind: form.kind })
    if (next === data) {
      setError('That hour is already taken.')
      return
    }
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
                    {mine.map((s) => (
                      <Block key={s.id} s={s} student={studentById(s.studentId)} date={date} onClick={() => setPicked(s)} />
                    ))}
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
        {picked && (
          <DialogContent>
            <DialogTitle>{studentById(picked.studentId)?.name}</DialogTitle>
            <DialogDescription>
              {DAY_NAMES[picked.weekday]} · {hhmm(picked.start)}–{hhmm(picked.end)} · every week · GMT+7
            </DialogDescription>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone={picked.kind === 'trial' ? 'accent' : 'primary'}>{picked.kind === 'trial' ? 'Trial lesson' : 'Regular lesson'}</Badge>
              <Badge tone="neutral">{picked.end - picked.start} min</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpenLesson(1)}>
                <Video className="h-3.5 w-3.5" /> Open lesson 1
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setData(setStudentStatus(data, picked.studentId, 'active'))
                  setPicked(null)
                }}
              >
                <GraduationCap className="h-3.5 w-3.5" /> Make regular
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setData(removeSession(data, picked.id))
                  setPicked(null)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove this hour
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function studentSessions(data: Teaching, id: string) {
  return data.sessions.filter((s) => s.studentId === id).sort((a, b) => a.weekday - b.weekday || a.start - b.start)
}

export function TeacherStudents({ onOpenLesson }: Shared) {
  const [data, setData] = useTeaching()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const student = data.students.find((s) => s.id === openId)

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
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Sessions this week</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">First session</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {data.students.map((s) => {
              const mine = studentSessions(data, s.id)
              const first = mine[0]
              return (
                <tr key={s.id} className="cursor-pointer hover:bg-bg/40" onClick={() => setOpenId(s.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[11.5px] font-bold text-primary">
                        {s.name.slice(0, 1)}
                      </span>
                      <span className="text-[13px] font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'trial' ? 'accent' : s.status === 'paused' ? 'neutral' : 'ok'}>
                      {s.status === 'trial' ? 'Trial' : s.status === 'paused' ? 'Paused' : 'Regular'}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-muted sm:table-cell">{mine.length} × 60 min</td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-muted md:table-cell">
                    {first ? `${DAY_NAMES[first.weekday]} ${hhmm(first.start)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      aria-label={`Open ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenId(s.id)
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!name.trim()}
                onClick={() => {
                  setData(addStudent(data, name))
                  setName('')
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
              {studentSessions(data, student.id).length} hours a week
            </DialogDescription>
            <ul className="mt-4 space-y-1.5">
              {studentSessions(data, student.id).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-[12.5px]">
                  <span className="font-medium">
                    {DAY_NAMES[s.weekday]} {hhmm(s.start)}–{hhmm(s.end)}
                  </span>
                  <button
                    onClick={() => setData(removeSession(data, s.id))}
                    className="text-[11.5px] font-semibold text-warn"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {studentSessions(data, student.id).length === 0 && <li className="text-[12.5px] text-muted">No hours booked yet.</li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpenLesson(1)}>
                <Play className="h-3.5 w-3.5" /> Open lesson 1
              </Button>
              <Button size="sm" variant="outline" onClick={() => setData(setStudentStatus(data, student.id, 'active'))}>
                <GraduationCap className="h-3.5 w-3.5" /> Make regular
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setData(setStudentStatus(data, student.id, 'paused'))}>
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

export function TeacherOverview({ onOpenLesson }: Shared) {
  const [data, setData] = useTeaching()
  const todayIdx = (new Date().getDay() + 6) % 7
  const today = data.sessions.filter((s) => s.weekday === todayIdx).sort((a, b) => a.start - b.start)
  const minutes = data.sessions.reduce((n, s) => n + (s.end - s.start), 0)
  const trials = data.students.filter((s) => s.status === 'trial')
  const [openId, setOpenId] = useState<string | null>(null)
  const openStudent = data.students.find((s) => s.id === openId)

  const stats = [
    { icon: CalendarDays, label: 'Sessions today', value: String(today.length), hint: today.length ? `from ${hhmm(today[0].start)}` : 'nothing booked' },
    { icon: Clock, label: 'Hours this week', value: (minutes / 60).toFixed(1), hint: `${data.sessions.length} sessions` },
    { icon: Users, label: 'Students', value: String(data.students.length), hint: `${trials.length} on trial` },
  ]

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Teacher</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight sm:text-[30px]">Today is {today.length} lessons</h2>
        <p className="mt-1 text-[13.5px] text-muted">Everything below comes from your real week, not a demo.</p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, hint }, i) => (
          <div key={label} className={cn('rounded-2xl p-4 shadow-card transition-transform hover:-translate-y-0.5', ['bg-[#dfd7fb]', 'bg-[#fde3c6]', 'bg-[#fbd0ee]'][i % 3])}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-ink">
              <Icon className="h-[17px] w-[17px]" />
            </span>
            <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[.12em] text-ink/50">{label}</p>
            <p className="text-[22px] font-bold leading-tight text-ink">{value}</p>
            <p className="text-[11px] text-ink/55">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today's sessions</CardTitle>
            <Badge tone="primary">{today.length}</Badge>
          </CardHeader>
          <CardBody className="pt-2">
            {today.length === 0 && <p className="py-6 text-center text-[13px] text-muted">No sessions booked today.</p>}
            <ul className="divide-y divide-line/70">
              {today.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-[86px] shrink-0 text-[12px] tabular-nums text-muted">
                    {hhmm(s.start)}–{hhmm(s.end)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{data.students.find((x) => x.id === s.studentId)?.name}</span>
                  {s.kind === 'trial' && <Badge tone="accent">Trial</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(s.studentId)}>
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trials to convert</CardTitle>
            <Badge tone="accent">{trials.length}</Badge>
          </CardHeader>
          <CardBody className="pt-2">
            <ul className="space-y-2">
              {trials.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-bg/70 px-3 py-2.5">
                  <span className="text-[13px] font-medium">{s.name}</span>
                  <Button size="sm" variant="soft" onClick={() => setData(setStudentStatus(data, s.id, 'active'))}>
                    Make regular
                  </Button>
                </li>
              ))}
              {trials.length === 0 && <li className="text-[12.5px] text-muted">No trials waiting.</li>}
            </ul>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">A trial becomes regular when the second session is booked, or by hand from here.</p>
          </CardBody>
        </Card>
      </div>

      <Dialog open={Boolean(openStudent)} onOpenChange={(v) => !v && setOpenId(null)}>
        {openStudent && (
          <DialogContent>
            <DialogTitle>{openStudent.name}</DialogTitle>
            <DialogDescription>
              {DAY_NAMES[0]} to Sun · {studentSessions(data, openStudent.id).length} hours a week
            </DialogDescription>
            <ul className="mt-4 space-y-1.5">
              {studentSessions(data, openStudent.id).map((s) => (
                <li key={s.id} className="rounded-xl bg-bg px-3 py-2 text-[12.5px]">
                  {DAY_NAMES[s.weekday]} {hhmm(s.start)}–{hhmm(s.end)}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpenLesson(1)}>
                <Video className="h-3.5 w-3.5" /> Open lesson 1
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

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, GraduationCap, MoreHorizontal,
  Plus, Users, Video,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import {
  STUDENTS, addDays, fmtHour, hhmm, sessionsFor, sessionsOn, studentById, weekLoad, weekStart,
  type Occurrence,
} from '../lib/schedule'
import { cn } from '../lib/utils'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const START_MIN = 8 * 60
const END_MIN = 23.5 * 60
const PX_PER_MIN = 1.15

function longDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function WeekNav({ monday, onChange }: { monday: Date; onChange: (d: Date) => void }) {
  const sunday = addDays(monday, 6)
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(addDays(monday, -7))} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="min-w-[164px] text-center text-[13px] font-semibold">
        {longDate(monday)} – {longDate(sunday)}
      </p>
      <Button variant="outline" size="icon" onClick={() => onChange(addDays(monday, 7))} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onChange(weekStart(new Date()))}>
        This week
      </Button>
    </div>
  )
}

function SessionBlock({ o, onClick }: { o: Occurrence; onClick: () => void }) {
  const student = studentById(o.studentId)
  const top = (o.start - START_MIN) * PX_PER_MIN
  const height = Math.max((o.end - o.start) * PX_PER_MIN - 2, 22)
  const trial = o.kind === 'trial'
  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute inset-x-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left transition-all hover:z-10 hover:shadow-card',
        trial
          ? 'border-l-[#de8a1e] bg-[#fde3c2] text-[#7a4300] hover:bg-[#fbd8ae]'
          : 'border-l-[#6b4ef2] bg-[#e2dafb] text-[#2b2350] hover:bg-[#d7ccfa]',
      )}
      style={{ top, height }}
    >
      <span className="block truncate text-[11.5px] font-semibold leading-tight">{student?.name ?? o.studentId}</span>
      <span className="block truncate text-[10px] opacity-75">
        {hhmm(o.start)}–{hhmm(o.end)}
      </span>
    </button>
  )
}

export function TeacherSchedule() {
  const [monday, setMonday] = useState(() => weekStart(new Date()))
  const [picked, setPicked] = useState<Occurrence | null>(null)
  const hours = useMemo(() => {
    const list: number[] = []
    for (let m = START_MIN; m <= END_MIN; m += 30) list.push(m)
    return list
  }, [])
  const load = weekLoad(monday)
  const todayIso = new Date().toDateString()

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Teaching</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Your week</h2>
          <p className="mt-1 text-[13px] text-muted">
            {load.count} sessions · {(load.minutes / 60).toFixed(1)}h booked · {load.trials} trials
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <WeekNav monday={monday} onChange={setMonday} />
          <Button size="sm" className="w-full sm:w-auto">
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
                <p className={cn('text-[13.5px] font-semibold', isToday ? 'text-primary' : 'text-ink')}>
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div className="relative border-r border-line/70">
            {hours.map((m) => (
              <div key={m} style={{ height: 30 * PX_PER_MIN }} className="relative">
                {m % 60 === 0 && (
                  <span className="absolute -top-1.5 right-2 text-[10px] tabular-nums text-muted">{fmtHour(m)}</span>
                )}
              </div>
            ))}
          </div>

          {DAY_NAMES.map((_, weekday) => (
            <div key={weekday} className="relative border-r border-line/70 last:border-r-0">
              {hours.map((m) => (
                <div key={m} style={{ height: 30 * PX_PER_MIN }} className="border-b border-line/40" />
              ))}
              {sessionsOn(monday, weekday).map((o) => (
                <SessionBlock key={o.id} o={o} onClick={() => setPicked(o)} />
              ))}
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>

      <Dialog open={Boolean(picked)} onOpenChange={(v) => !v && setPicked(null)}>
        {picked && (
          <DialogContent>
            <DialogTitle>{studentById(picked.studentId)?.name}</DialogTitle>
            <DialogDescription>
              {picked.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {hhmm(picked.start)}–{hhmm(picked.end)} · GMT+7
            </DialogDescription>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone={picked.kind === 'trial' ? 'accent' : 'primary'}>
                {picked.kind === 'trial' ? 'Trial lesson' : 'Regular lesson'}
              </Badge>
              <Badge tone="neutral">1-1 · 60 min</Badge>
            </div>
            <p className="mt-4 rounded-xl bg-bg px-3.5 py-3 text-[12.5px] leading-relaxed text-muted">
              Open the student to see their lesson progress, the last piece of homework and the next thing to
              review before this session.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm">
                <Video className="h-3.5 w-3.5" /> Start lesson
              </Button>
              <Button size="sm" variant="outline">
                <GraduationCap className="h-3.5 w-3.5" /> Student profile
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

export function TeacherStudents() {
  const [monday] = useState(() => weekStart(new Date()))
  const all = sessionsFor(monday)
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Students</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">{STUDENTS.length} learners, 1-1</h2>
          <p className="mt-1 text-[13px] text-muted">Everyone here studies alone with you. Trials are waiting for a second booking.</p>
        </div>
        <Button size="sm" variant="outline">
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
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Next session</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {STUDENTS.map((s) => {
              const mine = all.filter((o) => o.studentId === s.id)
              const next = mine.find((o) => o.date >= new Date()) ?? mine[0]
              return (
                <tr key={s.id} className="hover:bg-bg/40">
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
                    {next ? `${DAY_NAMES[next.weekday]} ${hhmm(next.start)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="More">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TeacherOverview() {
  const monday = weekStart(new Date())
  const today = sessionsFor(monday).filter((o) => o.date.toDateString() === new Date().toDateString())
  const load = weekLoad(monday)
  const trials = STUDENTS.filter((s) => s.status === 'trial')

  const stats = [
    { icon: CalendarDays, label: 'Sessions today', value: String(today.length), hint: today.length ? `from ${hhmm(today[0].start)}` : 'nothing booked' },
    { icon: Clock, label: 'Hours this week', value: (load.minutes / 60).toFixed(1), hint: `${load.count} sessions` },
    { icon: Users, label: 'Students', value: String(STUDENTS.length), hint: `${trials.length} on trial` },
  ]

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Teacher</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight sm:text-[30px]">Today is {today.length} lessons</h2>
        <p className="mt-1 text-[13.5px] text-muted">Everything below comes from your real week, not a demo.</p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, hint }) => (
          <Card key={label} className="card-hover">
            <CardBody className="flex items-center gap-3.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[.12em] text-muted">{label}</p>
                <p className="text-[19px] font-semibold leading-tight">{value}</p>
                <p className="text-[11px] text-muted">{hint}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today's sessions</CardTitle>
            <Badge tone="primary">{today.length}</Badge>
          </CardHeader>
          <CardBody className="pt-2">
            {today.length === 0 && <p className="py-6 text-center text-[13px] text-muted">No sessions booked today.</p>}
            <ul className="divide-y divide-line/70">
              {today.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-[86px] shrink-0 text-[12px] tabular-nums text-muted">{hhmm(o.start)}–{hhmm(o.end)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{studentById(o.studentId)?.name}</span>
                  {o.kind === 'trial' && <Badge tone="accent">Trial</Badge>}
                  <Button size="sm" variant="ghost">Open</Button>
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
                  <Button size="sm" variant="soft">Make regular</Button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              A trial becomes regular when the second session is booked, or by hand from here.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

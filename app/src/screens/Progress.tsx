import { useMemo } from 'react'
import { Flame, Headphones, Layers, Mic, Pencil, BookOpen, RotateCcw } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { dueCards, readDays, skillStats, streak, wrongItems } from '../lib/study'
import { cn } from '../lib/utils'

const SKILLS = [
  { kind: 'listen' as const, label: 'Listening', vi: 'Nghe', icon: Headphones, bar: 'from-[#6f7cff] to-[#a78bfa]' },
  { kind: 'speak' as const, label: 'Speaking', vi: 'Nói', icon: Mic, bar: 'from-[#ff8fa3] to-[#ff5d8f]' },
  { kind: 'read' as const, label: 'Reading', vi: 'Đọc', icon: BookOpen, bar: 'from-[#48c9b0] to-[#22a699]' },
  { kind: 'write' as const, label: 'Writing', vi: 'Viết', icon: Pencil, bar: 'from-[#ffb56b] to-[#f4772e]' },
]

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** What the learner can see about themselves: four skills, the last eight weeks, nothing invented. */
export function Progress({ onGo }: { onGo?: (route: 'words' | 'study') => void }) {
  const stats = useMemo(() => SKILLS.map((s) => ({ ...s, ...skillStats(s.kind) })), [])
  const days = useMemo(readDays, [])
  const run = streak()
  const misses = wrongItems().length
  const due = dueCards().length

  const weeks = useMemo(() => {
    const out: { day: string; on: boolean }[][] = []
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 55)
    // align to Monday
    const shift = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - shift)
    for (let w = 0; w < 8; w += 1) {
      const col: { day: string; on: boolean }[] = []
      for (let d = 0; d < 7; d += 1) {
        const cur = new Date(start)
        cur.setDate(start.getDate() + w * 7 + d)
        const key = iso(cur)
        col.push({ day: key, on: Boolean(days[key]) && cur <= today })
      }
      out.push(col)
    }
    return out
  }, [days])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-[26px] font-semibold tracking-tight">Progress</h1>
      <p className="mt-1 text-[13px] text-muted">Only what actually happened. Nothing is estimated.</p>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat icon={<Flame className="h-4 w-4" />} value={run} label={run === 1 ? 'day in a row' : 'days in a row'} />
        <Stat icon={<RotateCcw className="h-4 w-4" />} value={misses} label="to redo" />
        <button onClick={() => onGo?.('words')} className="text-left">
          <Stat icon={<Layers className="h-4 w-4" />} value={due} label="words due" />
        </button>
      </div>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="text-[13px] font-semibold">Four skills</p>
          <div className="mt-3 space-y-3">
            {stats.map((s) => {
              const Icon = s.icon
              const empty = s.total === 0
              return (
                <div key={s.kind}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <Icon className="h-3.5 w-3.5 text-muted" /> {s.label} <span className="text-muted">· {s.vi}</span>
                    </span>
                    <span className={cn('text-[11.5px] font-semibold tabular-nums', empty ? 'text-muted' : 'text-ink')}>
                      {empty ? 'no answers yet' : `${s.pct}% · ${s.total}`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg">
                    <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', s.bar)} style={{ width: `${empty ? 0 : s.pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            A bar moves when you answer — listening and reading by choice, writing by exact sentence, speaking by the words the browser heard.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="text-[13px] font-semibold">Last eight weeks</p>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-1.5">
                {week.map((d) => (
                  <span
                    key={d.day}
                    title={d.day}
                    className={cn('aspect-square w-full rounded-[5px]', d.on ? 'bg-primary' : 'border border-line bg-bg')}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">A filled square is a day with at least one finished thing.</p>
        </CardBody>
      </Card>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardBody className="p-3.5">
        <span className="inline-flex items-center gap-1 text-muted">{icon}</span>
        <p className="mt-1 text-[22px] font-semibold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-[11px] text-muted">{label}</p>
      </CardBody>
    </Card>
  )
}

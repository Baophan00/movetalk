import { useMemo } from 'react'
import { Flame, Layers, RotateCcw } from 'lucide-react'
import { Icon3D } from '../components/Icon3D'
import { Card, CardBody } from '../components/ui/card'
import { allAttempts, dueCards, readDays, skillStats, streak, wrongItems } from '../lib/study'
import { cn } from '../lib/utils'

const SKILLS = [
  { kind: 'listen' as const, room: 'listen' as const, label: 'Listening', vi: 'Nghe', icon3d: 'listening' as const, bar: 'from-[#5D7B6F] to-[#8FAE92]' },
  { kind: 'speak' as const, room: 'speak' as const, label: 'Speaking', vi: 'Nói', icon3d: 'speaking' as const, bar: 'from-[#C08A4A] to-[#9C6B2E]' },
  { kind: 'read' as const, room: 'read' as const, label: 'Reading', vi: 'Đọc', icon3d: 'reading' as const, bar: 'from-[#4E7C78] to-[#3B6360]' },
  { kind: 'write' as const, room: 'write' as const, label: 'Writing', vi: 'Viết', icon3d: 'writing' as const, bar: 'from-[#8A5A22] to-[#6F4A18]' },
]

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** What the learner can see about themselves: four skills, the last eight weeks, nothing invented. */
export function Progress({ onGo, onWords }: { onGo?: (room: 'listen' | 'read' | 'write' | 'speak', level?: string) => void; onWords?: () => void }) {
  // Which level the learner was last working at, per skill, so "practise" lands where they are.
  const stats = useMemo(() => {
    const attempts = allAttempts()
    return SKILLS.map((s) => {
      const last = [...attempts].reverse().find((a) => a.kind === s.kind)
      const level = (last?.section ?? '').match(/\b(A1|A2|B1|B2)\b/)?.[1] ?? 'A1'
      return { ...s, ...skillStats(s.kind), level }
    })
  }, [])
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
        <button onClick={() => onWords?.()} className="text-left">
          <Stat icon={<Layers className="h-4 w-4" />} value={due} label="words due" />
        </button>
      </div>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="text-[13px] font-semibold">Four skills</p>
          <div className="mt-3 space-y-3">
            {stats.map((s) => {
              const empty = s.total === 0
              return (
                <div key={s.kind}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <Icon3D name={s.icon3d} size={16} /> {s.label} <span className="text-muted">· {s.vi}</span>
                    </span>
                    <span className={cn('text-[11.5px] font-semibold tabular-nums', empty ? 'text-muted' : 'text-ink')}>
                      {empty ? 'no answers yet' : `${s.pct}% · ${s.total}`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg">
                    <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', s.bar)} style={{ width: `${empty ? 0 : s.pct}%` }} />
                  </div>
                  <button
                    onClick={() => onGo?.(s.room, s.level)}
                    className="mt-1.5 text-[11.5px] font-semibold text-primary"
                  >
                    Practise {s.label.toLowerCase()} {s.level ? `· ${s.level}` : ''}
                  </button>
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

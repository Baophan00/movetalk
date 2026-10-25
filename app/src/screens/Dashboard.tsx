import { motion } from 'motion/react'
import { ArrowRight, BookOpen, CalendarCheck, Flame, Lock, Play, Sparkles, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress, Ring } from '../components/ui/progress'
import { A1, partCount, titleOf } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { cn } from '../lib/utils'

type Props = {
  name: string
  onOpenLesson: (n: number) => void
  onHomework: () => void
}

const TRACKS = [
  { key: 'A1', name: 'Activate 1', count: 10, live: true, open: 10 },
  { key: 'A2', name: 'Activate 2', count: 50, live: false, open: 0 },
]

export function Dashboard({ name, onOpenLesson, onHomework }: Props) {
  const next = A1.find((l) => partsSeen(l.n).length < partCount(l)) || A1[0]
  const totalParts = partCount(next)
  const read = partsSeen(next.n).length
  const percent = totalParts ? Math.round((read / totalParts) * 100) : 0
  const opened = A1.filter((l) => partsSeen(l.n).length > 0).length
  const doneAll = A1.filter((l) => partsSeen(l.n).length >= partCount(l)).length
  const partsRead = A1.reduce((n, l) => n + partsSeen(l.n).length, 0)

  const stats = [
    { icon: Flame, label: 'Streak', value: opened ? `${Math.min(opened, 7)}` : '0', hint: 'days in a row' },
    { icon: BookOpen, label: 'Parts read', value: String(partsRead), hint: `of ${A1.reduce((n, l) => n + partCount(l), 0)} parts` },
    { icon: Target, label: 'Lessons done', value: String(doneAll), hint: `${A1.length} lessons open` },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Today</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight sm:text-[30px]">Hi {name.split(' ')[0]},</h2>
        <p className="mt-1 text-[13.5px] text-muted">One part a day is enough. You are on lesson {next.n}.</p>
      </motion.div>

      <div className="relative overflow-hidden rounded-3xl bg-[#c3b4f7] px-5 py-6 shadow-card sm:px-7 sm:py-7">
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/25" />
        <span className="pointer-events-none absolute right-16 top-14 h-10 w-10 rounded-full bg-[#f79be0]/70" />
        <span className="pointer-events-none absolute bottom-4 right-28 hidden h-6 w-6 rounded-full bg-white/40 sm:block" />
        <div className="relative max-w-[430px]">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-ink/50">Level A1 · lesson {next.n}</p>
          <h3 className="mt-1.5 text-[21px] font-bold leading-snug tracking-tight text-ink sm:text-[24px]">
            {titleOf(next)}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink/65">
            {read ? `${read} of ${totalParts} parts opened.` : 'Ten minutes gets you the first part.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button className="bg-[#1b1735] text-white hover:bg-[#2a2450]" onClick={() => onOpenLesson(next.n)}>
              <Play className="h-4 w-4" /> {read ? 'Continue lesson' : 'Start lesson'}
            </Button>
            <Button variant="ghost" className="text-ink/70 hover:bg-white/30" onClick={() => onOpenLesson(next.n)}>
              See all lessons <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <CardHeader className="pt-6">
            <div>
              <Badge tone="primary">Next up</Badge>
              <CardTitle className="mt-2 text-[17px]">
                Lesson {next.n}: {titleOf(next)}
              </CardTitle>
            </div>
            <div className="relative grid shrink-0 place-items-center">
              <Ring value={percent} size={64} stroke={6} />
              <span className="absolute text-[12px] font-bold">{percent}%</span>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                `${next.parts.vocab.length} words`,
                `${next.parts.grammar.length} grammar blocks`,
                next.parts.dialogue.length ? 'dialogue' : '',
                next.parts.listenCheck.length ? 'listening check' : '',
              ]
                .filter(Boolean)
                .map((t) => (
                  <span key={t} className="rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-muted">
                    {t}
                  </span>
                ))}
            </div>
            <div className="mt-3">
              <Progress value={percent} />
              <p className="mt-1.5 text-[11.5px] text-muted">
                {read}/{totalParts} parts opened
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => onOpenLesson(next.n)}>
                <Play className="h-4 w-4" /> {read ? 'Continue' : 'Start this lesson'}
              </Button>
              <Button variant="outline" onClick={onHomework}>
                <BookOpen className="h-4 w-4" /> Homework
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ icon: Icon, label, value, hint }, i) => {
            const tones = ['bg-[#c3b4f7]', 'bg-[#fbb463]', 'bg-[#f79be0]']
            const rat = [percent, Math.round((partsRead / Math.max(1, A1.reduce((n, l) => n + partCount(l), 0))) * 100), Math.round((doneAll / Math.max(1, A1.length)) * 100)]
            return (
              <div key={label} className={cn('rounded-2xl p-4 shadow-card transition-transform hover:-translate-y-0.5', tones[i % 3])}>
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/35 text-ink">
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span className="text-[11px] font-semibold text-ink/45">{rat[i]}%</span>
                </div>
                <p className="mt-3 text-[12.5px] font-semibold leading-tight text-ink">{label}</p>
                <p className="text-[22px] font-bold leading-tight text-ink">{value}</p>
                <p className="text-[11px] text-ink/55">{hint}</p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/15">
                  <div className="h-full rounded-full bg-[#1b1735]" style={{ width: `${Math.min(100, rat[i])}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Path</h3>
            <p className="text-[12px] text-muted">Two levels for now: A1 open, A2 in preparation.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-[11.5px] text-muted sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> A1 is open
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t, i) => {
            const lessons = t.live ? A1 : []
            const openedHere = lessons.filter((l) => partsSeen(l.n).length > 0).length
            return (
              <motion.div key={t.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }}>
                <button
                  onClick={() => t.live && onOpenLesson(1)}
                  disabled={!t.live}
                  className={cn(
                    'h-full w-full rounded-2xl border p-4 text-left transition-all',
                    t.live ? 'border-line bg-surface shadow-card hover:-translate-y-0.5 hover:shadow-lift' : 'border-dashed border-line/80 bg-bg/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold', t.live ? 'bg-primary-soft text-primary' : 'bg-ink/[.05] text-muted')}>
                      {t.key}
                    </span>
                    {t.live ? (
                      <Badge tone="ok">open</Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                        <Lock className="h-3 w-3" /> soon
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[13.5px] font-semibold text-ink/90">{t.name}</p>
                  <p className="text-[11.5px] text-muted">{t.live ? `${t.open} lessons open` : `${t.count} lessons in progress`}</p>
                  {t.live && (
                    <div className="mt-3">
                      <Progress value={(openedHere / Math.max(1, lessons.length)) * 100} />
                    </div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      </section>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-bg text-primary">
            <CalendarCheck className="h-[19px] w-[19px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">Homework from your teacher</p>
            <p className="text-[12px] text-muted">Nothing assigned yet. When there is, it shows up here with a due date.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onHomework}>
            Open homework <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

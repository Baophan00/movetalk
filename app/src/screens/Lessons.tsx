import { useState } from 'react'
import { ArrowRight, BookOpen, ChevronDown, ClipboardList, Play, Sparkles, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { A1, readingFor, titleOf, type LessonFile } from '../lib/curriculum'
import { exercisesFor, skillCounts } from '../lib/exercises'
import { allAttempts } from '../lib/study'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

type State = 'new' | 'doing' | 'done' | 'again'

function stateOf(lesson: number): { state: State; pct: number } {
  const rows = allAttempts().filter((a) => a.lesson === lesson)
  if (!rows.length) return { state: 'new', pct: 0 }
  const right = rows.filter((a) => a.correct).length
  const pct = Math.round((right / rows.length) * 100)
  const recentWrong = rows.slice(0, 8).filter((a) => !a.correct).length
  if (rows.length >= 18 && pct >= 80) return { state: 'done', pct }
  if (recentWrong >= 3) return { state: 'again', pct }
  return { state: 'doing', pct }
}

const CHIP: Record<State, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-bg text-muted border-line' },
  doing: { label: 'In progress', className: 'bg-primary-soft text-primary border-primary/20' },
  done: { label: 'Done', className: 'bg-ok/10 text-ok border-ok/25' },
  again: { label: 'Needs review', className: 'bg-accent/15 text-[#8a5a12] border-accent/30' },
}

function countsLine(l: LessonFile): string {
  const c = skillCounts(l.n)
  const bits = [`${l.parts.vocab.length} words`, `${c.grammar} grammar`, `${c.listening} listening`]
  if (c.reading) bits.push(`${c.reading} reading`)
  return bits.join(' · ')
}

export function Lessons({
  onPractise,
  onHomework,
  onReview,
}: {
  onPractise: (n: number) => void
  onHomework?: () => void
  onReview?: () => void
}) {
  const [openRead, setOpenRead] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Level A1</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Class practice</h2>
          <p className="mt-1 max-w-[58ch] text-[13px] text-muted">
            What your teacher covered in class, with practice for home. Pick a lesson and start.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onReview && (
            <button
              onClick={onReview}
              className="rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40"
            >
              Review
            </button>
          )}
          {onHomework && (
            <button
              onClick={onHomework}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40"
            >
              <ClipboardList className="h-3.5 w-3.5" /> Homework
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {A1.map((l) => {
          const { state, pct } = stateOf(l.n)
          const chip = CHIP[state]
          const total = exercisesFor(l.n).length
          const reading = readingFor(l.n)
          const words = l.parts.vocab.slice(0, 3)

          return (
            <Card key={l.n} className="overflow-hidden">
              <CardBody className="flex h-full flex-col p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[12px] font-bold',
                      state === 'done' ? 'bg-ok/15 text-ok' : 'bg-primary-soft text-primary',
                    )}
                  >
                    {String(l.n).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold leading-tight">{titleOf(l) || `Lesson ${l.n}`}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">{countsLine(l)}</p>
                  </div>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10.5px] font-semibold', chip.className)}>{chip.label}</span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{total} exercises</span>
                    <span>{pct}% right</span>
                  </div>
                  <Progress value={pct} />
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {words.map((w) => (
                    <button
                      key={w.word}
                      onClick={() => speak(w.word)}
                      className="inline-flex items-center gap-1 rounded-lg bg-bg/70 px-2 py-1 text-[11px] text-ink/75 transition hover:bg-primary-soft/60"
                    >
                      <Volume2 className="h-3 w-3 text-primary" /> {w.word}
                    </button>
                  ))}
                </div>

                <div className="mt-auto pt-3">
                  {reading && (
                    <button
                      onClick={() => setOpenRead(openRead === l.n ? null : l.n)}
                      className="mb-2 flex w-full items-center justify-between rounded-xl bg-bg/50 px-2.5 py-1.5 text-[11.5px] font-medium text-ink/75"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" /> Read: {reading.title}
                      </span>
                      <ChevronDown className={cn('h-3.5 w-3.5 transition', openRead === l.n && 'rotate-180')} />
                    </button>
                  )}
                  {reading && openRead === l.n && (
                    <p className="mb-2 rounded-xl border border-line/70 bg-bg/40 px-3 py-2 text-[12px] leading-relaxed text-ink/80">
                      {reading.text}
                    </p>
                  )}
                  <Button size="sm" className="w-full" onClick={() => onPractise(l.n)}>
                    <Play className="h-3.5 w-3.5" /> {state === 'new' ? 'Start practice' : 'Practise again'} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-line bg-bg/50 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[12px] leading-relaxed text-muted">
          Ten questions per round, mixed: word meaning, a gap, word order, listening, and one short reading. Wrong answers are kept so you
          can redo only those.
        </p>
      </div>
    </div>
  )
}

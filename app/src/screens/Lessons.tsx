import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { A1, partCount, partPlan, titleOf } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { cn } from '../lib/utils'

type Props = { onOpenLesson: (n: number) => void; onOpenReview: (n: number) => void }

export function Lessons({ onOpenLesson, onOpenReview }: Props) {
  const totalParts = A1.reduce((n, l) => n + partCount(l), 0)
  const openedParts = A1.reduce((n, l) => n + Math.min(partsSeen(l.n).length, partCount(l)), 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Level A1</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Activate 1 · {A1.length} lessons</h2>
          <p className="mt-1 text-[13px] text-muted">
            {openedParts} of {totalParts} parts opened. Pick up anywhere; nothing is locked.
          </p>
        </div>
        <div className="w-full sm:w-[210px]">
          <Progress value={totalParts ? (openedParts / totalParts) * 100 : 0} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {A1.map((l) => {
          const plan = partPlan(l)
          const seen = partsSeen(l.n).filter((i) => i < plan.length)
          const pct = plan.length ? Math.round((seen.length / plan.length) * 100) : 0
          const done = seen.length >= plan.length
          return (
            <Card key={l.n} className="group transition-shadow hover:shadow-lift">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[12px] font-bold',
                      done ? 'bg-[#c8f0e0] text-[#0f6b4f]' : pct > 0 ? 'bg-primary text-white' : 'bg-primary-soft text-primary',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : String(l.n).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold">{titleOf(l) || `Lesson ${l.n}`}</p>
                    <p className="text-[11.5px] text-muted">
                      {l.parts.vocab.length} words · {plan.length} parts
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-muted">{pct}%</span>
                </div>

                <Progress value={pct} className="mt-3" />

                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={() => onOpenLesson(l.n)}>
                    <BookOpen className="h-3.5 w-3.5" /> {pct > 0 ? 'Continue' : 'Open lesson'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onOpenReview(l.n)}>
                    Review <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

import { ArrowRight, RotateCcw, Volume2 } from 'lucide-react'
import { Icon3D } from '../components/Icon3D'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { A1, titleOf } from '../lib/curriculum'
import { allAttempts, dueCards, listCards, mistakeCount, wrongItems } from '../lib/study'
import { exercisesFor } from '../lib/exercises'

export function ReviewHub({
  onPractise,
  onWords,
  onRedo,
  onReviewQuiz,
  onHomework,
}: {
  onPractise: (n: number) => void
  onWords: () => void
  onRedo: () => void
  onReviewQuiz: () => void
  onHomework: () => void
}) {
  const due = dueCards()
  const cards = listCards()
  const wrong = wrongItems()
  const lessonsWithWrong = [...new Set(wrong.map((w) => w.lesson).filter(Boolean))] as number[]

  const perLesson = A1.map((l) => {
    const rows = allAttempts().filter((a) => a.lesson === l.n)
    const right = rows.filter((a) => a.correct).length
    return {
      n: l.n,
      title: titleOf(l) || `Lesson ${l.n}`,
      total: exercisesFor(l.n).length,
      tries: rows.length,
      pct: rows.length ? Math.round((right / rows.length) * 100) : 0,
      mistakes: mistakeCount(l.n),
    }
  })

  return (
    <div className="theme-overview mx-auto max-w-4xl bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">On your own</p>
      <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Review</h2>
      <p className="mt-1 max-w-[58ch] text-[13px] text-muted">
        Nothing here is set by your teacher. Words that are due, sentences you got wrong, and any lesson you want to run again.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-muted">
              <Icon3D name="audio" size={16} /> Words due
            </div>
            <p className="mt-2 text-[26px] font-semibold leading-none">{due.length}</p>
            <p className="mt-1 text-[11.5px] text-muted">{cards.length} saved in total</p>
            <Button size="sm" variant="soft" className="mt-3 w-full" onClick={onWords} disabled={!due.length}>
              <Volume2 className="h-3.5 w-3.5" /> Review those words
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-muted">
              <Icon3D name="streak" size={16} /> Got them wrong
            </div>
            <p className="mt-2 text-[26px] font-semibold leading-none">{wrong.length}</p>
            <p className="mt-1 text-[11.5px] text-muted">across {lessonsWithWrong.length} lessons</p>
            <Button size="sm" variant="soft" className="mt-3 w-full" onClick={onRedo} disabled={!wrong.length}>
              <RotateCcw className="h-3.5 w-3.5" /> Redo just those
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-muted">
              <Icon3D name="folder" size={16} /> From your teacher
            </div>
            <p className="mt-2 text-[13px] leading-snug text-ink/80">Homework lives on its own page, with dates and what you sent.</p>
            <Button size="sm" variant="soft" className="mt-3 w-full" onClick={onHomework}>
              Open homework
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <h3 className="text-[15px] font-semibold">Lesson by lesson</h3>
          <button onClick={onReviewQuiz} className="text-[12px] font-semibold text-primary hover:underline">
            Quick quiz only
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {perLesson.map((l) => (
            <Card key={l.n}>
              <CardBody className="flex items-center gap-3 p-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-[11.5px] font-bold text-primary">
                  {String(l.n).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold leading-tight">{l.title}</p>
                  <p className="text-[11.5px] text-muted">
                    {l.tries ? `${l.tries} answered · ${l.pct}% right` : 'Not started'} · {l.total} exercises
                  </p>
                </div>
                {l.mistakes > 0 && <Badge tone="warn">{l.mistakes} to redo</Badge>}
                <Button size="sm" variant="ghost" onClick={() => onPractise(l.n)}>
                  Practise <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

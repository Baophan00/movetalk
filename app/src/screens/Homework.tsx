import { useMemo, useState } from 'react'
import { Check, ChevronRight, Mic, PenLine, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { A1, quizFor, titleOf } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

const KEY = 'mt2_homework'

type Props = {
  onOpenReview: (lessonN: number) => void
  onOpenLesson: (lessonN: number) => void
  hasBackend: boolean
}

type Saved = Record<string, { done: string[]; writing: string }>

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Saved
  } catch {
    return {}
  }
}

function writeSaved(next: Saved) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function Homework({ onOpenReview, onOpenLesson, hasBackend }: Props) {
  const [saved, setSaved] = useState<Saved>(readSaved)
  const [writing, setWriting] = useState('')

  // The lesson to work on: the furthest one that has been opened, else the first.
  const current = useMemo(() => {
    const opened = A1.filter((l) => partsSeen(l.n).length > 0)
    return opened[opened.length - 1] ?? A1[0]
  }, [])

  const entry = saved[String(current.n)] ?? { done: [], writing: '' }
  const mission = current.parts.flow.find((g) => g.group === 'Mission')
  const steps = mission?.slides.flatMap((s) => s.lines).slice(0, 6) ?? []
  const questions = quizFor(current.n).length + current.parts.vocab.length
  const words = current.parts.vocab

  const toggle = (step: string) => {
    const done = entry.done.includes(step) ? entry.done.filter((d) => d !== step) : [...entry.done, step]
    const next = { ...saved, [String(current.n)]: { ...entry, done } }
    setSaved(next)
    writeSaved(next)
  }

  const saveWriting = () => {
    const next = { ...saved, [String(current.n)]: { ...entry, writing } }
    setSaved(next)
    writeSaved(next)
  }

  const doneCount = entry.done.length
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Homework</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Lesson {current.n}: {titleOf(current) || 'today'}</h2>
          <p className="mt-1 text-[13px] text-muted">Three things to finish before the next class. Your answers stay in this browser.</p>
        </div>
        <Badge tone={hasBackend ? 'ok' : 'neutral'}>{hasBackend ? 'classroom connected' : 'self-study mode'}</Badge>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                <Target className="h-3.5 w-3.5" /> Practice
              </p>
              <p className="mt-1 text-[14.5px] font-semibold">Review session · {Math.min(20, questions)} questions</p>
              <p className="text-[12px] text-muted">Words and exercises from this lesson. Missed ones come back at the end.</p>
            </div>
            <Button onClick={() => onOpenReview(current.n)}>
              Start review <ChevronRight className="h-4 w-4" />
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Daily mission</CardTitle>
            <span className="text-[11.5px] text-muted">
              {doneCount}/{steps.length || 0} done
            </span>
          </CardHeader>
          <CardBody className="pt-1">
            {steps.length === 0 ? (
              <p className="py-4 text-[12.5px] text-muted">This lesson has no mission slides.</p>
            ) : (
              <>
                <Progress value={percent} className="mb-3" />
                <div className="divide-y divide-line/70">
                  {steps.map((step) => {
                    const on = entry.done.includes(step)
                    return (
                      <button key={step} onClick={() => toggle(step)} className="flex w-full items-start gap-3 py-2.5 text-left">
                        <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border', on ? 'border-ok bg-ok text-white' : 'border-line bg-surface')}>
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <span className={cn('min-w-0 flex-1 text-[12.5px] leading-relaxed', on && 'text-muted line-through')}>{step}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Write five sentences</CardTitle>
            <span className="text-[11.5px] text-muted">{writing.trim() ? `${writing.trim().split('\n').filter(Boolean).length} lines` : 'not started'}</span>
          </CardHeader>
          <CardBody className="pt-1">
            <p className="text-[12px] text-muted">Use five words from this lesson. Your teacher reads this before the next class.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {words.slice(0, 6).map((w) => (
                <button key={w.word} onClick={() => speak(w.word)} className="rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-ink/75 hover:bg-primary-soft">
                  {w.word}
                </button>
              ))}
            </div>
            <textarea
              value={writing || entry.writing}
              onChange={(e) => setWriting(e.target.value)}
              onBlur={saveWriting}
              rows={5}
              placeholder="Five sentences with the words above…"
              className="focus-ring mt-3 w-full resize-y rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <PenLine className="h-3.5 w-3.5" /> Saved in this browser as you type.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpenLesson(current.n)}>
                  Open lesson <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={saveWriting}>Save</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                <Mic className="h-3.5 w-3.5" /> Speak it
              </p>
              <p className="mt-1 text-[14.5px] font-semibold">Record the dialogue, send it to your teacher</p>
              <p className="text-[12px] text-muted">
                {hasBackend ? 'Upload opens once the classroom is connected.' : 'Recording needs a signed-in account, so it is off in self-study mode.'}
              </p>
            </div>
            <Button variant="outline" disabled>
              Record
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, CalendarDays, Layers, Mic, RotateCcw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { A1, partPlan, titleOf } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { dueCards, doneToday, mistakeCount, pullStudy, streak, weakSections } from '../lib/study'
import { myAssignments } from '../lib/assignments'
import { Icon3D } from '../components/Icon3D'

type Go = (r: 'lesson' | 'practice' | 'library' | 'homework' | 'words' | 'mistakes', n?: number) => void

/** One screen, one decision: what to do in the next ten minutes. */
export function Today({ name, onGo }: { name: string; onGo: Go }) {
  const [tick, setTick] = useState(0)
  const [assigned, setAssigned] = useState(0)

  useEffect(() => {
    void pullStudy().finally(() => setTick((n) => n + 1))
    void myAssignments()
      .then((rows) => setAssigned(rows.filter((a) => a.status === 'assigned').length))
      .catch(() => undefined)
  }, [])

  const view = useMemo(() => {
    const current = [...A1].reverse().find((l) => partsSeen(l.n).length > 0) ?? A1[0]
    const plan = partPlan(current)
    const seen = new Set(partsSeen(current.n))
    const nextPart = plan.find((_, i) => !seen.has(i)) ?? plan[0]
    const nextIndex = plan.findIndex((_, i) => !seen.has(i))
    return {
      lesson: current,
      title: titleOf(current),
      part: nextPart,
      partNo: nextIndex < 0 ? plan.length : nextIndex + 1,
      total: plan.length,
      read: Math.min(seen.size, plan.length),
      mistakes: mistakeCount(),
      weak: weakSections(2),
      due: dueCards().length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const run = streak()
  const first = (name || '').split(' ')[0] || 'there'

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Hi {first},</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary">
          <Icon3D name="streak" size={16} /> {run === 0 ? 'Today starts the run' : `${run} day${run === 1 ? '' : 's'}`}
        </span>
      </div>

      <Card className="mt-4 overflow-hidden border-0 bg-primary text-white">
        <CardBody className="p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/70">Today's one thing</p>
            <Icon3D name="rocket" size={46} className="-mt-1" />
          </div>
          <p className="mt-1.5 text-[20px] font-semibold leading-snug">
            {doneToday() ? 'Done for today. Anything else is a bonus.' : `Part ${view.partNo} of ${view.total} · ${view.part.label}`}
          </p>
          <p className="mt-1 text-[12.5px] text-white/80">
            Lesson {view.lesson.n} · {view.title} · {view.read} of {view.total} parts read
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="bg-white text-primary hover:bg-white/90" onClick={() => onGo('lesson', view.lesson.n)}>
              <BookOpen className="h-3.5 w-3.5" /> Continue lesson
            </Button>
            <button
              onClick={() => onGo('practice', view.lesson.n)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/50 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-white/15"
            >
              <Mic className="h-3.5 w-3.5" /> Say one sentence
            </button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-3 space-y-2">
        <Row
          icon={<RotateCcw className="h-4 w-4" />}
          label={view.mistakes ? `${view.mistakes} question${view.mistakes === 1 ? '' : 's'} to redo` : 'No wrong answers waiting'}
          hint={view.weak.length ? view.weak.map((w) => `${w.section} (${w.wrong})`).join(' · ') : 'Answer a quiz and this fills up'}
          disabled={!view.mistakes}
          onClick={() => onGo('mistakes')}
        />
        <Row
          icon={<Layers className="h-4 w-4" />}
          label={view.due ? `${view.due} word${view.due === 1 ? '' : 's'} due today` : 'No words due today'}
          hint={view.due ? 'Two minutes, spaced repetition' : 'Tap any word while reading to keep it'}
          disabled={!view.due}
          onClick={() => onGo('words')}
        />
        <Row
          icon={<CalendarDays className="h-4 w-4" />}
          label={assigned ? `${assigned} homework from your teacher` : 'No homework set'}
          hint={assigned ? 'Due dates inside' : 'Nothing to hand in'}
          disabled={!assigned}
          onClick={() => onGo('homework')}
        />
      </div>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="text-[13px] font-semibold">How today counts</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Finish one thing — a part, a quiz, or one spoken sentence — and the day is kept. That is all a streak needs.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((view.read / view.total) * 100)}%` }} />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-muted">{Math.round((view.read / view.total) * 100)}%</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function Row({ icon, label, hint, disabled, onClick }: { icon: React.ReactNode; label: string; hint: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left transition enabled:hover:border-primary/40 disabled:opacity-55"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{label}</span>
        <span className="block truncate text-[11.5px] text-muted">{hint}</span>
      </span>
      {!disabled && <ArrowRight className="h-4 w-4 shrink-0 text-muted" />}
    </button>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, CircleCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Blocks } from '../components/LessonBlocks'
import { LESSONS, PART_META, partsOf } from '../lib/lessons'
import { markPart, partsSeen } from '../lib/progress'
import { cn } from '../lib/utils'

type Props = {
  lessonN: number
  onPickLesson: (n: number) => void
  onBack: () => void
}

export function Lesson({ lessonN, onPickLesson, onBack }: Props) {
  const lesson = LESSONS.find((l) => l.n === lessonN) || LESSONS[0]
  const parts = useMemo(() => partsOf(lesson), [lesson])
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState<number[]>(() => partsSeen(lesson.n))

  useEffect(() => {
    setActive(0)
    setSeen(partsSeen(lesson.n))
  }, [lesson.n])

  useEffect(() => {
    if (!parts[active]) return
    const t = window.setTimeout(() => {
      markPart(lesson.n, active)
      setSeen(partsSeen(lesson.n))
    }, 1200)
    return () => window.clearTimeout(t)
  }, [active, lesson.n, parts.length])

  const current = parts[active]
  const percent = parts.length ? Math.round((seen.length / parts.length) * 100) : 0
  const prevLesson = LESSONS.find((l) => l.n === lesson.n - 1)
  const nextLesson = LESSONS.find((l) => l.n === lesson.n + 1)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Tổng quan
      </button>

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Bài {lesson.n} · A1</p>
            <h2 className="mt-1 text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]">{lesson.title}</h2>
            <p className="mt-1 text-[13px] text-muted">{lesson.vi}</p>
          </div>
          <div className="w-full sm:w-[220px]">
            <div className="flex items-center justify-between text-[11.5px] text-muted">
              <span>Tiến độ bài</span>
              <span className="font-semibold text-ink">
                {seen.length}/{parts.length}
              </span>
            </div>
            <Progress value={percent} className="mt-1.5" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11.5px] font-medium text-primary">
            {parts.length} phần
          </span>
          {lesson.today.map((t) => (
            <span key={t} className="rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-muted">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[236px_1fr]">
        {/* part rail: right column on desktop, top row on mobile */}
        <nav className="order-1 lg:order-none">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {parts.map((p, i) => {
              const on = i === active
              const done = seen.includes(i)
              return (
                <button
                  key={p.key}
                  onClick={() => setActive(i)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[12.5px] font-medium transition-all lg:w-full',
                    on
                      ? 'border-primary/30 bg-primary-soft text-primary'
                      : 'border-line bg-surface text-ink/70 hover:border-primary/25 hover:text-ink',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                      done ? 'bg-ok/15 text-ok' : on ? 'bg-primary text-white' : 'bg-ink/[.06] text-muted',
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{PART_META[p.key]?.label ?? p.key}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="order-2 min-w-0 lg:order-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${lesson.n}-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-line/70 pb-3">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">
                    Phần {active + 1} / {parts.length}
                  </p>
                  <p className="text-[15px] font-semibold">{PART_META[current?.key]?.label ?? 'Nội dung'}</p>
                </div>
                {seen.includes(active) && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ok">
                    <CircleCheck className="h-3.5 w-3.5" /> đã mở
                  </span>
                )}
              </div>

              {current && <Blocks blocks={current.blocks} />}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <Button variant="ghost" size="sm" onClick={() => setActive((v) => Math.max(0, v - 1))} disabled={active === 0}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Phần trước
                </Button>
                {active < parts.length - 1 ? (
                  <Button size="sm" onClick={() => setActive((v) => v + 1)}>
                    Phần tiếp theo <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
                    Sang bài {nextLesson ? nextLesson.n : ''} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/70 px-4 py-3">
            <Button variant="outline" size="sm" onClick={() => prevLesson && onPickLesson(prevLesson.n)} disabled={!prevLesson}>
              <ArrowLeft className="h-3.5 w-3.5" /> Bài {prevLesson ? prevLesson.n : ''}
            </Button>
            <p className="text-[11.5px] text-muted">Bài {lesson.n} / {LESSONS.length} đang mở</p>
            <Button variant="outline" size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
              Bài {nextLesson ? nextLesson.n : ''} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

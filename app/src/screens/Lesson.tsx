import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleCheck, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { A1, lessonA1, partPlan, titleOf, type FlowGroup, type LessonFile } from '../lib/curriculum'
import { speak } from '../lib/audio'
import { markPart, partsSeen } from '../lib/progress'
import { pushPart } from '../lib/sync'
import { cn } from '../lib/utils'

type Props = {
  lessonN: number
  onPickLesson: (n: number) => void
  onBack: () => void
}

const PLAY_LABEL = 'Play'

function PlayButton({ text, small }: { text: string; small?: boolean }) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={PLAY_LABEL}
      onClick={() => speak(text)}
      className={cn(small ? 'h-7 w-7' : 'h-8 w-8', 'shrink-0')}
    >
      <Volume2 className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
    </Button>
  )
}

function Vocabulary({ items }: { items: LessonFile['parts']['vocab'] }) {
  const [open, setOpen] = useState<string[]>([])
  const toggle = (w: string) => setOpen((o) => (o.includes(w) ? o.filter((x) => x !== w) : [...o, w]))

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((v) => {
        const isOpen = open.includes(v.word)
        return (
          <div key={v.word} className={cn('rounded-2xl border p-3.5 transition-colors', isOpen ? 'border-primary/30 bg-primary-soft/60' : 'border-line bg-surface')}>
            <div className="flex items-start gap-2">
              <button onClick={() => toggle(v.word)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[14.5px] font-semibold">{v.word}</span>
                <span className="block truncate text-[11.5px] text-muted">
                  {v.pos}
                  {v.ipa && <span className="ml-1.5 font-mono">{v.ipa}</span>}
                </span>
              </button>
              <PlayButton text={v.word} small />
            </div>
            {isOpen ? (
              <div className="mt-2 border-t border-line/70 pt-2">
                <p className="text-[12.5px] font-medium">{v.vi}</p>
                {v.def && <p className="text-[11.5px] text-muted">{v.def}</p>}
                {v.example && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[12px] italic text-ink/75">
                    <span className="min-w-0 flex-1">{v.example}</span>
                  </p>
                )}
                {v.cloze && <p className="mt-1 text-[11.5px] text-muted">Recall: {v.cloze}</p>}
              </div>
            ) : (
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
                Tap for the meaning <ChevronRight className="h-3 w-3" />
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Grammar({ sections }: { sections: LessonFile['parts']['grammar'] }) {
  return (
    <div className="space-y-3">
      {sections.map((g) => (
        <div key={g.section + g.sub} className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-primary">{g.section}</p>
          {g.sub && <p className="mt-1 text-[14px] font-semibold leading-snug">{g.sub}</p>}
          <ul className="mt-2 space-y-1.5">
            {g.lines.map((line, i) => (
              <li key={`${line}-${i}`} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink/80">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink/25" />
                <span className="min-w-0 flex-1 break-words">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Dialogue({ turns }: { turns: LessonFile['parts']['dialogue'] }) {
  return (
    <div className="space-y-2">
      {turns.map((t, i) => (
        <div key={`${t.who}-${i}`} className={cn('flex gap-2', i % 2 === 1 && 'flex-row-reverse')}>
          <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[10.5px] font-bold text-primary">
            {t.who.slice(0, 1)}
          </span>
          <div className={cn('max-w-[86%] rounded-2xl px-3.5 py-2', i % 2 === 1 ? 'bg-primary text-white' : 'bg-bg text-ink')}>
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-[13px] leading-snug">{t.line}</p>
              <button onClick={() => speak(t.line)} className={cn('mt-0.5 shrink-0', i % 2 === 1 ? 'text-white/80' : 'text-primary')} aria-label={PLAY_LABEL}>
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className={cn('mt-0.5 text-[10px] font-semibold uppercase tracking-wide', i % 2 === 1 ? 'text-white/60' : 'text-muted')}>{t.who}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Checks({ items }: { items: LessonFile['parts']['listenCheck'] }) {
  const [shown, setShown] = useState<number[]>([])
  return (
    <div className="divide-y divide-line/70">
      {items.map((c, i) => (
        <button key={c.q} onClick={() => setShown((s) => (s.includes(i) ? s : [...s, i]))} className="flex w-full items-start gap-3 py-2.5 text-left">
          <span className="mt-0.5 w-6 shrink-0 text-[11px] tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium">{c.q}</span>
            {shown.includes(i) ? (
              <span className="mt-1 block text-[12px] text-[#0f6b4f]">{c.a}</span>
            ) : (
              <span className="mt-1 block text-[11px] text-muted">Tap to check</span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

function Choose({ items }: { items: LessonFile['parts']['grammarChoose'] }) {
  const [shown, setShown] = useState<number[]>([])
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <button
          key={c.prompt}
          onClick={() => setShown((s) => (s.includes(i) ? s : [...s, i]))}
          className="w-full rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-left"
        >
          <p className="text-[13.5px] font-medium">{c.prompt}</p>
          <p className="mt-0.5 text-[11.5px] text-muted">{c.vi}</p>
          {shown.includes(i) && (
            <p className="mt-1.5 text-[11.5px] font-semibold text-primary">
              Say the full question, then check with the audio above.
            </p>
          )}
        </button>
      ))}
    </div>
  )
}

function Flow({ groups }: { groups: FlowGroup[] }) {
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.group}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[10.5px] font-bold uppercase tracking-[.16em] text-muted">{g.group}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="space-y-2">
            {g.slides.map((slide, i) => (
              <details key={`${slide.title}-${i}`} open={g.slides.length <= 2} className="group rounded-2xl border border-line bg-surface px-3.5 py-2.5">
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-open:rotate-90" />
                  <span className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug">
                    {slide.title}
                    {g.slides.filter((x) => x.title === slide.title).length > 1 && (
                      <span className="ml-1.5 text-[11px] font-normal text-muted">
                        {g.slides.findIndex((x) => x === slide) + 1}/{g.slides.length}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-muted">{slide.lines.length}</span>
                </summary>
                <ul className="mt-2 space-y-1 pl-5">
                  {slide.lines.map((line, k) => (
                    <li key={`${line}-${k}`} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink/80">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink/25" />
                      <span className="min-w-0 flex-1 break-words">{line}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Lesson({ lessonN, onPickLesson, onBack }: Props) {
  const lesson = lessonA1(lessonN) ?? A1[0]
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState<number[]>([])

  const parts = useMemo(() => {
    if (!lesson) return []
    const nodes: Record<string, React.ReactNode> = {
      vocab: <Vocabulary items={lesson.parts.vocab} />,
      grammar: <Grammar sections={lesson.parts.grammar} />,
      dialogue: <Dialogue turns={lesson.parts.dialogue} />,
      check: <Checks items={lesson.parts.listenCheck} />,
      choose: <Choose items={lesson.parts.grammarChoose} />,
    }
    for (const g of lesson.parts.flow) nodes[`flow-${g.group}`] = <Flow groups={[g]} />
    return partPlan(lesson).map((p) => ({ ...p, node: nodes[p.key] }))
  }, [lesson])

  useEffect(() => {
    if (!lesson) return
    setActive(0)
    setSeen(partsSeen(lesson.n))
  }, [lessonN, lesson])

  useEffect(() => {
    if (!lesson || !parts[active]) return
    const t = window.setTimeout(() => {
      markPart(lesson.n, active)
      setSeen(partsSeen(lesson.n))
      if (parts[active]) void pushPart(lesson.n, parts[active].key)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [active, lesson, parts.length])

  if (!lesson) return null

  const percent = parts.length ? Math.round((seen.length / parts.length) * 100) : 0
  const prevLesson = A1.find((l) => l.n === lesson.n - 1)
  const nextLesson = A1.find((l) => l.n === lesson.n + 1)
  const totalWords = lesson.parts.vocab.length

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Overview
      </button>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {A1.map((l) => (
          <button
            key={l.n}
            onClick={() => onPickLesson(l.n)}
            className={cn(
              'shrink-0 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-semibold tabular-nums transition-colors',
              l.n === lesson.n ? 'border-primary/40 bg-primary text-white' : 'border-line bg-surface text-ink/70 hover:bg-primary-soft/60',
            )}
          >
            {String(l.n).padStart(2, '0')}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-[#ded4fb] bg-[#f3efff] p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Lesson {lesson.n} · A1</p>
            <h2 className="mt-1 text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]">
              {titleOf(lesson) || `Lesson ${lesson.n}`}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {totalWords} words · {parts.length} parts
            </p>
          </div>
          <div className="w-full sm:w-[220px]">
            <div className="flex items-center justify-between text-[11.5px] text-muted">
              <span>Lesson progress</span>
              <span className="font-semibold text-ink">
                {seen.length}/{parts.length}
              </span>
            </div>
            <Progress value={percent} className="mt-1.5" />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[236px_1fr]">
        <nav className="order-1 min-w-0 lg:order-none">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible">
            {parts.map((p, i) => {
              const done = seen.includes(i)
              const on = i === active
              return (
                <button
                  key={p.key}
                  onClick={() => setActive(i)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition-colors lg:w-full',
                    on ? 'bg-primary-soft text-primary' : 'text-ink/70 hover:bg-ink/[.04]',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                      done ? 'bg-[#c8f0e0] text-[#0f6b4f]' : on ? 'bg-primary text-white' : 'bg-ink/[.06] text-muted',
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{p.label}</span>
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
                    Part {active + 1} of {parts.length}
                  </p>
                  <p className="text-[15px] font-semibold">{parts[active]?.label}</p>
                </div>
                {seen.includes(active) && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ok">
                    <CircleCheck className="h-3.5 w-3.5" /> opened
                  </span>
                )}
              </div>

              {parts[active]?.node}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <Button variant="ghost" size="sm" onClick={() => setActive((v) => Math.max(0, v - 1))} disabled={active === 0}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous part
                </Button>
                {active < parts.length - 1 ? (
                  <Button size="sm" onClick={() => setActive((v) => v + 1)}>
                    Next part <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
                    Go to lesson {nextLesson ? nextLesson.n : ''} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/70 px-4 py-3">
            <Button variant="outline" size="sm" onClick={() => prevLesson && onPickLesson(prevLesson.n)} disabled={!prevLesson}>
              <ArrowLeft className="h-3.5 w-3.5" /> Lesson {prevLesson ? prevLesson.n : ''}
            </Button>
            <p className="text-[11.5px] text-muted">
              Lesson {lesson.n} of {A1.length}
            </p>
            <Button variant="outline" size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
              Lesson {nextLesson ? nextLesson.n : ''} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

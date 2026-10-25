import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { A1, lessonA1, partPlan, quizFor, titleOf, type FlowGroup, type LessonFile } from '../lib/curriculum'
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
    <div>
      <p className="mb-2 flex items-center justify-between text-[11.5px] text-muted">
        <span>Tap a word for the Vietnamese meaning.</span>
        <span>{items.length} words</span>
      </p>
      <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line">
        {items.map((v) => {
          const isOpen = open.includes(v.word)
          return (
            <li key={v.word} className={cn('transition-colors', isOpen ? 'bg-primary-soft/45' : 'bg-surface hover:bg-bg/60')}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => toggle(v.word)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(v.word)
                  }
                }}
                className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <p className="shrink-0 text-[15px] font-semibold leading-tight text-ink">{v.word}</p>
                  {v.ipa && <p className="truncate font-mono text-[11.5px] text-muted">{v.ipa}</p>}
                  {v.pos && (
                    <span className="shrink-0 rounded bg-ink/[.05] px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-muted">
                      {v.pos}
                    </span>
                  )}
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <PlayButton text={v.word} small />
                </span>
                <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted transition-transform', isOpen && 'rotate-90')} />
              </div>
              {isOpen && (
                <div className="px-3.5 pb-3">
                  <p className="text-[13px] font-medium text-ink">{v.vi}</p>
                  {v.def && <p className="mt-0.5 text-[12px] text-muted">{v.def}</p>}
                  {v.example && <p className="mt-1.5 border-l-2 border-primary/25 pl-2 text-[12.5px] italic text-ink/75">{v.example}</p>}
                  {v.cloze && <p className="mt-1 text-[11.5px] text-muted">Fill in: {v.cloze}</p>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const VI_CHARS = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i

function Dialogue({ turns }: { turns: LessonFile['parts']['dialogue'] }) {
  return (
    <div className="space-y-2.5">
      {turns.map((t, i) => {
        const mine = i % 2 === 1
        return (
          <div key={`${t.who}-${i}`} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
              {t.who.slice(0, 1)}
            </span>
            <div className={cn('max-w-[82%]', mine ? 'items-end text-right' : 'items-start')}>
              <p className={cn('mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted', mine && 'text-right')}>{t.who}</p>
              <div
                className={cn(
                  'group inline-flex items-start gap-2 rounded-2xl px-3 py-2 text-left',
                  mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-bg text-ink',
                )}
              >
                <p className="min-w-0 text-[13px] leading-snug">{t.line}</p>
                <button
                  onClick={() => speak(t.line)}
                  className={cn('mt-0.5 shrink-0 opacity-60 transition-opacity hover:opacity-100', mine ? 'text-white' : 'text-primary')}
                  aria-label={PLAY_LABEL}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** "Chọn Do hay Are" reads as an instruction, so show it in English; the note lines stay Vietnamese. */
function englishSub(sub: string) {
  const m = sub.match(/^Chọn\s+(.+?)\s+hay\s+(.+)$/i)
  if (m) return `${m[1].trim()} or ${m[2].trim()}?`
  return sub.replace(/\shay\s/gi, ' or ')
}

function Grammar({ sections }: { sections: LessonFile['parts']['grammar'] }) {
  return (
    <div className="space-y-2.5">
      {sections.map((g) => (
        <div key={g.section + g.sub} className="rounded-2xl border border-line bg-surface px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{g.section}</p>
          {g.sub && <p className="mt-1 text-[14.5px] font-semibold leading-snug">{englishSub(g.sub)}</p>}
          <ul className="mt-2 space-y-1">
            {g.lines.map((line, i) => {
              const vi = VI_CHARS.test(line)
              const pattern = !vi && (/\+/.test(line) || /^[A-Z0-9 …?.,'\/-]{4,}$/.test(line))
              return (
                <li key={`${line}-${i}`} className={cn('flex items-start gap-2 text-[12.5px] leading-relaxed', vi ? 'text-muted' : 'text-ink/85')}>
                  {!vi && !pattern && <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink/25" />}
                  <span
                    className={cn(
                      'break-words',
                      pattern ? 'rounded-md bg-ink/[.045] px-1.5 py-0.5 font-mono text-[11.5px] text-ink' : 'min-w-0 flex-1',
                      vi && 'italic',
                    )}
                  >
                    {line}
                  </span>
                </li>
              )
            })}
          </ul>
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

/** The deck opens on a title slide; show it as a cover, not as a wall of slide lines. */
function Overview({ lesson, partCount, onStart }: { lesson: LessonFile; partCount: number; onStart: () => void }) {
  const g = lesson.parts.flow.find((x) => x.group === 'Overview')
  const lines = g?.slides?.[0]?.lines ?? []
  const vi = lines.find((l) => VI_CHARS.test(l) && l.length > 8)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ded4fb] bg-[#f8f5ff] px-5 py-6 sm:px-7 sm:py-8">
      <span aria-hidden className="pointer-events-none absolute -right-3 -top-6 select-none text-[118px] font-bold leading-none text-primary/[.07]">
        {String(lesson.n).padStart(2, '0')}
      </span>
      <p className="text-[10.5px] font-bold uppercase tracking-[.16em] text-primary">
        A1 · Lesson {lesson.n}
      </p>
      <h3 className="mt-1.5 max-w-[22ch] text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[30px]">
        {titleOf(lesson) || `Lesson ${lesson.n}`}
      </h3>
      {vi && <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-ink/70">{vi}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-[#ded4fb] bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/75">
          {lesson.parts.vocab.length} words
        </span>
        <span className="rounded-full border border-[#ded4fb] bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/75">
          {partCount} parts
        </span>
        {lesson.parts.dialogue.length > 0 && (
          <span className="rounded-full border border-[#ded4fb] bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/75">
            {lesson.parts.dialogue.length} dialogue lines
          </span>
        )}
        {lesson.parts.listenCheck.length > 0 && (
          <span className="rounded-full border border-[#ded4fb] bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/75">
            {lesson.parts.listenCheck.length} listening checks
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button size="sm" onClick={onStart}>
          Start the lesson <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <p className="hidden text-[11.5px] text-muted sm:block">Title slide of the handout. Next part opens Vocabulary.</p>
      </div>
    </div>
  )
}

type PracticeItem = { prompt: string; vi?: string; options: string[]; answer: string }

/** The handout's choose exercises, with the deck's own answer key. One tap, immediate answer. */
function Choose({ items, fallback }: { items: PracticeItem[]; fallback: LessonFile['parts']['grammarChoose'] }) {
  const [picked, setPicked] = useState<Record<number, string>>({})

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        {fallback.map((c) => (
          <div key={c.prompt} className="rounded-2xl border border-line bg-surface px-3.5 py-2.5">
            <p className="text-[13.5px] font-medium">{c.prompt}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">{c.vi}</p>
            <p className="mt-1.5 text-[11.5px] text-muted">Say it out loud, then check with your teacher.</p>
          </div>
        ))}
      </div>
    )
  }

  const right = items.filter((it, i) => picked[i] === it.answer).length
  const answered = Object.keys(picked).length

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11.5px] text-muted">
        <span>Pick the missing word.</span>
        <span className="tabular-nums">
          {answered} / {items.length} answered · <span className="font-semibold text-ink">{right} right</span>
        </span>
      </div>
      <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line">
        {items.map((it, i) => {
          const pick = picked[i]
          const chosen = pick !== undefined
          const ok = pick === it.answer
          return (
            <li key={`${it.prompt}-${i}`} className={cn('bg-surface px-3.5 py-2.5', chosen && (ok ? 'bg-[#f1fbf5]' : 'bg-[#fdf3f2]'))}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium leading-snug">{it.prompt}</p>
                  {it.vi && <p className="text-[11.5px] text-muted">{it.vi}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {it.options.map((opt) => {
                    const isRight = opt === it.answer
                    const isPick = opt === pick
                    return (
                      <button
                        key={opt}
                        disabled={chosen}
                        onClick={() => setPicked((p) => ({ ...p, [i]: opt }))}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                          !chosen && 'border-line hover:border-primary/40 hover:bg-primary-soft/60',
                          chosen && isRight && 'border-[#0f6b4f]/30 bg-[#c8f0e0] text-[#0f6b4f]',
                          chosen && isPick && !isRight && 'border-[#8a2b22]/30 bg-[#fde4e1] text-[#8a2b22]',
                          chosen && !isRight && !isPick && 'border-line/70 text-muted opacity-50',
                        )}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
              {chosen && !ok && (
                <p className="mt-1.5 text-[11.5px] text-[#8a2b22]">
                  It is “{it.answer}”. Say the whole question once with it.
                </p>
              )}
            </li>
          )
        })}
      </ul>
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
      choose: <Choose
        items={quizFor(lesson.n)
          .filter((q) => q.kind === 'choice' && q.options && q.options.length > 1)
          .slice(0, 8)
          .map((q) => ({
            prompt: q.prompt,
            vi: lesson.parts.grammarChoose.find((c) => c.prompt === q.prompt)?.vi,
            options: q.options ?? [],
            answer: q.answer,
          }))}
        fallback={lesson.parts.grammarChoose}
      />,
    }
    for (const g of lesson.parts.flow) {
      if (g.group === 'Overview') continue
      nodes[`flow-${g.group}`] = <Flow groups={[g]} />
    }
    const plan = partPlan(lesson)
    nodes['flow-Overview'] = <Overview lesson={lesson} partCount={plan.length} onStart={() => setActive(1)} />
    return plan.map((p) => ({ ...p, node: nodes[p.key] }))
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
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> All lessons
        </button>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" aria-label="Previous lesson" disabled={!prevLesson} onClick={() => prevLesson && onPickLesson(prevLesson.n)}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <select
            value={lesson.n}
            onChange={(e) => onPickLesson(Number(e.target.value))}
            className="focus-ring h-8 w-[calc(100vw-200px)] max-w-[260px] truncate rounded-xl border border-line bg-surface px-2 text-[12px] font-semibold tabular-nums sm:w-auto"
            aria-label="Choose a lesson"
          >
            {A1.map((l) => (
              <option key={l.n} value={l.n}>
                Lesson {l.n} · {titleOf(l) || 'A1'}
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" aria-label="Next lesson" disabled={!nextLesson} onClick={() => nextLesson && onPickLesson(nextLesson.n)}>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[#ded4fb] bg-[#f3efff] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-primary">
            A1 · Lesson {lesson.n} of {A1.length}
          </p>
          <p className="shrink-0 text-[11.5px] text-muted">
            {totalWords} words · {parts.length} parts · {percent}% opened
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={percent} className="h-1.5 flex-1" />
          <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-ink">
            {seen.length}/{parts.length}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[228px_1fr]">
        <nav className="min-w-0">
          <p className="mb-1.5 hidden px-2 text-[10.5px] font-bold uppercase tracking-[.14em] text-muted lg:block">Parts</p>
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
            {parts.map((p, i) => {
              const done = seen.includes(i)
              const on = i === active
              return (
                <button
                  key={p.key}
                  onClick={() => setActive(i)}
                  aria-current={on ? 'step' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors lg:w-full',
                    on ? 'bg-primary/10 font-semibold text-primary' : 'text-ink/70 hover:bg-ink/[.04]',
                  )}
                >
                  <span className={cn('w-5 shrink-0 text-right text-[10.5px] font-bold tabular-nums', on ? 'text-primary' : 'text-muted/80')}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  {done && <Check className={cn('h-3 w-3 shrink-0', on ? 'text-primary' : 'text-ok')} />}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="min-w-0">
          <motion.div
            key={`${lesson.n}-${active}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="text-[16px] font-semibold tracking-tight">{parts[active]?.label}</h3>
              <span className="shrink-0 text-[11px] tabular-nums text-muted">
                {active + 1} / {parts.length}
              </span>
            </div>

            {parts[active]?.node}

            <div className={cn('mt-5 flex items-center justify-between gap-2 border-t border-line/60 pt-3.5', active === 0 && 'hidden')}>
              <Button variant="ghost" size="sm" onClick={() => setActive((v) => Math.max(0, v - 1))} disabled={active === 0}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              {active < parts.length - 1 ? (
                <Button size="sm" onClick={() => setActive((v) => v + 1)}>
                  Next part <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
                  {nextLesson ? `Lesson ${nextLesson.n}` : 'Done'} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

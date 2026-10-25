import { useEffect, useMemo, useState } from 'react'
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
      <ul className="overflow-hidden rounded-2xl border border-line sm:grid sm:grid-cols-2 sm:gap-x-5">
        {items.map((v) => {
          const isOpen = open.includes(v.word)
          return (
            <li key={v.word} className={cn('border-b border-line/60 transition-colors last:border-b-0', isOpen ? 'bg-primary-soft/45' : 'bg-surface hover:bg-bg/60')}>
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
    <div className="space-y-1.5">
      {turns.map((t, i) => {
        const mine = i % 2 === 1
        return (
          <div key={`${t.who}-${i}`} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
              {t.who.slice(0, 1)}
            </span>
            <div className={cn('max-w-[82%]', mine ? 'items-end text-right' : 'items-start')}>
              {turns[i - 1]?.who !== t.who && (
                <p className={cn('mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted', mine && 'text-right')}>{t.who}</p>
              )}
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
      <ul className="overflow-hidden rounded-2xl border border-line sm:grid sm:grid-cols-2 sm:gap-x-5">
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

function Flow({ groups, heading = true }: { groups: FlowGroup[]; heading?: boolean }) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.group}>
          {heading && (
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10.5px] font-bold uppercase tracking-[.16em] text-muted">{g.group}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          )}
          <div className="grid gap-2.5 lg:grid-cols-2">
            {g.slides.map((slide, i) => {
              const dup = g.slides.filter((x) => x.title === slide.title).length > 1
              return (
                <div key={`${slide.title}-${i}`} className={cn('rounded-2xl border border-line bg-surface px-3.5 py-3', g.slides.length === 1 && 'lg:col-span-2')}>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-primary/35" />
                    <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug text-ink">
                      {slide.title}
                      {dup && <span className="ml-1.5 text-[10.5px] font-normal text-muted">{i + 1}/{g.slides.length}</span>}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {slide.lines
                      .filter((line) => line.trim().toLowerCase() !== slide.title.trim().toLowerCase())
                      .map((line, k) => {
                      const vi = VI_CHARS.test(line)
                      const pattern = !vi && (/\+/.test(line) || /^[A-Z0-9 …?.,'\/-]{4,}$/.test(line))
                      return (
                        <li key={`${line}-${k}`} className={cn('flex items-start gap-1.5 text-[12.5px] leading-relaxed', vi ? 'text-ink/60' : 'text-ink/85')}>
                          {!vi && !pattern && <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink/20" />}
                          <span
                            className={cn(
                              'min-w-0 break-words',
                              pattern ? 'rounded-md bg-ink/[.04] px-1.5 py-0.5 font-mono text-[11px] text-ink' : 'flex-1',
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
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
type Tone = 'violet' | 'mint' | 'lavender' | 'sky' | 'peach' | 'rose'

const TONES: Record<Tone, { soft: string; border: string; text: string; solid: string }> = {
  violet: { soft: 'bg-[#f4f0ff]', border: 'border-[#ded4fb]', text: 'text-[#5b45a8]', solid: 'bg-[#7a5cf0]' },
  mint: { soft: 'bg-[#eafaf3]', border: 'border-[#c9eddd]', text: 'text-[#0f6b4f]', solid: 'bg-[#2f9e79]' },
  lavender: { soft: 'bg-[#eff1ff]', border: 'border-[#d7ddfb]', text: 'text-[#3f4c9a]', solid: 'bg-[#5a6ad4]' },
  sky: { soft: 'bg-[#eaf5ff]', border: 'border-[#cbe6fb]', text: 'text-[#1c5a86]', solid: 'bg-[#3793d1]' },
  peach: { soft: 'bg-[#fff3e6]', border: 'border-[#fbddc2]', text: 'text-[#8a5320]', solid: 'bg-[#e08a3c]' },
  rose: { soft: 'bg-[#fdeef5]', border: 'border-[#f8d8e8]', text: 'text-[#8c3560]', solid: 'bg-[#c9528c]' },
}

/** Six sections instead of thirteen parts: the deck's blocks are folded into the stage they belong to. */
const SECTIONS: { id: string; label: string; tone: Tone; keys: string[] }[] = [
  { id: 'overview', label: 'Overview', tone: 'violet', keys: ['flow-Overview'] },
  { id: 'words', label: 'Words', tone: 'mint', keys: ['vocab'] },
  { id: 'grammar', label: 'Grammar', tone: 'lavender', keys: ['grammar', 'choose'] },
  { id: 'listening', label: 'Listening', tone: 'sky', keys: ['flow-Before you listen', 'dialogue', 'check'] },
  { id: 'speaking', label: 'Speaking', tone: 'peach', keys: ['flow-Pronunciation', 'flow-Activate', 'flow-Real talk'] },
  { id: 'wrap', label: 'Wrap-up', tone: 'rose', keys: ['flow-Reflect', 'flow-Mission', 'flow-Work', 'flow-Point & say'] },
]

export function Lesson({ lessonN, onPickLesson, onBack }: Props) {
  const lesson = lessonA1(lessonN) ?? A1[0]
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState<number[]>([])

  const plan = useMemo(() => (lesson ? partPlan(lesson) : []), [lesson])

  const nodes = useMemo<Record<string, React.ReactNode>>(() => {
    if (!lesson) return {}
    const n: Record<string, React.ReactNode> = {
      vocab: <Vocabulary items={lesson.parts.vocab} />,
      grammar: <Grammar sections={lesson.parts.grammar} />,
      dialogue: <Dialogue turns={lesson.parts.dialogue} />,
      check: <Checks items={lesson.parts.listenCheck} />,
      choose: (
        <Choose
          items={quizFor(lesson.n)
            .filter((q) => q.kind === 'choice' && q.options && q.options.length > 1)
            .slice(0, 10)
            .map((q) => ({
              prompt: q.prompt,
              vi: lesson.parts.grammarChoose.find((c) => c.prompt === q.prompt)?.vi,
              options: q.options ?? [],
              answer: q.answer,
            }))}
          fallback={lesson.parts.grammarChoose}
        />
      ),
    }
    for (const g of lesson.parts.flow) {
      if (g.group === 'Overview') continue
      n[`flow-${g.group}`] = <Flow groups={[g]} heading={false} />
    }
    n['flow-Overview'] = <Overview lesson={lesson} partCount={plan.length} onStart={() => setActive(1)} />
    return n
  }, [lesson, plan.length])

  const sections = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        blocks: s.keys
          .filter((k) => nodes[k])
          .map((k) => ({ key: k, label: plan.find((p) => p.key === k)?.label ?? '', node: nodes[k] })),
      })).filter((s) => s.blocks.length > 0),
    [nodes, plan],
  )

  useEffect(() => {
    if (!lesson) return
    setActive(0)
    setSeen(partsSeen(lesson.n))
  }, [lessonN, lesson])

  const current = sections[active] ?? sections[0]

  useEffect(() => {
    if (!lesson || !current) return
    const t = window.setTimeout(() => {
      for (const b of current.blocks) {
        const i = plan.findIndex((p) => p.key === b.key)
        if (i >= 0) markPart(lesson.n, i)
        void pushPart(lesson.n, b.key)
      }
      setSeen(partsSeen(lesson.n))
    }, 1200)
    return () => window.clearTimeout(t)
  }, [active, lesson, current, plan])

  if (!lesson) return null

  const opened = (sec: (typeof sections)[number]) =>
    sec.blocks.some((b) => seen.includes(plan.findIndex((p) => p.key === b.key)))

  const openedCount = sections.filter(opened).length
  const percent = sections.length ? Math.round((openedCount / sections.length) * 100) : 0
  const prevLesson = A1.find((l) => l.n === lesson.n - 1)
  const nextLesson = A1.find((l) => l.n === lesson.n + 1)
  const tone = TONES[current?.tone ?? 'violet']

  return (
    <div className="w-full px-3 pb-10 pt-3 sm:px-5 lg:px-7">
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
            className="focus-ring h-8 w-[calc(100vw-200px)] max-w-[280px] truncate rounded-xl border border-line bg-surface px-2 text-[12px] font-semibold tabular-nums sm:w-auto"
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

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[.16em] text-primary">A1 · Lesson {lesson.n} of {A1.length}</p>
          <h2 className="mt-0.5 truncate text-[22px] font-semibold leading-tight tracking-tight sm:text-[25px]">
            {titleOf(lesson) || `Lesson ${lesson.n}`}
          </h2>
        </div>
        <div className="flex min-w-[160px] flex-1 items-center gap-3 sm:max-w-[300px]">
          <Progress value={percent} className="h-1.5 flex-1" />
          <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-ink">
            {openedCount}/{sections.length} sections
          </span>
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {sections.map((sec, i) => {
          const t = TONES[sec.tone]
          const on = i === active
          return (
            <button
              key={sec.id}
              onClick={() => setActive(i)}
              aria-current={on ? 'step' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                on ? cn(t.soft, t.border, t.text) : 'border-line bg-surface text-ink/65 hover:border-ink/15 hover:text-ink',
              )}
            >
              <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-[5px] text-[9.5px] font-bold tabular-nums', on ? 'bg-white/75' : t.soft, t.text)}>
                {i + 1}
              </span>
              {sec.label}
              {opened(sec) && <Check className={cn('h-3 w-3', on ? t.text : 'text-ok')} />}
            </button>
          )
        })}
      </div>

      {current && (
        <section key={current.id} className={cn('mt-3 overflow-hidden rounded-3xl border', tone.border, 'bg-surface')}>
          <header className={cn('flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6', tone.soft)}>
            <div className="min-w-0">
              <p className={cn('text-[10.5px] font-bold uppercase tracking-[.16em]', tone.text)}>
                Section {active + 1} of {sections.length}
              </p>
              <h3 className="mt-0.5 text-[19px] font-semibold leading-tight tracking-tight sm:text-[21px]">{current.label}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {active > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setActive(active - 1)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
              )}
              {active < sections.length - 1 ? (
                <Button size="sm" onClick={() => setActive(active + 1)}>
                  Next section <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
                  {nextLesson ? `Lesson ${nextLesson.n}` : 'Done'} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </header>

          <div className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
            {current.blocks.map((b) => {
              const i = plan.findIndex((p) => p.key === b.key)
              const done = seen.includes(i)
              return (
                <div key={b.key}>
                  {current.blocks.length > 1 && (
                    <div className="mb-2 flex items-center gap-2">
                      <p className={cn('text-[10.5px] font-bold uppercase tracking-[.14em]', tone.text)}>{b.label}</p>
                      <span className="h-px flex-1 bg-line/70" />
                      {done && <Check className="h-3 w-3 text-ok" />}
                    </div>
                  )}
                  {b.node}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

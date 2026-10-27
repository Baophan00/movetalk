import { useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Headphones, Mic, RotateCcw, Star, Volume2, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { A1, titleOf } from '../lib/curriculum'
import { buildersFor, listensFor, pairsFor, quizRound, speakingLines } from '../lib/practice'
import { speak } from '../lib/audio'
import { recordAttempt } from '../lib/study'
import { SpeakRoom } from '../components/SpeakRoom'
import { cn } from '../lib/utils'

type Tab = 'quiz' | 'words' | 'build' | 'listen' | 'speak'

const TABS: { key: Tab; label: string; short: string; icon: typeof Star }[] = [
  { key: 'quiz', label: 'Quick quiz', short: 'Quiz', icon: Star },
  { key: 'words', label: 'Word match', short: 'Words', icon: RotateCcw },
  { key: 'build', label: 'Build a sentence', short: 'Build', icon: Check },
  { key: 'listen', label: 'Listen & pick', short: 'Listen', icon: Headphones },
  { key: 'speak', label: 'Say it', short: 'Speak', icon: Mic },
]

function Stars({ score, total }: { score: number; total: number }) {
  const pct = total ? score / total : 0
  const n = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct > 0 ? 1 : 0
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <Star key={i} className={cn('h-4 w-4', i < n ? 'fill-[#e0a13c] text-[#e0a13c]' : 'text-line')} />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------ quiz */

function QuizGame({ lessonN }: { lessonN: number }) {
  const items = useMemo(() => quizRound(lessonN, 10), [lessonN])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(0)

  const item = items[i]
  const restart = () => {
    setI(0)
    setPicked(null)
    setScore(0)
    setDone(false)
    setRound((r) => r + 1)
  }

  if (!items.length) return <p className="text-[12.5px] text-muted">No quiz for this lesson yet.</p>
  if (done)
    return (
      <div className="rounded-2xl bg-[#f4f8ff] px-5 py-8 text-center">
        <Stars score={score} total={items.length} />
        <p className="mt-2 text-[20px] font-semibold">
          {score} / {items.length}
        </p>
        <p className="mt-1 text-[12.5px] text-muted">{score === items.length ? 'All right. Move on to say it.' : 'Wrong ones are the ones to say out loud.'}</p>
        <Button className="mt-4" size="sm" onClick={restart}>
          <RotateCcw className="h-3.5 w-3.5" /> Play again
        </Button>
      </div>
    )

  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    const right = opt === item.answer
    if (right) setScore((s) => s + 1)
    recordAttempt({ kind: 'quiz', lesson: lessonN, section: item.section, prompt: item.prompt, correct: right })
    setTimeout(() => {
      if (i + 1 >= items.length) setDone(true)
      else {
        setI(i + 1)
        setPicked(null)
      }
    }, right ? 420 : 1100)
  }

  return (
    <div key={round}>
      <div className="flex items-center justify-between text-[11.5px] text-muted">
        <span>
          Question {i + 1} / {items.length}
        </span>
        <span>{score} right</span>
      </div>
      <Progress className="mt-1.5" value={((i + (picked ? 1 : 0)) / items.length) * 100} />
      <p className="mt-5 text-[19px] font-medium tracking-tight sm:text-[22px]">{item.prompt}</p>
      {item.vi && <p className="mt-1 text-[12px] text-muted">{item.vi}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(item.options ?? []).map((opt) => {
          const state = !picked ? 'idle' : opt === item.answer ? 'right' : opt === picked ? 'wrong' : 'idle'
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={cn(
                'flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-[14px] font-medium transition-all',
                state === 'idle' && 'border-line bg-surface hover:-translate-y-px hover:border-primary/40 hover:bg-[#f7faff]',
                state === 'right' && 'border-[#8fd0ae] bg-[#e8f8ee] text-[#0f6b4f]',
                state === 'wrong' && 'border-[#eeb4ad] bg-[#fdeceb] text-[#a33a2c]',
              )}
            >
              {opt}
              {state === 'right' && <Check className="h-4 w-4" />}
              {state === 'wrong' && <X className="h-4 w-4" />}
            </button>
          )
        })}
      </div>
      {picked && picked !== item.answer && (
        <p className="mt-3 rounded-xl bg-[#fff8ec] px-3 py-2 text-[12px] text-[#7a5a1e]">
          Right answer: <b>{item.answer}</b>
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ word match */

function WordMatch({ lessonN }: { lessonN: number }) {
  const lesson = A1.find((l) => l.n === lessonN)!
  const pairs = useMemo(() => pairsFor(lesson, 6), [lesson])
  const cards = useMemo(
    () =>
      pairs
        .flatMap((p) => [
          { key: `${p.id}-w`, pair: p.id, face: 'word' as const, text: p.word },
          { key: `${p.id}-v`, pair: p.id, face: 'vi' as const, text: p.vi },
        ])
        .sort(() => Math.random() - 0.5),
    [pairs],
  )
  const [open, setOpen] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)

  const flip = (key: string, pair: string) => {
    if (matched.includes(pair) || open.includes(key) || open.length === 2) return
    const next = [...open, key]
    setOpen(next)
    if (next.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = next
      const samePair = cards.find((c) => c.key === a)?.pair === cards.find((c) => c.key === b)?.pair
      if (samePair) {
        setMatched((m) => [...m, pair])
        setOpen([])
      } else {
        setTimeout(() => setOpen([]), 750)
      }
    }
  }

  const won = matched.length === pairs.length

  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px] text-muted">
        <span>Match the word with its meaning</span>
        <span>{moves} tries</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const shown = open.includes(c.key) || matched.includes(c.pair)
          return (
            <button
              key={c.key}
              onClick={() => flip(c.key, c.pair)}
              className={cn(
                'grid h-[76px] place-items-center rounded-xl border px-2 text-center text-[12.5px] font-medium transition-all',
                matched.includes(c.pair)
                  ? 'border-[#8fd0ae] bg-[#e8f8ee] text-[#0f6b4f]'
                  : shown
                    ? 'border-primary/40 bg-[#f7faff] text-[#16233f]'
                    : 'border-line bg-[#f2f4f8] text-transparent hover:bg-[#eaeff7]',
              )}
            >
              {shown ? c.text : '·'}
            </button>
          )
        })}
      </div>
      {won && (
        <p className="mt-4 rounded-xl bg-[#e8f8ee] px-3 py-2.5 text-center text-[12.5px] text-[#0f6b4f]">
          All {pairs.length} matched in {moves} tries.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- build bar */

function BuildGame({ lessonN }: { lessonN: number }) {
  const lesson = A1.find((l) => l.n === lessonN)!
  const items = useMemo(() => buildersFor(lesson, 5), [lesson])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState<null | boolean>(null)
  if (!items.length) return <p className="text-[12.5px] text-muted">Not enough sentences for this lesson.</p>
  const item = items[i]
  const made = picked.map((p) => item.tiles[p]).join(' ')
  const check = () => {
    const ok = made === item.answer
    setChecked(ok)
    if (ok) setTimeout(() => next(), 800)
  }
  const next = () => {
    setChecked(null)
    setPicked([])
    setI((v) => (v + 1 < items.length ? v + 1 : 0))
  }
  return (
    <div>
      <p className="text-[11.5px] text-muted">
        Sentence {i + 1} / {items.length} · {item.vi}
      </p>
      <div
        className={cn(
          'mt-3 flex min-h-[64px] flex-wrap items-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5',
          checked === true ? 'border-[#8fd0ae] bg-[#e8f8ee]' : checked === false ? 'border-[#eeb4ad] bg-[#fdeceb]' : 'border-line bg-bg/50',
        )}
      >
        {picked.length === 0 && <span className="text-[12.5px] text-muted">Tap the words below in order.</span>}
        {picked.map((p, idx) => (
          <button
            key={`${p}-${idx}`}
            onClick={() => setPicked((v) => v.filter((_, k) => k !== idx))}
            className="rounded-lg bg-white px-2 py-1 text-[13px] font-medium shadow-sm"
          >
            {item.tiles[p]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tiles.map((t, idx) =>
          picked.includes(idx) ? null : (
            <button
              key={idx}
              onClick={() => setPicked((v) => [...v, idx])}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-[#f4f8ff]"
            >
              {t}
            </button>
          ),
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={check} disabled={!picked.length}>
          Check
        </Button>
        <Button size="sm" variant="ghost" onClick={next}>
          Skip <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <button onClick={() => speak(item.answer)} className="ml-auto flex items-center gap-1 text-[11.5px] font-semibold text-[#4a6fb5]">
          <Volume2 className="h-3.5 w-3.5" /> Hear it
        </button>
      </div>
      {checked === false && <p className="mt-2 text-[12px] text-[#a33a2c]">Correct: {item.answer}</p>}
      {checked === true && <p className="mt-2 text-[12px] text-[#0f6b4f]">That is the sentence.</p>}
    </div>
  )
}

/* ---------------------------------------------------------------- listen */

function ListenGame({ lessonN }: { lessonN: number }) {
  const lesson = A1.find((l) => l.n === lessonN)!
  const items = useMemo(() => listensFor(lesson, 5), [lesson])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  if (!items.length) return <p className="text-[12.5px] text-muted">No audio words for this lesson.</p>
  const item = items[i]
  return (
    <div>
      <p className="text-[11.5px] text-muted">
        Word {i + 1} / {items.length}
      </p>
      <button
        onClick={() => speak(item.word)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#eef3ff] px-4 py-7 text-[15px] font-semibold text-[#2f6bff] transition-transform hover:-translate-y-px"
      >
        <Volume2 className="h-5 w-5" /> Play the word
      </button>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {item.options.map((opt) => {
          const state = !picked ? 'idle' : opt === item.answer ? 'right' : opt === picked ? 'wrong' : 'idle'
          return (
            <button
              key={opt}
              onClick={() => {
                if (picked) return
                setPicked(opt)
                setTimeout(() => {
                  setPicked(null)
                  setI((v) => (v + 1 < items.length ? v + 1 : 0))
                }, 900)
              }}
              className={cn(
                'rounded-xl border px-3.5 py-3 text-left text-[13.5px] transition-colors',
                state === 'idle' && 'border-line bg-surface hover:bg-[#f7faff]',
                state === 'right' && 'border-[#8fd0ae] bg-[#e8f8ee] text-[#0f6b4f]',
                state === 'wrong' && 'border-[#eeb4ad] bg-[#fdeceb] text-[#a33a2c]',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {picked && <p className="mt-3 text-[12px] text-muted">{item.word} {item.ipa}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ page */

export function Practice({ lessonN, onBack, initialTab = 'quiz' }: { lessonN: number; onBack: () => void; initialTab?: Tab }) {
  const lesson = A1.find((l) => l.n === lessonN) ?? A1[0]
  const [tab, setTab] = useState<Tab>(initialTab)

  // Grading works best on one sentence at a time: split long dialogue turns, keep 3–14 words.
  const speakLines = useMemo(() => {
    const raw = speakingLines(lesson, 12).flatMap((l) => l.text.split(/(?<=[.?!])\s+/))
    const short = raw.map((s) => s.trim()).filter((s) => {
      const w = s.split(/\s+/).filter(Boolean).length
      return w >= 3 && w <= 14
    })
    const pick = (short.length ? short : raw.map((s) => s.trim())).slice(0, 3)
    return pick.map((text) => ({ text }))
  }, [lesson])


  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Lessons
      </button>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[.14em] text-muted">Lesson {lesson.n} · Practice</p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight">{titleOf(lesson) || `Lesson ${lesson.n}`}</h1>
        </div>
        <Badge tone="accent">
          <Mic className="mr-1 h-3 w-3" /> voice task inside
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5 sm:flex sm:gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon
          const on = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-tab={t.key}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[10.5px] font-semibold transition-all active:scale-95 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[12.5px]',
                on ? 'border-transparent bg-primary text-white shadow-card' : 'border-line bg-surface text-muted hover:border-primary/30 hover:text-ink',
              )}
            >
              <Icon className="h-[15px] w-[15px] sm:h-3.5 sm:w-3.5" strokeWidth={on ? 2.5 : 2} />
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {tab === 'speak' ? (
        <div className="mt-3">
          <SpeakRoom lessonN={lesson.n} lines={speakLines} />
        </div>
      ) : (
        <Card className="mt-3">
          <CardBody className="p-4 sm:p-5">
            {tab === 'quiz' && <QuizGame lessonN={lesson.n} />}
            {tab === 'words' && <WordMatch lessonN={lesson.n} />}
            {tab === 'build' && <BuildGame lessonN={lesson.n} />}
            {tab === 'listen' && <ListenGame lessonN={lesson.n} />}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

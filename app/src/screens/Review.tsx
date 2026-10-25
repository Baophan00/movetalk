import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, Volume2, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { A1, quizFor, type QuizItem } from '../lib/curriculum'
import { hasAudio, speak } from '../lib/audio'
import { cn } from '../lib/utils'

type Question = {
  id: string
  kind: 'choice' | 'typed' | 'reveal'
  section: string
  prompt: string
  hint?: string
  answer: string
  options?: string[]
  note?: string
}

const SESSION_SIZE = 20

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function vocabQuestions(n: number): Question[] {
  const lesson = A1.find((l) => l.n === n)
  if (!lesson) return []
  const pool = lesson.parts.vocab.filter((v) => v.vi)
  return pool.map((v, i) => {
    const others = shuffle(pool.filter((o) => o.vi !== v.vi)).slice(0, 3).map((o) => o.vi)
    return {
      id: `v${n}-${i}`,
      kind: 'choice' as const,
      section: 'Vocabulary',
      prompt: v.word,
      hint: v.ipa,
      answer: v.vi,
      options: shuffle([v.vi, ...others]),
      note: v.example,
    }
  })
}

function reviewQuestions(n: number): Question[] {
  return quizFor(n).map((item: QuizItem, i: number) => ({
    id: `q${n}-${i}`,
    kind: item.kind === 'choice' ? ('choice' as const) : item.kind === 'reveal' ? ('reveal' as const) : ('typed' as const),
    section: item.section.replace(/^\d+\s*[·.]?\s*/, '').slice(0, 46),
    prompt: item.prompt,
    answer: item.answer,
    options: item.options,
    note: item.kind === 'translate' ? 'Say it out loud first, then write it.' : undefined,
  }))
}

function buildSession(n: number): Question[] {
  const mixed = [...reviewQuestions(n), ...vocabQuestions(n)]
  return shuffle(mixed).slice(0, SESSION_SIZE)
}

export function Review({ initialLesson }: { initialLesson?: number }) {
  const [lessonN, setLessonN] = useState(initialLesson ?? A1[0]?.n ?? 1)
  const [session, setSession] = useState<Question[] | null>(null)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [selfMark, setSelfMark] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<Question[]>([])
  const [done, setDone] = useState(false)

  const pool = useMemo(() => reviewQuestions(lessonN).length + vocabQuestions(lessonN).length, [lessonN])
  const current = session?.[index]

  const start = () => {
    setSession(buildSession(lessonN))
    setIndex(0)
    setPicked(null)
    setTyped('')
    setScore(0)
    setWrong([])
    setDone(false)
  }

  const norm = (v: string) => v.trim().toLowerCase().replace(/[.?!,]/g, '')
  const correct = current
    ? current.kind === 'choice'
      ? picked === current.answer
      : current.kind === 'reveal'
        ? selfMark === true
        : norm(typed) === norm(current.answer)
    : false

  const answered = current
    ? current.kind === 'choice'
      ? picked !== null
      : current.kind === 'reveal'
        ? selfMark !== null
        : typed.trim().length > 0
    : false

  const next = () => {
    if (!current) return
    const ok = correct
    if (ok) setScore((s) => s + 1)
    else setWrong((w) => [...w, current])
    if (index + 1 >= (session?.length ?? 0)) {
      setDone(true)
      return
    }
    setIndex(index + 1)
    setPicked(null)
    setTyped('')
    setRevealed(false)
    setSelfMark(null)
  }

  const retryWrong = () => {
    if (!wrong.length) return
    setSession(wrong)
    setIndex(0)
    setPicked(null)
    setTyped('')
    setScore(0)
    setDone(false)
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Review</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight">Twenty questions, ten minutes</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          Words and exercises from the lesson you pick. Wrong answers come back at the end of the session.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {A1.map((l) => {
            const on = l.n === lessonN
            const count = quizFor(l.n).length
            return (
              <button
                key={l.n}
                onClick={() => setLessonN(l.n)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
                  on ? 'border-primary/40 bg-primary-soft' : 'border-line bg-surface hover:bg-bg/60',
                )}
              >
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold', on ? 'bg-primary text-white' : 'bg-bg text-primary')}>
                  {String(l.n).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">
                    {l.parts.vocab.length} words · {count ? `${count} exercises` : 'vocabulary only'}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">{l.deck?.replace(/_VIP.*/, '') ?? 'A1'}</span>
                </span>
              </button>
            )
          })}
        </div>

        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <p className="text-[12.5px] text-muted">{Math.min(SESSION_SIZE, pool)} questions from lesson {String(lessonN).padStart(2, '0')}</p>
          <Button onClick={start} disabled={pool === 0}>
            Start session <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    )
  }

  if (done) {
    const total = session.length
    const pct = Math.round((score / Math.max(1, total)) * 100)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="px-6 py-8 text-center">
            <span className={cn('mx-auto grid h-16 w-16 place-items-center rounded-full text-[20px] font-bold', pct >= 80 ? 'bg-[#c8f0e0] text-[#0f6b4f]' : 'bg-[#fde3c6] text-[#7a4300]')}>
              {pct}%
            </span>
            <h3 className="mt-4 text-[20px] font-semibold">
              {score} of {total} correct
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              {pct >= 80 ? 'Solid. Move on to the next lesson.' : 'Run the missed ones again before you move on.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {wrong.length > 0 && (
                <Button onClick={retryWrong}>
                  <RotateCcw className="h-4 w-4" /> Retry {wrong.length} missed
                </Button>
              )}
              <Button variant="outline" onClick={start}>
                New session
              </Button>
              <Button variant="ghost" onClick={() => setSession(null)}>
                Change lesson
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setSession(null)} aria-label="Leave session">
          <X className="h-4 w-4" />
        </Button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[.07]">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${((index + (answered ? 1 : 0)) / session.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <span className="w-[64px] text-right text-[11.5px] tabular-nums text-muted">
          {index + 1} / {session.length}
        </span>
      </div>

      <Card className="mt-4 px-5 py-6 sm:px-7">
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">{current.section}</p>

        <div className="mt-3 flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[20px] font-semibold leading-snug tracking-tight">{current.prompt}</h3>
          {current.kind === 'choice' && hasAudio(current.prompt) && (
            <Button variant="ghost" size="icon" onClick={() => speak(current.prompt)} aria-label="Play">
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {current.hint && <p className="mt-1 text-[12px] text-muted">{current.hint}</p>}

        {current.kind === 'choice' ? (
          <div className="mt-5 space-y-2">
            {(current.options ?? []).map((opt) => {
              const isPicked = picked === opt
              const isAnswer = opt === current.answer
              const state = !answered ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'dim'
              return (
                <button
                  key={opt}
                  onClick={() => !answered && setPicked(opt)}
                  disabled={answered}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[14px] transition-colors',
                    state === 'idle' && 'border-line bg-surface hover:border-primary/40 hover:bg-primary-soft/50',
                    state === 'right' && 'border-[#8fdcbd] bg-[#d9f6ea] text-[#0f5f46]',
                    state === 'wrong' && 'border-[#f3b3ad] bg-[#fde4e1] text-[#8a2b22]',
                    state === 'dim' && 'border-line bg-surface text-muted',
                  )}
                >
                  <span className="min-w-0 flex-1">{opt}</span>
                  {state === 'right' && <Check className="h-4 w-4 shrink-0" />}
                  {state === 'wrong' && <X className="h-4 w-4 shrink-0" />}
                </button>
              )
            })}
          </div>
        ) : current.kind === 'reveal' ? (
          <div className="mt-5">
            {!revealed ? (
              <Button variant="outline" onClick={() => setRevealed(true)}>
                Show the model answer
              </Button>
            ) : (
              <div className="rounded-2xl bg-bg px-4 py-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">Model answer</p>
                <p className="mt-1 text-[15px] font-semibold leading-snug">{current.answer}</p>
                <p className="mt-1 text-[11.5px] text-muted">Say it out loud once before you mark yourself.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setSelfMark(true)} disabled={selfMark !== null}>
                    <Check className="h-3.5 w-3.5" /> I had it
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelfMark(false)} disabled={selfMark !== null}>
                    Not yet
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (answered) next()
            }}
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={answered}
              placeholder="Type your English answer"
              className="focus-ring w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] outline-none disabled:opacity-70"
              autoFocus
            />
          </form>
        )}

        {answered && current.kind !== 'reveal' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl bg-bg/80 px-4 py-3">
            <p className="text-[12.5px] font-semibold">
              {correct ? 'Correct' : 'Answer'}: <span className="font-normal">{current.answer}</span>
            </p>
            {current.note && <p className="mt-1 text-[12px] leading-relaxed text-muted">{current.note}</p>}
          </motion.div>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSession(null)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Leave
          </Button>
          <Button size="sm" onClick={next} disabled={!answered}>
            {index + 1 === session.length ? 'Finish' : 'Next'} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

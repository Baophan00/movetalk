import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Headphones, Lightbulb, RotateCcw, Sparkles, Volume2, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardBody } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { speak, playLine } from '../lib/audio'
import { A1, titleOf } from '../lib/curriculum'
import { attemptKind, sessionFor, type Exercise, type Skill } from '../lib/exercises'
import { addCard, recordAttempt } from '../lib/study'
import { cn } from '../lib/utils'

const SKILL_LABEL: Record<Skill, string> = {
  vocab: 'Words',
  grammar: 'Grammar',
  listening: 'Listening',
  reading: 'Reading',
  speaking: 'Speaking',
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function shuffled(words: string[], seed: number): string[] {
  const out = [...words]
  let s = seed
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type Result = { item: Exercise; correct: boolean }

export function Practise({ lessonN, onExit }: { lessonN: number; onExit: () => void }) {
  const title = titleOf(A1.find((l) => l.n === lessonN) ?? A1[0]) || `Lesson ${lessonN}`
  const [round, setRound] = useState(0)
  const [only, setOnly] = useState<Exercise[] | null>(null)
  const items = useMemo(() => only ?? sessionFor(lessonN, 10), [lessonN, only, round])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [built, setBuilt] = useState<string[]>([])
  const [typing, setTyping] = useState('')
  const [state, setState] = useState<'idle' | 'right' | 'wrong' | 'shown'>('idle')
  const [hint, setHint] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [done, setDone] = useState(false)

  const item = items[idx]

  useEffect(() => {
    setPicked(null)
    setBuilt([])
    setTyping('')
    setState('idle')
    setHint(false)
  }, [idx, round])

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-[13px] text-muted">This lesson has no practice yet.</p>
        <Button variant="soft" size="sm" className="mt-3" onClick={onExit}>
          Back
        </Button>
      </div>
    )
  }

  const total = items.length
  const correctCount = results.filter((r) => r.correct).length

  function answerOf(current: Exercise): string {
    if (current.kind === 'order' || current.kind === 'sequence') return built.join(' ')
    if (current.kind === 'translate') return typing
    return picked ?? ''
  }

  function save(current: Exercise, correct: boolean) {
    recordAttempt({
      kind: attemptKind(current.skill),
      lesson: current.lesson,
      section: `${SKILL_LABEL[current.skill]} · ${current.kind}`,
      prompt: current.prompt,
      correct,
      answer: current.answer,
    })
    if (current.skill === 'vocab' && current.vi) addCard(current.prompt, current.vi, 'A1', 'practice')
  }

  function check() {
    const given = answerOf(item)
    if (!given.trim()) return
    const expected = item.kind === 'sequence' ? item.answer.split(' | ').join(' ') : item.answer
    const ok = norm(given) === norm(expected)
    setState(ok ? 'right' : 'wrong')
    setResults((rs) => [...rs.filter((r) => r.item.id !== item.id), { item, correct: ok }])
    save(item, ok)
  }

  function reveal() {
    setState('shown')
    if (selfCheck) return
    setResults((rs) => [...rs.filter((r) => r.item.id !== item.id), { item, correct: false }])
    save(item, false)
  }

  function next() {
    if (idx + 1 >= total) setDone(true)
    else setIdx(idx + 1)
  }

  function again(mistakesOnly: boolean) {
    const wrong = results.filter((r) => !r.correct).map((r) => r.item)
    setOnly(mistakesOnly && wrong.length ? wrong : null)
    setResults([])
    setIdx(0)
    setDone(false)
    setRound((r) => r + 1)
  }

  if (done) {
    const wrong = results.filter((r) => !r.correct)
    const pct = Math.round((correctCount / Math.max(1, results.length)) * 100)
    const bySkill = new Map<Skill, { right: number; all: number }>()
    for (const r of results) {
      const s = bySkill.get(r.item.skill) ?? { right: 0, all: 0 }
      s.all += 1
      if (r.correct) s.right += 1
      bySkill.set(r.item.skill, s)
    }
    return (
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:px-6">
        <button onClick={onExit} className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Class practice
        </button>
        <Card className="overflow-hidden">
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-[15px] font-bold text-primary">{pct}%</div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Lesson {lessonN}</p>
                <p className="text-[17px] font-semibold leading-tight">{title}</p>
                <p className="text-[12px] text-muted">
                  {correctCount} of {results.length} right
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {[...bySkill.entries()].map(([skill, s]) => (
                <div key={skill}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink/80">{SKILL_LABEL[skill]}</span>
                    <span className="text-muted">
                      {s.right}/{s.all}
                    </span>
                  </div>
                  <Progress value={(s.right / Math.max(1, s.all)) * 100} />
                </div>
              ))}
            </div>

            {wrong.length > 0 && (
              <div className="mt-5 rounded-2xl border border-line bg-bg/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Needs another look</p>
                <ul className="mt-2 space-y-2">
                  {wrong.slice(0, 5).map((w) => (
                    <li key={w.item.id} className="text-[12.5px]">
                      <span className="text-muted">{w.item.prompt}</span>
                      <span className="ml-1 font-semibold">→ {w.item.answer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => again(true)} disabled={!wrong.length}>
                <RotateCcw className="h-4 w-4" /> Redo the {wrong.length} wrong
              </Button>
              <Button variant="soft" onClick={() => again(false)}>
                New set
              </Button>
              <Button variant="ghost" onClick={onExit}>
                Done
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const selfCheck = !item.options && (item.kind === 'listen' || item.kind === 'speak')
  const isOrder = item.kind === 'order' || item.kind === 'sequence'
  const chunks = isOrder
    ? shuffled(
        item.kind === 'sequence' ? [item.answer.split(' | ')[0], ...item.answer.split(' | ').slice(1)] : item.answer.split(' '),
        lessonN + idx * 7,
      )
    : []

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Class practice
        </button>
        <span className="text-[12px] font-semibold text-muted">
          {idx + 1} / {total}
        </span>
      </div>
      <Progress value={((idx + (state === 'idle' ? 0 : 1)) / total) * 100} />

      <div className="mt-4 flex items-center gap-2">
        <Badge tone="neutral">{SKILL_LABEL[item.skill]}</Badge>
        <span className="text-[11.5px] text-muted">Lesson {lessonN}</span>
      </div>

      {item.passage && (
        <Card className="mt-3 border-line/70 bg-bg/50">
          <CardBody className="p-4">
            <p className="text-[12.5px] leading-relaxed text-ink/85">{item.passage}</p>
          </CardBody>
        </Card>
      )}

      <Card className="mt-3">
        <CardBody className="p-5">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-[16px] font-medium leading-snug">{item.prompt}</p>
            {(item.audio || item.kind === 'listen' || item.kind === 'gap') && (
              <button
                onClick={() => (item.audio ? playLine(item.audio) : speak(item.prompt))}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition hover:bg-primary/15"
                aria-label="Play"
              >
                {item.kind === 'listen' ? <Headphones className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
          </div>
          {item.vi && <p className="mt-1 text-[12px] text-muted">{item.vi}</p>}

          {isOrder && (
            <div className="mt-4">
              <div className="min-h-[52px] rounded-2xl border border-dashed border-line bg-bg/40 p-2">
                <div className="flex flex-wrap gap-1.5">
                  {built.map((w, i) => (
                    <button
                      key={`${w}-${i}`}
                      onClick={() => setBuilt(built.filter((_, j) => j !== i))}
                      className="rounded-lg bg-primary px-2.5 py-1.5 text-[12.5px] font-medium text-white"
                    >
                      {w}
                    </button>
                  ))}
                  {!built.length && (
                    <span className="px-2 py-1.5 text-[12px] text-muted">
                      {item.kind === 'sequence' ? 'Tap the lines in order' : 'Tap the words below'}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {chunks.map((w, i) => {
                  const used = built.filter((b) => b === w).length
                  const pool = chunks.filter((c) => c === w).length
                  if (used >= pool) return null
                  return (
                    <button
                      key={`${w}-${i}`}
                      onClick={() => setBuilt([...built, w])}
                      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] transition hover:border-primary/40"
                    >
                      {w}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {item.options && !isOrder && (
            <div className="mt-4 space-y-2">
              {item.options.map((opt) => {
                const chosen = picked === opt
                const correct = state !== 'idle' && norm(opt) === norm(item.answer)
                return (
                  <button
                    key={opt}
                    onClick={() => state === 'idle' && setPicked(opt)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] transition',
                      correct
                        ? 'border-ok/40 bg-ok/10'
                        : chosen && state === 'wrong'
                          ? 'border-danger/40 bg-danger/10'
                          : chosen
                            ? 'border-primary/50 bg-primary-soft/60'
                            : 'border-line hover:border-primary/30',
                    )}
                  >
                    <span className="flex-1">{opt}</span>
                    {correct && <Check className="h-4 w-4 text-ok" />}
                    {chosen && state === 'wrong' && <X className="h-4 w-4 text-danger" />}
                  </button>
                )
              })}
            </div>
          )}

          {item.kind === 'translate' && (
            <input
              value={typing}
              onChange={(e) => setTyping(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && state === 'idle' && check()}
              placeholder="Type the English sentence"
              className="mt-4 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] outline-none focus:border-primary"
            />
          )}

          {hint && <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-[12px] text-ink/80">{item.hint}</p>}

          {state === 'right' && (
            <div className="mt-4 rounded-xl border border-ok/30 bg-ok/10 px-3.5 py-2.5 text-[12.5px] text-ink/85">
              <span className="font-semibold text-ok">Right.</span> {item.explain}
            </div>
          )}
          {state === 'wrong' && (
            <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[12.5px] text-ink/85">
              <span className="font-semibold text-danger">Not yet.</span>{' '}
              {hint ? `The answer is “${item.answer}”.` : 'Look again, or ask for a hint.'}
            </div>
          )}
          {state === 'shown' && (
            <div className="mt-4 rounded-xl border border-line bg-bg/60 px-3.5 py-2.5 text-[12.5px] text-ink/85">
              Answer: <span className="font-semibold">{item.answer}</span>
              {item.explain ? `. ${item.explain}` : ''}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {state === 'idle' && selfCheck && (
              <>
                <Button variant="soft" onClick={() => (item.audio ? playLine(item.audio) : speak(item.prompt))}>
                  <Headphones className="h-4 w-4" /> Play again
                </Button>
                <Button onClick={reveal}>Show the answer</Button>
              </>
            )}
            {state === 'idle' && !selfCheck && (
              <>
                <Button onClick={check} disabled={!answerOf(item).trim()}>
                  Check
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setHint(true)}>
                  <Lightbulb className="h-4 w-4" /> Hint
                </Button>
              </>
            )}
            {state === 'wrong' && !hint && (
              <>
                <Button variant="soft" onClick={() => setHint(true)}>
                  <Lightbulb className="h-4 w-4" /> Show a hint
                </Button>
                <Button variant="ghost" size="sm" onClick={reveal}>
                  Show the answer
                </Button>
              </>
            )}
            {state === 'wrong' && hint && (
              <Button onClick={next}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {state === 'shown' && selfCheck && (
              <>
                <Button
                  onClick={() => {
                    setState('right')
                    setResults((rs) => [...rs.filter((r) => r.item.id !== item.id), { item, correct: true }])
                    save(item, true)
                  }}
                >
                  <Check className="h-4 w-4" /> I got it right
                </Button>
                <Button variant="ghost" onClick={next}>
                  Not yet
                </Button>
              </>
            )}
            {(state === 'right' || (state === 'shown' && !selfCheck)) && (
              <Button onClick={next}>
                {idx + 1 >= total ? 'See result' : 'Next'} <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {state === 'idle' && item.kind === 'speak' && (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Say it out loud, then type what you said.
        </p>
      )}
    </div>
  )
}

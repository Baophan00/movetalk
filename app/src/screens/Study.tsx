import { useMemo, useState } from 'react'
import { BookOpen, Headphones, Mic, Pencil, ArrowRight, Volume2, Check, X } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { SpeakRoom } from '../components/SpeakRoom'
import { A1, quizFor, titleOf, type LessonFile } from '../lib/curriculum'
import { buildersFor } from '../lib/practice'
import { checkEnglish, type Miss } from '../lib/grammar'
import { compare } from '../lib/speech'
import { addCard, recordAttempt } from '../lib/study'
import { playLine, speak } from '../lib/audio'
import { cn } from '../lib/utils'

type Room = 'home' | 'listen' | 'speak' | 'read' | 'write'

const ROOMS = [
  { key: 'listen' as const, title: 'Listening', vi: 'Luyện nghe', icon: Headphones, from: 'from-[#6f7cff] to-[#a78bfa]', hint: 'Hear it, then pick the line' },
  { key: 'speak' as const, title: 'Speaking', vi: 'Luyện nói', icon: Mic, from: 'from-[#ff8fa3] to-[#ff5d8f]', hint: 'Say it, scored on the spot' },
  { key: 'read' as const, title: 'Reading', vi: 'Luyện đọc', icon: BookOpen, from: 'from-[#48c9b0] to-[#22a699]', hint: 'Tap any word, keep it' },
  { key: 'write' as const, title: 'Writing', vi: 'Luyện viết', icon: Pencil, from: 'from-[#ffb56b] to-[#f4772e]', hint: 'Build and write sentences' },
]

/** Practice your way: same lesson content, four skills, each scored as you go. */
export function Study() {
  const [room, setRoom] = useState<Room>('home')
  const [lessonN, setLessonN] = useState(A1[0]?.n ?? 1)
  const lesson = A1.find((l) => l.n === lessonN) ?? A1[0]

  const back = () => setRoom('home')

  if (room === 'listen') return <Listening lesson={lesson} onBack={back} onLesson={setLessonN} />
  if (room === 'speak') return <Speaking lesson={lesson} onBack={back} onLesson={setLessonN} />
  if (room === 'read') return <Reading lesson={lesson} onBack={back} onLesson={setLessonN} />
  if (room === 'write') return <Writing lesson={lesson} onBack={back} onLesson={setLessonN} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Practice your way</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Four skills, ten minutes each</h1>
      <p className="mt-1 text-[13px] text-muted">Everything here is scored as you go. The teacher only steps in for the lesson work.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ROOMS.map((r) => {
          const Icon = r.icon
          return (
            <button
              key={r.key}
              onClick={() => setRoom(r.key)}
              className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-4 text-left shadow-card transition-all active:scale-[.99] hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className={cn('absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-xl transition-opacity group-hover:opacity-35', r.from)} />
              <span className={cn('relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-card', r.from)}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="relative mt-3 text-[16px] font-semibold">{r.title}</p>
              <p className="relative text-[12px] text-muted">{r.vi} · {r.hint}</p>
              <span className="relative mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                Start <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          )
        })}
      </div>

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="text-[13px] font-semibold">Which lesson</p>
          <p className="mt-0.5 text-[11.5px] text-muted">A1 is ready. A2 arrives when the lessons do.</p>
          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
            {A1.map((l) => (
              <button
                key={l.n}
                onClick={() => setLessonN(l.n)}
                className={cn(
                  'shrink-0 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold transition',
                  l.n === lessonN ? 'border-transparent bg-primary text-white' : 'border-line bg-surface text-muted',
                )}
              >
                {String(l.n).padStart(2, '0')}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ shared */

function RoomShell({ title, vi, onBack, onLesson, lesson, children }: { title: string; vi: string; onBack: () => void; onLesson: (n: number) => void; lesson: LessonFile; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      <button onClick={onBack} className="text-[12px] font-semibold text-muted transition hover:text-ink">← Practice your way</button>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
          <p className="text-[12px] text-muted">{vi} · Lesson {String(lesson.n).padStart(2, '0')} {titleOf(lesson)}</p>
        </div>
        <select
          value={lesson.n}
          onChange={(e) => onLesson(Number(e.target.value))}
          className="rounded-xl border border-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold"
        >
          {A1.map((l) => (
            <option key={l.n} value={l.n}>Lesson {l.n}</option>
          ))}
        </select>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------- listening */

type ListenItem = { line: string; options: string[] }

function englishLines(lesson: LessonFile): string[] {
  return lesson.parts.dialogue
    .map((d) => d.line.trim())
    .filter((t) => /^[\x20-\x7E’'",.?!]+$/.test(t))
}

function usable(line: string): boolean {
  const t = line.replace(/\s+/g, ' ').trim()
  const w = t.split(' ').length
  return w >= 4 && w <= 20 && /[.?!]$/.test(t) && /[a-z]{3}/i.test(t)
}

function buildListenItems(lesson: LessonFile, count = 5): ListenItem[] {
  const mine = englishLines(lesson).map((t) => t.replace(/\s+/g, ' ').trim()).filter(usable).slice(0, count)
  const others = A1.filter((l) => l.n !== lesson.n).flatMap((l) => englishLines(l).map((t) => t.replace(/\s+/g, ' ').trim())).filter(usable)
  return mine.map((line) => {
    const near = others.filter((t) => t !== line && Math.abs(t.length - line.length) <= Math.max(16, line.length * 0.5))
    const pool = shuffleList(near.length >= 3 ? near : others.filter((t) => t !== line))
    return { line, options: shuffleList([line, ...pool.slice(0, 3)]) }
  })
}

function shuffleList<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Listening({ lesson, onBack, onLesson }: { lesson: LessonFile; onBack: () => void; onLesson: (n: number) => void }) {
  const items = useMemo(() => buildListenItems(lesson, 5), [lesson])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [slow, setSlow] = useState(1)
  const item = items[i]

  if (!item) {
    return (
      <RoomShell title="Listening" vi="Luyện nghe" onBack={onBack} onLesson={onLesson} lesson={lesson}>
        <p className="text-[13px] text-muted">This lesson has no dialogue to listen to yet.</p>
      </RoomShell>
    )
  }

  const last = i + 1 >= items.length
  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    const right = opt === item.line
    if (right) setScore((s) => s + 1)
    recordAttempt({ kind: 'listen', lesson: lesson.n, section: 'Listening', prompt: item.line, correct: right })
  }

  return (
    <RoomShell title="Listening" vi="Luyện nghe" onBack={onBack} onLesson={onLesson} lesson={lesson}>
      <Card>
        <CardBody className="p-5">
          <div className="flex items-center justify-between">
            <Badge tone="primary">{i + 1} / {items.length}</Badge>
            <span className="text-[12px] font-semibold text-muted">{score} right</span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { void playLine(item.line, 1) }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#6f7cff] to-[#a78bfa] px-4 py-5 text-[14px] font-semibold text-white shadow-card transition active:scale-[.99]"
            >
              <Volume2 className="h-5 w-5" /> Play
            </button>
            <button
              onClick={() => { setSlow(0.7); void playLine(item.line, 0.7) }}
              className={cn(
                'rounded-2xl border px-3 text-[12px] font-semibold transition',
                slow < 1 ? 'border-transparent bg-primary-soft text-primary' : 'border-line text-muted',
              )}
            >
              Slow
            </button>
          </div>

          <p className="mt-4 text-[12px] font-semibold text-muted">Which line did you hear?</p>
          <div className="mt-2 grid gap-2">
            {item.options.map((opt) => {
              const on = picked === opt
              const right = opt === item.line
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  disabled={Boolean(picked)}
                  className={cn(
                    'flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] leading-snug transition',
                    !picked && 'border-line bg-surface hover:border-primary/40',
                    picked && right && 'border-transparent bg-mint/15 text-[#0f6b4f]',
                    picked && on && !right && 'border-transparent bg-warn/10 text-warn',
                    picked && !on && !right && 'border-line bg-surface opacity-55',
                  )}
                >
                  <span>{opt}</span>
                  {picked && right && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                  {picked && on && !right && <X className="mt-0.5 h-4 w-4 shrink-0" />}
                </button>
              )
            })}
          </div>

          {picked && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-[12px] text-muted">{picked === item.line ? 'Right.' : 'Listen once more, then continue.'}</p>
              <div className="flex gap-1.5">
                <button onClick={() => void playLine(item.line, 1)} className="rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold">
                  Again
                </button>
                <button
                  onClick={() => {
                    if (last) { setI(0); setPicked(null); setScore(0) } else { setI(i + 1); setPicked(null) }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white"
                >
                  {last ? 'Restart' : 'Next'} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </RoomShell>
  )
}

/* ---------------------------------------------------------------- speaking */

function Speaking({ lesson, onBack, onLesson }: { lesson: LessonFile; onBack: () => void; onLesson: (n: number) => void }) {
  const lines = useMemo(() => {
    const raw = lesson.parts.dialogue.map((d) => d.line).filter((t) => /^[\x20-\x7E’'",.?!]+$/.test(t))
    const short = raw.filter((s) => {
      const w = s.split(/\s+/).filter(Boolean).length
      return w >= 3 && w <= 14
    })
    return (short.length ? short : raw).slice(0, 4).map((text) => ({ text }))
  }, [lesson])

  return (
    <RoomShell title="Speaking" vi="Luyện nói" onBack={onBack} onLesson={onLesson} lesson={lesson}>
      <SpeakRoom lessonN={lesson.n} lines={lines} />
    </RoomShell>
  )
}

/* ----------------------------------------------------------------- reading */

function dict(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const l of A1) for (const v of l.parts.vocab) if (v.word && v.vi) out[v.word.toLowerCase()] = v.vi
  return out
}

function Reading({ lesson, onBack, onLesson }: { lesson: LessonFile; onBack: () => void; onLesson: (n: number) => void }) {
  const text = useMemo(() => lesson.parts.dialogue.map((d) => d.line).filter((t) => /^[\x20-\x7E’'",.?!]+$/.test(t)), [lesson])
  const meanings = useMemo(dict, [])
  const [word, setWord] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])

  const meaning = word ? meanings[word.toLowerCase()] : undefined

  return (
    <RoomShell title="Reading" vi="Luyện đọc" onBack={onBack} onLesson={onLesson} lesson={lesson}>
      <Card>
        <CardBody className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Tap a word you do not know</p>
          <div className="mt-3 space-y-2.5">
            {text.map((line, k) => (
              <p key={k} className="text-[15px] leading-relaxed">
                {line.split(/(\s+)/).map((tok, j) => {
                  const clean = tok.replace(/[^A-Za-z’']/g, '').toLowerCase()
                  const known = clean && meanings[clean]
                  if (!clean) return <span key={j}>{tok}</span>
                  return (
                    <button
                      key={j}
                      onClick={() => setWord(clean)}
                      className={cn('rounded transition-colors', known ? 'hover:bg-primary-soft' : 'decoration-dotted underline-offset-4 hover:underline')}
                    >
                      {tok}
                    </button>
                  )
                })}
              </p>
            ))}
          </div>

          {word && (
            <div className="mt-4 rounded-2xl bg-bg/70 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold">{word}</p>
                  <p className="text-[12.5px] text-muted">{meaning ?? 'Not in the course word list yet. Save it and ask your teacher.'}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => speak(word)} className="rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold">Hear</button>
                  <button
                    onClick={() => { addCard(word, meaning, 'A1', 'reading'); setSaved((s) => [...s, word]) }}
                    className="rounded-lg bg-primary px-2 py-1 text-[11.5px] font-semibold text-white"
                  >
                    {saved.includes(word) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </RoomShell>
  )
}

/* ----------------------------------------------------------------- writing */

function norm(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function Writing({ lesson, onBack, onLesson }: { lesson: LessonFile; onBack: () => void; onLesson: (n: number) => void }) {
  const [mode, setMode] = useState<'build' | 'write'>('build')
  const tasks = useMemo(() => buildersFor(lesson, 5), [lesson])
  const prompts = useMemo(() => quizFor(lesson.n).filter((q) => q.kind === 'translate'), [lesson.n])

  const [i, setI] = useState(0)
  const [tray, setTray] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'ok' | 'no'>('idle')

  const [written, setWritten] = useState('')
  const [checked, setChecked] = useState<{ exact: boolean; misses: Miss[]; failed: boolean; missing: string[]; cover: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const task = tasks[i]
  const prompt = prompts[i]

  const used = [...tray]
  const pool = task
    ? task.tiles.filter((t) => {
        const k = used.indexOf(t)
        if (k >= 0) { used.splice(k, 1); return false }
        return true
      })
    : []

  const checkBuild = () => {
    if (!task) return
    const ok = tray.join(' ').toLowerCase() === task.answer.toLowerCase()
    setStatus(ok ? 'ok' : 'no')
    recordAttempt({ kind: 'write', lesson: lesson.n, section: 'Writing', prompt: task.answer, correct: ok })
  }

  const checkWrite = async () => {
    if (!prompt) return
    setBusy(true)
    const exact = norm(written) === norm(prompt.answer)
    const { matches, failed } = await checkEnglish(written)
    const diff = compare(prompt.answer, written)
    setChecked({ exact, misses: matches, failed, missing: diff.missing, cover: diff.pct })
    recordAttempt({ kind: 'write', lesson: lesson.n, section: 'Writing', prompt: prompt.answer, correct: exact || (!failed && matches.length === 0) })
    setBusy(false)
  }

  return (
    <RoomShell title="Writing" vi="Luyện viết" onBack={onBack} onLesson={onLesson} lesson={lesson}>
      <div className="grid grid-cols-2 gap-1.5">
        {(['build', 'write'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setI(0); setTray([]); setStatus('idle'); setWritten(''); setChecked(null) }}
            className={cn(
              'rounded-xl border py-2 text-[12.5px] font-semibold transition',
              mode === m ? 'border-transparent bg-primary text-white shadow-card' : 'border-line bg-surface text-muted',
            )}
          >
            {m === 'build' ? 'Build a sentence' : 'Write it yourself'}
          </button>
        ))}
      </div>

      {mode === 'build' ? (
        <Card className="mt-3">
          <CardBody className="p-5">
            {!task ? (
              <p className="text-[13px] text-muted">No writing tasks for this lesson.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{i + 1} / {tasks.length}</Badge>
                  <span className="text-[11.5px] text-muted">dùng từ: {task.vi}</span>
                </div>

                <div className="mt-4 min-h-[52px] rounded-2xl border border-dashed border-line bg-bg/60 px-3 py-2.5">
                  {tray.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tray.map((t, k) => (
                        <button key={`${t}-${k}`} onClick={() => { setTray(tray.filter((_, x) => x !== k)); setStatus('idle') }} className="rounded-lg bg-surface px-2 py-1 text-[13px] font-medium shadow-card">
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-muted">Tap the words in order.</p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pool.map((t, k) => (
                    <button key={`${t}-${k}`} onClick={() => { setTray([...tray, t]); setStatus('idle') }} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium transition active:scale-95">
                      {t}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className={cn('text-[12.5px] font-semibold', status === 'ok' ? 'text-[#0f6b4f]' : status === 'no' ? 'text-warn' : 'text-muted')}>
                    {status === 'ok' ? 'Correct.' : status === 'no' ? 'Not yet.' : `${tray.length} word${tray.length === 1 ? '' : 's'}`}
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={checkBuild} disabled={!tray.length} className="rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40">Check</button>
                    <button
                      onClick={() => { setI((v) => (v + 1 < tasks.length ? v + 1 : 0)); setTray([]); setStatus('idle') }}
                      className="rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="mt-3">
          <CardBody className="p-5">
            {!prompt ? (
              <p className="text-[13px] text-muted">No translation prompts for this lesson.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{i + 1} / {prompts.length}</Badge>
                  <span className="text-[11.5px] text-muted">viết bằng tiếng Anh</span>
                </div>

                <p className="mt-3 rounded-2xl bg-bg/70 px-3 py-2.5 text-[14px] font-medium">{prompt.prompt}</p>

                <textarea
                  value={written}
                  onChange={(e) => { setWritten(e.target.value); setChecked(null) }}
                  rows={3}
                  placeholder="Type your sentence…"
                  className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface px-3 py-2.5 text-[14px] outline-none focus:border-primary/50"
                />

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11.5px] text-muted">{written.trim().split(/\s+/).filter(Boolean).length} words</p>
                  <div className="flex gap-1.5">
                    <button onClick={checkWrite} disabled={busy || !written.trim()} className="rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40">
                      {busy ? 'Checking…' : 'Check'}
                    </button>
                    <button
                      onClick={() => { setI((v) => (v + 1 < prompts.length ? v + 1 : 0)); setWritten(''); setChecked(null) }}
                      className="rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {checked && (
                  <div className="mt-4 rounded-2xl bg-bg/70 p-3.5">
                    <p className={cn('text-[12.5px] font-semibold', checked.exact ? 'text-[#0f6b4f]' : 'text-warn')}>
                      {checked.exact
                        ? 'Same as the model sentence.'
                        : checked.failed
                          ? 'Spelling/grammar service is offline. Compare with the model below.'
                          : checked.misses.length
                            ? `${checked.misses.length} thing${checked.misses.length === 1 ? '' : 's'} to fix.`
                            : `No spelling or grammar errors, but ${checked.cover}% of the model.`}
                    </p>
                    {!checked.exact && checked.missing.length > 0 && !checked.misses.length && (
                      <p className="mt-1.5 text-[12px] text-ink">The model adds: <span className="font-semibold">{checked.missing.join(', ')}</span></p>
                    )}
                    {checked.misses.slice(0, 4).map((m, k) => (
                      <p key={k} className="mt-1.5 text-[12px] text-ink">
                        <span className="text-muted">{written.slice(m.offset, m.offset + m.length) || '…'}</span> → {m.message}
                        {m.better.length > 0 && <span className="font-semibold"> Try: {m.better.join(' / ')}</span>}
                      </p>
                    ))}
                    <p className="mt-2 text-[11.5px] text-muted">Model answer: <span className="font-medium text-ink">{prompt.answer}</span></p>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}
    </RoomShell>
  )
}

import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Check, Headphones, Mic, Pencil, Volume2, X } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { SpeakRoom } from '../components/SpeakRoom'
import { A1, quizFor, titleOf, type LessonFile } from '../lib/curriculum'
import { checkEnglish, type Miss } from '../lib/grammar'
import { compare } from '../lib/speech'
import { saveWriting } from '../lib/writings'
import { addCard, recordAttempt } from '../lib/study'
import { playLine, speak } from '../lib/audio'
import { LEVELS, PACKS, packsFor, type Level, type Pack, type Question } from '../content/practice/packs'
import { cn } from '../lib/utils'

type Room = 'home' | 'listen' | 'speak' | 'read' | 'write'

type Source = {
  level: Level
  label: string
  lines: string[]
  pool: string[]
  reading: { title: string; text: string[]; glossary: Record<string, string>; questions: Question[] }
  build: { en: string; vi: string }[]
  translate: { vi: string; en: string }[]
  paragraph?: { prompt: string; vi: string; model: string; must: string[] }
}

const ROOMS = [
  { key: 'listen' as const, title: 'Listening', vi: 'Luyện nghe', icon: Headphones, from: 'from-[#5D7B6F] to-[#8FAE92]', hint: 'Hear it, then pick the line' },
  { key: 'speak' as const, title: 'Speaking', vi: 'Luyện nói', icon: Mic, from: 'from-[#C08A4A] to-[#9C6B2E]', hint: 'Say it, scored on the spot' },
  { key: 'read' as const, title: 'Reading', vi: 'Luyện đọc', icon: BookOpen, from: 'from-[#4E7C78] to-[#3B6360]', hint: 'Tap any word, then answer' },
  { key: 'write' as const, title: 'Writing', vi: 'Luyện viết', icon: Pencil, from: 'from-[#8A5A22] to-[#6F4A18]', hint: 'Build and write sentences' },
]

/* ------------------------------------------------------------- content glue */

const clean = (t: string) => t.replace(/\s+/g, ' ').trim()
const englishOnly = (t: string) => /^[\x20-\x7E’'",.?!;:-]+$/.test(t)

function usableLine(t: string): boolean {
  const text = clean(t)
  const words = text.split(' ').length
  return words >= 4 && words <= 20 && /[.?!]$/.test(text) && /[a-z]{3}/i.test(t)
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function lessonNumber(label: string): number {
  return Number(label.match(/Lesson (\d+)/)?.[1] ?? 0)
}

function courseGlossary(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const l of A1) for (const v of l.parts.vocab) if (v.word && v.vi) out[v.word.toLowerCase()] = v.vi
  return out
}

function a1Source(lesson: LessonFile): Source {
  const dialogue = lesson.parts.dialogue.map((d) => clean(d.line)).filter(englishOnly)
  const vocabGlossary: Record<string, string> = {}
  for (const v of lesson.parts.vocab) if (v.word && v.vi) vocabGlossary[v.word.toLowerCase()] = v.vi

  // A1 comprehension: the recap questions the lesson ships, with options borrowed from
  // other lessons so each one has exactly one right answer without a teacher.
  const others = A1.filter((l) => l.n !== lesson.n).flatMap((l) => l.parts.listenCheck.map((c) => c.a)).filter(Boolean)
  const questions: Question[] = lesson.parts.listenCheck.slice(0, 3).map((c, i) => ({
    q: c.q,
    options: shuffle([c.a, ...others.slice(i * 3, i * 3 + 3)]),
    answer: c.a,
  }))

  return {
    level: 'A1',
    label: `Lesson ${lesson.n} · ${titleOf(lesson)}`,
    lines: dialogue,
    pool: A1.flatMap((l) => l.parts.dialogue.map((d) => clean(d.line))).filter(usableLine),
    reading: { title: titleOf(lesson), text: dialogue, glossary: vocabGlossary, questions },
    build: lesson.parts.vocab
      .filter((v) => v.example && v.example.split(/\s+/).length >= 4 && v.example.split(/\s+/).length <= 9)
      .slice(0, 4)
      .map((v) => ({ en: v.example.replace(/[.?!]+$/, ''), vi: v.vi })),
    translate: quizFor(lesson.n)
      .filter((q) => q.kind === 'translate')
      .map((q) => ({ vi: q.prompt, en: q.answer })),
  }
}

function packSource(pack: Pack): Source {
  return {
    level: pack.level,
    label: `${pack.level} · ${pack.title}`,
    lines: pack.lines,
    pool: packsFor(pack.level).flatMap((p) => p.lines),
    reading: {
      title: pack.reading.title,
      text: [pack.reading.text],
      glossary: { ...courseGlossary(), ...pack.reading.glossary },
      questions: pack.reading.questions,
    },
    build: pack.build,
    translate: pack.translate,
    paragraph: pack.paragraph,
  }
}

/* --------------------------------------------------------------------- hub */

export function Study({ seedLevel, seedRoom, seedPrompt }: { seedLevel?: Level; seedRoom?: Room; seedPrompt?: string } = {}) {
  const [level, setLevel] = useState<Level>(seedLevel ?? 'A1')
  const [lessonN, setLessonN] = useState(A1[0]?.n ?? 1)
  const [packId, setPackId] = useState(() => {
    const level = seedLevel ?? 'A2'
    const hit = seedPrompt
      ? packsFor(level).find((p) => p.reading.questions.some((q) => q.q === seedPrompt) || p.lines.includes(seedPrompt))
      : undefined
    return hit?.id ?? PACKS.find((p) => p.level === 'A2')?.id ?? ''
  })
  const [room, setRoom] = useState<Room>(seedRoom && seedRoom !== 'home' ? seedRoom : 'home')

  const source = useMemo<Source>(() => {
    if (level === 'A1') return a1Source(A1.find((l) => l.n === lessonN) ?? A1[0])
    const pack = PACKS.find((p) => p.id === packId && p.level === level) ?? packsFor(level)[0]
    return packSource(pack)
  }, [level, lessonN, packId])

  const pickLevel = (l: Level) => {
    setLevel(l)
    if (l !== 'A1') setPackId(packsFor(l)[0]?.id ?? '')
  }

  if (room !== 'home') {
    const back = () => setRoom('home')
    if (room === 'listen') return <Listening source={source} onBack={back} />
    if (room === 'speak') return <Speaking source={source} onBack={back} />
    if (room === 'read') return <Reading source={source} onBack={back} />
    return <Writing source={source} onBack={back} />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Practice your way</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Four skills, scored as you go</h1>
      <p className="mt-1 text-[13px] text-muted">A1 follows your lessons. A2, B1 and B2 are extra practice you can open any time.</p>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => pickLevel(l)}
            className={cn(
              'rounded-xl border py-2 text-[12.5px] font-bold tracking-wide transition',
              level === l ? 'border-transparent bg-primary text-white shadow-card' : 'border-line bg-surface text-muted hover:border-primary/30',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {level !== 'A1' && level !== 'A2' && (
        <p className="mt-2 rounded-xl bg-warn/10 px-3 py-2 text-[11.5px] font-medium text-warn">
          Preview: two topics only. A1 and A2 are the levels being finished first.
        </p>
      )}

      <Card className="mt-4">
        <CardBody className="p-4">
          {level === 'A1' ? (
            <>
              <p className="text-[13px] font-semibold">Which lesson</p>
              <p className="mt-0.5 text-[11.5px] text-muted">Words and dialogues straight from your class.</p>
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
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold">Which topic</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {packsFor(level).length} topics at {level}
                {level === 'A2' ? ' · every topic has all four skills' : ''}
              </p>
              <div className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {packsFor(level).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPackId(p.id)}
                    className={cn(
                      'shrink-0 rounded-xl border px-3 py-2 text-left transition',
                      p.id === packId ? 'border-transparent bg-primary text-white shadow-card' : 'border-line bg-surface text-muted hover:border-primary/30',
                    )}
                  >
                    <span className="block text-[12px] font-semibold">{p.vi}</span>
                    <span className={cn('block text-[10.5px]', p.id === packId ? 'text-white/75' : 'text-muted')}>{p.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="mt-3 rounded-xl bg-bg/70 px-3 py-2 text-[11.5px] font-medium text-muted">Đang chọn: {source.label}</p>
        </CardBody>
      </Card>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

    </div>
  )
}

/* ------------------------------------------------------------------ shared */

function Shell({ title, vi, source, onBack, children }: { title: string; vi: string; source: Source; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      <button onClick={onBack} className="text-[12px] font-semibold text-muted transition hover:text-ink">← Practice your way</button>
      <div className="mt-2">
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        <p className="text-[12px] text-muted">{vi} · {source.label}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------- listening */

function Listening({ source, onBack }: { source: Source; onBack: () => void }) {
  const items = useMemo(() => {
    const lines = source.lines.filter(usableLine).slice(0, 5)
    const others = source.pool.filter((t) => !lines.includes(t))
    return lines.map((line, i) => {
      const near = others.filter((t) => Math.abs(t.length - line.length) <= Math.max(16, line.length * 0.5))
      const pool = shuffle(near.length >= 3 ? near : others)
      return { line, options: shuffle([line, ...pool.slice(i * 3, i * 3 + 3)]) }
    })
  }, [source])

  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [slow, setSlow] = useState(false)
  const item = items[i]

  if (!item) {
    return (
      <Shell title="Listening" vi="Luyện nghe" source={source} onBack={onBack}>
        <p className="text-[13px] text-muted">No dialogue to listen to here yet.</p>
      </Shell>
    )
  }

  const last = i + 1 >= items.length
  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    const right = opt === item.line
    if (right) setScore((s) => s + 1)
    recordAttempt({
      kind: 'listen',
      lesson: source.level === 'A1' ? lessonNumber(source.label) : undefined,
      section: `Listening ${source.level}`,
      prompt: item.line,
      correct: right,
      answer: item.line,
    })
  }

  return (
    <Shell title="Listening" vi="Luyện nghe" source={source} onBack={onBack}>
      <Card>
        <CardBody className="p-5">
          <div className="flex items-center justify-between">
            <Badge tone="primary">{i + 1} / {items.length}</Badge>
            <span className="text-[12px] font-semibold text-muted">{score} right</span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void playLine(item.line, 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#5D7B6F] to-[#8FAE92] px-4 py-5 text-[14px] font-semibold text-white shadow-card transition active:scale-[.99]"
            >
              <Volume2 className="h-5 w-5" /> Play
            </button>
            <button
              onClick={() => { setSlow(true); void playLine(item.line, 0.7) }}
              className={cn('rounded-2xl border px-3 text-[12px] font-semibold transition', slow ? 'border-transparent bg-primary-soft text-primary' : 'border-line text-muted')}
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
                <button onClick={() => void playLine(item.line, 1)} className="rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold">Again</button>
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
    </Shell>
  )
}

/* ---------------------------------------------------------------- speaking */

function Speaking({ source, onBack }: { source: Source; onBack: () => void }) {
  const lines = useMemo(() => {
    const short = source.lines.filter((t) => {
      const w = clean(t).split(' ').filter(Boolean).length
      return w >= 3 && w <= 14
    })
    return (short.length ? short : source.lines).slice(0, 4).map((text) => ({ text: clean(text) }))
  }, [source])

  return (
    <Shell title="Speaking" vi="Luyện nói" source={source} onBack={onBack}>
      <SpeakRoom lessonN={source.level === 'A1' ? lessonNumber(source.label) : 0} lines={lines} />
    </Shell>
  )
}

/* ----------------------------------------------------------------- reading */

function Reading({ source, onBack }: { source: Source; onBack: () => void }) {
  const [word, setWord] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const meaning = word ? source.reading.glossary[word.toLowerCase()] : undefined

  const pick = (qIndex: number, q: Question, opt: string) => {
    if (answers[qIndex]) return
    setAnswers((a) => ({ ...a, [qIndex]: opt }))
    recordAttempt({
      kind: 'read',
      lesson: source.level === 'A1' ? lessonNumber(source.label) : undefined,
      section: `Reading ${source.level}`,
      prompt: q.q,
      correct: opt === q.answer,
      answer: q.answer,
    })
  }

  return (
    <Shell title="Reading" vi="Luyện đọc" source={source} onBack={onBack}>
      <Card>
        <CardBody className="p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">{source.reading.title}</p>
            <button
              onClick={() => void playLine(source.reading.text.join(' '), 1)}
              className="shrink-0 rounded-lg border border-line px-2 py-1 text-[11px] font-semibold"
            >
              Hear it
            </button>
          </div>
          <div className="mt-2.5 space-y-2.5">
            {source.reading.text.map((line, k) => (
              <p key={k} className="text-[15px] leading-relaxed">
                {line.split(/(\s+)/).map((tok, j) => {
                  const bare = tok.replace(/[^A-Za-z’']/g, '').toLowerCase()
                  if (!bare) return <span key={j}>{tok}</span>
                  return (
                    <button key={j} onClick={() => setWord(bare)} className="rounded transition-colors hover:bg-primary-soft">
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
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold">{word}</p>
                  <p className="text-[12.5px] text-muted">{meaning ?? 'Not in the word list yet. Save it and ask your teacher.'}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => speak(word)} className="rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold">Hear</button>
                  <button
                    onClick={() => { addCard(word, meaning, source.level, 'reading'); setSaved((s) => [...s, word]) }}
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

      {source.reading.questions.length > 0 && (
        <Card className="mt-3">
          <CardBody className="p-5">
            <p className="text-[13px] font-semibold">Questions</p>
            <div className="mt-3 space-y-4">
              {source.reading.questions.map((q, qi) => {
                const picked = answers[qi]
                return (
                  <div key={q.q}>
                    <p className="text-[13px] font-medium">{qi + 1}. {q.q}</p>
                    <div className="mt-1.5 grid gap-1.5">
                      {q.options.map((opt) => {
                        const right = opt === q.answer
                        const on = picked === opt
                        return (
                          <button
                            key={opt}
                            onClick={() => pick(qi, q, opt)}
                            disabled={Boolean(picked)}
                            className={cn(
                              'rounded-xl border px-3 py-2 text-left text-[12.5px] transition',
                              !picked && 'border-line bg-surface hover:border-primary/40',
                              picked && right && 'border-transparent bg-mint/15 text-[#0f6b4f]',
                              picked && on && !right && 'border-transparent bg-warn/10 text-warn',
                              picked && !on && !right && 'border-line bg-surface opacity-55',
                            )}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </Shell>
  )
}

/* ----------------------------------------------------------------- writing */

function Criterion({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className="flex items-start gap-1.5">
      {ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0f6b4f]" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />}
      <span className={ok ? 'text-ink' : 'text-warn'}>{text}</span>
    </span>
  )
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()

function Writing({ source, onBack }: { source: Source; onBack: () => void }) {
  const [mode, setMode] = useState<'build' | 'write' | 'para'>('build')
  const para = source.paragraph
  const [paraText, setParaText] = useState('')
  const [paraCheck, setParaCheck] = useState<{ errors: Miss[]; failed: boolean; sentences: number; words: number; missing: string[] } | null>(null)

  const builds = useMemo(
    () =>
      source.build.map((b) => {
        const words = b.en.replace(/[.?!]+$/, '').split(/\s+/)
        return { answer: words.join(' '), tiles: shuffle(words), vi: b.vi }
      }),
    [source],
  )
  const prompts = source.translate

  const [i, setI] = useState(0)
  const [tray, setTray] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'ok' | 'no'>('idle')

  const [written, setWritten] = useState('')
  const [checked, setChecked] = useState<{ exact: boolean; misses: Miss[]; failed: boolean; missing: string[]; cover: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const task = builds[i]
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
    recordAttempt({ kind: 'write', section: `Writing ${source.level}`, prompt: task.answer, correct: ok, answer: task.answer })
  }

  const checkWrite = async () => {
    if (!prompt) return
    setBusy(true)
    const exact = norm(written) === norm(prompt.en)
    const { matches, failed } = await checkEnglish(written)
    const diff = compare(prompt.en, written)
    setChecked({ exact, misses: matches, failed, missing: diff.missing, cover: diff.pct })
    recordAttempt({ kind: 'write', section: `Writing ${source.level}`, prompt: prompt.vi, correct: exact || (!failed && matches.length === 0), answer: prompt.en })
    setBusy(false)
  }

  return (
    <Shell title="Writing" vi="Luyện viết" source={source} onBack={onBack}>
      <div className={cn('grid gap-1.5', para ? 'grid-cols-3' : 'grid-cols-2')}>
        {(para ? (['build', 'write', 'para'] as const) : (['build', 'write'] as const)).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setI(0); setTray([]); setStatus('idle'); setWritten(''); setChecked(null); setParaCheck(null) }}
            className={cn(
              'rounded-xl border py-2 text-[11.5px] font-semibold transition sm:text-[12.5px]',
              mode === m ? 'border-transparent bg-primary text-white shadow-card' : 'border-line bg-surface text-muted',
            )}
          >
            {m === 'build' ? 'Build' : m === 'write' ? 'One sentence' : 'Paragraph'}
          </button>
        ))}
      </div>

      {mode === 'build' ? (
        <Card className="mt-3">
          <CardBody className="p-5">
            {!task ? (
              <p className="text-[13px] text-muted">No sentence-building tasks here.</p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="primary">{i + 1} / {builds.length}</Badge>
                  <span className="truncate text-[11.5px] text-muted">{task.vi}</span>
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

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className={cn('text-[12.5px] font-semibold', status === 'ok' ? 'text-[#0f6b4f]' : status === 'no' ? 'text-warn' : 'text-muted')}>
                    {status === 'ok' ? 'Correct.' : status === 'no' ? 'Not yet.' : `${tray.length} word${tray.length === 1 ? '' : 's'}`}
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={checkBuild} disabled={!tray.length} className="rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40">Check</button>
                    <button onClick={() => { setI((v) => (v + 1 < builds.length ? v + 1 : 0)); setTray([]); setStatus('idle') }} className="rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold">Next</button>
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      ) : mode === 'para' ? (
        <Card className="mt-3">
          <CardBody className="p-5">
            {!para ? (
              <p className="text-[13px] text-muted">No paragraph task here.</p>
            ) : (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Viết đoạn văn</p>
                <p className="mt-2 rounded-2xl bg-bg/70 px-3 py-2.5 text-[13.5px] leading-relaxed">{para.vi}</p>
                <p className="mt-1.5 text-[11.5px] text-muted">{para.prompt}</p>

                <textarea
                  value={paraText}
                  onChange={(e) => { setParaText(e.target.value); setParaCheck(null) }}
                  rows={6}
                  placeholder="Write 3–5 sentences…"
                  className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface px-3 py-2.5 text-[14px] leading-relaxed outline-none focus:border-primary/50"
                />

                <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-muted">
                  <span>
                    {paraText.trim().split(/\s+/).filter(Boolean).length} words ·{' '}
                    {paraText.split(/[.?!]+/).filter((s) => s.trim().length > 2).length} sentences
                  </span>
                  <button
                    onClick={async () => {
                      setBusy(true)
                      const { matches, failed } = await checkEnglish(paraText)
                      const words = paraText.trim().split(/\s+/).filter(Boolean).length
                      const sentences = paraText.split(/[.?!]+/).filter((s) => s.trim().length > 2).length
                      const missing = para.must.filter((w) => !paraText.toLowerCase().includes(w.toLowerCase()))
                      setParaCheck({ errors: matches, failed, sentences, words, missing })
                      recordAttempt({
                        kind: 'write',
                        section: `Paragraph ${source.level}`,
                        prompt: para.prompt,
                        correct: !failed && matches.length === 0 && missing.length === 0 && sentences >= 3 && words >= 25,
                        answer: para.model,
                      })
                      try {
                        const rows = JSON.parse(localStorage.getItem('mt2_writings') ?? '[]') as Record<string, unknown>[]
                        rows.push({ at: new Date().toISOString(), level: source.level, label: source.label, text: paraText })
                        localStorage.setItem('mt2_writings', JSON.stringify(rows.slice(-40)))
                      } catch { /* keep the text on screen even if storage is full */ }
                      void saveWriting({
                        level: source.level,
                        topic: source.label,
                        prompt: para.prompt,
                        body: paraText,
                        words,
                        issues: failed ? 0 : matches.length,
                      }).catch(() => undefined)
                      setBusy(false)
                    }}
                    disabled={busy || paraText.trim().length < 10}
                    className="rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40"
                  >
                    {busy ? 'Checking…' : 'Check'}
                  </button>
                </div>

                {paraCheck && (
                  <div className="mt-3 rounded-2xl bg-bg/70 p-3.5">
                    <div className="grid gap-1 text-[12px]">
                      <Criterion ok={paraCheck.sentences >= 3} text={`At least 3 sentences (${paraCheck.sentences})`} />
                      <Criterion ok={paraCheck.words >= 25} text={`At least 25 words (${paraCheck.words})`} />
                      <Criterion ok={paraCheck.missing.length === 0} text={paraCheck.missing.length ? `Missing words: ${paraCheck.missing.join(', ')}` : 'Used the target words'} />
                      <Criterion ok={!paraCheck.failed && paraCheck.errors.length === 0} text={paraCheck.failed ? 'Grammar service offline' : paraCheck.errors.length ? `${paraCheck.errors.length} grammar point${paraCheck.errors.length === 1 ? '' : 's'}` : 'No grammar errors found'} />
                    </div>
                    {paraCheck.errors.slice(0, 3).map((m, k) => (
                      <p key={k} className="mt-1.5 text-[12px] text-ink">
                        <span className="text-muted">{paraText.slice(m.offset, m.offset + m.length) || '…'}</span> → {m.message}
                        {m.better.length > 0 && <span className="font-semibold"> Try: {m.better.join(' / ')}</span>}
                      </p>
                    ))}
                    <p className="mt-2 text-[11.5px] leading-relaxed text-muted">Model: <span className="text-ink">{para.model}</span></p>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="mt-3">
          <CardBody className="p-5">
            {!prompt ? (
              <p className="text-[13px] text-muted">No translation prompts here.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{i + 1} / {prompts.length}</Badge>
                  <span className="text-[11.5px] text-muted">viết bằng tiếng Anh</span>
                </div>

                <p className="mt-3 rounded-2xl bg-bg/70 px-3 py-2.5 text-[14px] font-medium">{prompt.vi}</p>

                <textarea
                  value={written}
                  onChange={(e) => { setWritten(e.target.value); setChecked(null) }}
                  rows={3}
                  placeholder="Type your sentence…"
                  className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface px-3 py-2.5 text-[14px] outline-none focus:border-primary/50"
                />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11.5px] text-muted">{written.trim().split(/\s+/).filter(Boolean).length} words</p>
                  <div className="flex gap-1.5">
                    <button onClick={checkWrite} disabled={busy || !written.trim()} className="rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40">
                      {busy ? 'Checking…' : 'Check'}
                    </button>
                    <button onClick={() => { setI((v) => (v + 1 < prompts.length ? v + 1 : 0)); setWritten(''); setChecked(null) }} className="rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold">Next</button>
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
                    {!checked.exact && !checked.misses.length && checked.missing.length > 0 && (
                      <p className="mt-1.5 text-[12px] text-ink">The model adds: <span className="font-semibold">{checked.missing.join(', ')}</span></p>
                    )}
                    {checked.misses.slice(0, 4).map((m, k) => (
                      <p key={k} className="mt-1.5 text-[12px] text-ink">
                        <span className="text-muted">{written.slice(m.offset, m.offset + m.length) || '…'}</span> → {m.message}
                        {m.better.length > 0 && <span className="font-semibold"> Try: {m.better.join(' / ')}</span>}
                      </p>
                    ))}
                    <p className="mt-2 text-[11.5px] text-muted">Model answer: <span className="font-medium text-ink">{prompt.en}</span></p>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}
    </Shell>
  )
}

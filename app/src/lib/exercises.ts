/**
 * Turns the ten lesson files into exercises.
 *
 * Every item carries its lesson, skill and the exact prompt/answer, so a screen only renders a
 * list and a mistake can be replayed later without its lesson. Adding a lesson file adds exercises:
 * nothing here names a lesson number.
 */
import { A1, A1_QUIZ, readingFor, titleOf, type LessonFile, type QuizItem, type VocabItem } from './curriculum'

export type Skill = 'vocab' | 'grammar' | 'listening' | 'reading' | 'speaking'

export type Exercise = {
  id: string
  lesson: number
  lessonTitle: string
  skill: Skill
  /** What the screen draws. */
  kind: 'meaning' | 'cloze' | 'order' | 'listen' | 'gap' | 'sequence' | 'reading' | 'translate' | 'choose' | 'speak' | 'flash' | 'match'
  prompt: string
  vi?: string
  options?: string[]
  answer: string
  hint?: string
  explain?: string
  /** Text to play with speak(); also what a listening question asks about. */
  audio?: string
  /** Reading items carry the passage so the screen can show it above the question. */
  passage?: string
  /** Matching items carry their four pairs so the screen can draw two columns. */
  pairs?: { word: string; vi: string }[]
}

const KEEP_KIND: Record<Skill, 'quiz' | 'listen' | 'build' | 'speak' | 'read'> = {
  vocab: 'quiz',
  grammar: 'quiz',
  listening: 'listen',
  reading: 'read',
  speaking: 'speak',
}

/** The attempt kind to store, so Progress and To redo keep working with no new tables. */
export function attemptKind(skill: Skill) {
  return KEEP_KIND[skill]
}

function shuffle<T>(list: T[], seed = 7): T[] {
  const out = [...list]
  let s = seed
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function options4(answer: string, pool: string[], seed: number): string[] {
  const others = shuffle(pool.filter((x) => x && x !== answer), seed).slice(0, 3)
  return shuffle([answer, ...others], seed + 3)
}

function vocabItems(lesson: LessonFile, words: VocabItem[]): Exercise[] {
  const title = titleOf(lesson)
  const meanings = words.map((w) => w.vi)
  const out: Exercise[] = []
  for (const [i, w] of words.entries()) {
    out.push({
      id: `l${lesson.n}-meaning-${w.word}`,
      lesson: lesson.n,
      lessonTitle: title,
      skill: 'vocab',
      kind: 'meaning',
      prompt: w.word,
      vi: w.ipa,
      audio: w.word,
      options: options4(w.vi, meanings, i + lesson.n),
      answer: w.vi,
      hint: `${w.def} — "${w.example}"`,
      explain: `${w.word} = ${w.vi}`,
    })
    if (w.cloze) {
      out.push({
        id: `l${lesson.n}-cloze-${w.word}`,
        lesson: lesson.n,
        lessonTitle: title,
        skill: 'vocab',
        kind: 'cloze',
        prompt: w.cloze,
        vi: w.vi,
        options: options4(w.word, words.map((x) => x.word), i + lesson.n + 1),
        answer: w.word,
        hint: `${w.vi} — ${w.pos}`,
        explain: `${w.word}: ${w.example}`,
      })
    }
    const chunks = w.example.replace(/[.!?]$/, '').split(/\s+/)
    if (chunks.length >= 4 && chunks.length <= 9) {
      out.push({
        id: `l${lesson.n}-order-${w.word}`,
        lesson: lesson.n,
        lessonTitle: title,
        skill: 'grammar',
        kind: 'order',
        prompt: 'Put the words in order',
        vi: w.example,
        answer: w.example.replace(/[.!?]$/, ''),
        hint: w.vi,
        explain: w.example,
      })
    }
  }
  return out
}

function dialogueItems(lesson: LessonFile): Exercise[] {
  const title = titleOf(lesson)
  const turns = lesson.parts.dialogue.filter((t) => t.line && t.line.split(/\s+/).length >= 4)
  const out: Exercise[] = []
  for (const [i, t] of turns.entries()) {
    const words = t.line.replace(/[.,!?]/g, '').split(/\s+/)
    const target = words.filter((w) => w.length > 3)[0]
    if (target) {
      const others = turns.flatMap((x) => x.line.split(/\s+/)).filter((w) => w.length > 3 && w !== target)
      out.push({
        id: `l${lesson.n}-gap-${i}`,
        lesson: lesson.n,
        lessonTitle: title,
        skill: 'listening',
        kind: 'gap',
        prompt: t.line.replace(new RegExp(`\\b${target}\\b`), '_____'),
        vi: `${t.who} says this`,
        audio: t.line,
        options: options4(target, others, i + lesson.n + 5),
        answer: target,
        hint: 'Listen once, then read the sentence.',
        explain: t.line,
      })
    }
  }
  // Order four consecutive turns back into a conversation.
  for (let i = 0; i + 3 < turns.length; i += 4) {
    const block = turns.slice(i, i + 4)
    out.push({
      id: `l${lesson.n}-seq-${i}`,
      lesson: lesson.n,
      lessonTitle: title,
      skill: 'reading',
      kind: 'sequence',
      prompt: 'Put the conversation back in order',
      answer: block.map((b) => b.line).join(' | '),
      hint: 'Start with the greeting, end with the answer.',
      explain: block.map((b) => `${b.who}: ${b.line}`).join(' '),
    })
  }
  return out
}

function listenChecks(lesson: LessonFile): Exercise[] {
  const title = titleOf(lesson)
  return lesson.parts.listenCheck.map((c, i) => ({
    id: `l${lesson.n}-listen-${i}`,
    lesson: lesson.n,
    lessonTitle: title,
    skill: 'listening',
    kind: 'listen' as const,
    prompt: c.q,
    audio: c.q.replace(/^[A-Za-z]+:\s*/, ''),
    answer: c.a,
    hint: 'Play it twice before you answer.',
    explain: c.a,
  }))
}

function flashItems(lesson: LessonFile): Exercise[] {
  return lesson.parts.vocab.slice(0, 4).map((w) => ({
    id: `l${lesson.n}-flash-${w.word}`,
    lesson: lesson.n,
    lessonTitle: titleOf(lesson),
    skill: 'vocab' as const,
    kind: 'flash' as const,
    prompt: w.word,
    vi: w.ipa,
    audio: w.word,
    answer: `${w.vi} — ${w.example}`,
    hint: w.def,
    explain: `${w.word} = ${w.vi}. ${w.example}`,
  }))
}

/** Four words and their meanings, matched by tapping: the one type where the learner builds the pairs. */
function matchItems(lesson: LessonFile): Exercise[] {
  const words = lesson.parts.vocab.slice(0, 4)
  if (words.length < 4) return []
  return [
    {
      id: `l${lesson.n}-match`,
      lesson: lesson.n,
      lessonTitle: titleOf(lesson),
      skill: 'vocab' as const,
      kind: 'match' as const,
      prompt: 'Match each word with its meaning',
      answer: words.map((w) => `${w.word} = ${w.vi}`).join(', '),
      hint: 'Say each word out loud as you match it.',
      explain: words.map((w) => `${w.word} = ${w.vi}`).join(' · '),
      pairs: words.map((w) => ({ word: w.word, vi: w.vi })),
    },
  ]
}

function quizItems(lesson: LessonFile): Exercise[] {
  const title = titleOf(lesson)
  const items: QuizItem[] = A1_QUIZ[lesson.n] ?? []
  return items.map((q, i) => {
    const kind: Exercise['kind'] = q.options && q.options.length > 1 ? 'choose' : 'translate'
    return {
      id: `l${lesson.n}-quiz-${i}`,
      lesson: lesson.n,
      lessonTitle: title,
      skill: 'grammar',
      kind,
      prompt: q.prompt,
      vi: q.vi,
      options: q.options,
      answer: q.answer,
      hint: q.section,
      explain: q.answer,
    }
  })
}

function readingItems(lesson: LessonFile): Exercise[] {
  const r = readingFor(lesson.n)
  if (!r) return []
  return r.questions.map((q, i) => ({
    id: `l${lesson.n}-read-${i}`,
    lesson: lesson.n,
    lessonTitle: titleOf(lesson),
    skill: 'reading' as const,
    kind: 'reading' as const,
    prompt: q.q,
    options: q.options,
    answer: q.answer,
    hint: 'Read the text once for the idea, then look for the line.',
    explain: q.explain,
    passage: r.text,
  }))
}

function speakItems(lesson: LessonFile): Exercise[] {
  const title = titleOf(lesson)
  const out: Exercise[] = []
  // Vocab example sentences (existing)
  for (const w of lesson.parts.vocab.slice(0, 4)) {
    out.push({
      id: `l${lesson.n}-speak-${w.word}`,
      lesson: lesson.n,
      lessonTitle: title,
      skill: 'speaking' as const,
      kind: 'speak' as const,
      prompt: w.example,
      vi: w.vi,
      audio: w.example,
      answer: w.example,
      hint: 'Say it out loud, then record it for your teacher.',
      explain: w.example,
    })
  }
  // Real-life speak prompts (new)
  const prompts = lesson.parts.speakPrompts ?? []
  for (const [i, p] of prompts.entries()) {
    out.push({
      id: `l${lesson.n}-speak-p-${i}`,
      lesson: lesson.n,
      lessonTitle: title,
      skill: 'speaking' as const,
      kind: 'speak' as const,
      prompt: p,
      audio: p,
      answer: p,
      hint: 'Say it out loud, then record it for your teacher.',
      explain: p,
    })
  }
  return out
}

function normKey(e: Exercise): string {
  return `${e.skill}|${e.answer.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()}`
}

const cache = new Map<number, Exercise[]>()

/** Every exercise the lesson can build, grouped by skill in the order a learner meets them. */
export function exercisesFor(lessonN: number): Exercise[] {
  const hit = cache.get(lessonN)
  if (hit) return hit
  const lesson = A1.find((l) => l.n === lessonN)
  if (!lesson) return []
  // A lesson has far more material than one round needs. Take a spread and keep each answer once,
  // so "66 exercises" never means sixty ways to see the same sentence.
  const all: Exercise[] = []
  const seen = new Set<string>()
  const push = (list: Exercise[], limit: number) => {
    const step = Math.max(1, Math.floor(list.length / limit))
    let added = 0
    for (let i = 0; i < list.length && added < limit; i += step) {
      const e = list[i]
      const key = normKey(e)
      if (seen.has(key)) continue
      seen.add(key)
      all.push(e)
      added += 1
    }
  }
  const vocab = vocabItems(lesson, lesson.parts.vocab)
  push(vocab.filter((e) => e.kind === 'meaning'), 999)
  push(flashItems(lesson), 4)
  push(matchItems(lesson), 1)
  push(vocab.filter((e) => e.kind === 'cloze'), 10)
  push(vocab.filter((e) => e.kind === 'order'), 6)
  push(quizItems(lesson), 999)
  push(dialogueItems(lesson).filter((e) => e.kind === 'gap'), 8)
  push(dialogueItems(lesson).filter((e) => e.kind === 'sequence'), 2)
  push(listenChecks(lesson), 999)
  push(readingItems(lesson), 3)
  push(speakItems(lesson), 3)
  cache.set(lessonN, all)
  return all
}

export function skillCounts(lessonN: number): Record<Skill, number> {
  const out: Record<Skill, number> = { vocab: 0, grammar: 0, listening: 0, reading: 0, speaking: 0 }
  for (const e of exercisesFor(lessonN)) out[e.skill] += 1
  return out
}

/**
 * A session: a few items from each skill the lesson actually has, spread over the lesson and
 * shuffled inside the block so one screen never repeats the same shape four times.
 */
export function sessionFor(lessonN: number, size = 10): Exercise[] {
  const all = exercisesFor(lessonN)
  if (!all.length) return []
  const bySkill = new Map<Skill, Exercise[]>()
  for (const e of all) {
    const list = bySkill.get(e.skill) ?? []
    list.push(e)
    bySkill.set(e.skill, list)
  }
  // Listening and speaking come first: the learner practises the skills they came for
  // before the usual vocab/grammar/reading mix.
  const order: Skill[] = ['listening', 'speaking', 'vocab', 'grammar', 'reading']
  // One matching round and one flip card per session when the lesson has them: variety the learner
  // can feel, not another four-option question. Pushed last so listening/speaking lead.
  const picked: Exercise[] = []
  let round = 0
  while (picked.length < size && round < 20) {
    for (const skill of order) {
      const list = bySkill.get(skill)
      if (!list?.length) continue
      const next = list[(round * 3 + skill.length) % list.length]
      if (!picked.find((p) => p.id === next.id)) picked.push(next)
      if (picked.length >= size) break
    }
    round += 1
  }
  for (const kind of ['match', 'flash'] as const) {
    const one = all.find((e) => e.kind === kind)
    if (one && !picked.find((p) => p.id === one.id) && picked.length < size) picked.push(one)
  }
  return picked
}

/** Items the learner has not met yet, so "practise again" can push forward instead of repeating. */
export function freshSession(lessonN: number, seen: Set<string>, size = 10): Exercise[] {
  const all = exercisesFor(lessonN).filter((e) => !seen.has(e.id))
  if (all.length < 4) return sessionFor(lessonN, size)
  return shuffle(all, lessonN * 31 + seen.size).slice(0, Math.min(size, all.length))
}

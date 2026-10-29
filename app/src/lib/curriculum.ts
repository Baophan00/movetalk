/**
 * A1 content, built by tools/build_lesson.py and tools/build_review.py.
 *
 * No schema library: the files are generated a few lines away, so a light runtime check that
 * throws on a missing part is enough to stop an empty lesson reaching a screen.
 */

export type VocabItem = {
  word: string
  pos: string
  ipa: string
  def: string
  example: string
  vi: string
  cloze: string
}

export type GrammarSection = { section: string; sub: string; lines: string[] }
export type Turn = { who: string; line: string }
export type FlowSlide = { title: string; lines: string[] }
export type FlowGroup = { group: string; slides: FlowSlide[] }
export type Check = { q: string; a: string }

export type LessonFile = {
  n: number
  level: string
  deck?: string
  slides?: number
  parts: {
    vocab: VocabItem[]
    grammar: GrammarSection[]
    grammarChoose: { prompt: string; vi: string }[]
    dialogue: Turn[]
    listenCheck: Check[]
    flow: FlowGroup[]
    speakPrompts?: string[]
  }
}

export type QuizItem = {
  kind: 'choice' | 'translate' | 'chunks' | 'reveal'
  section: string
  prompt: string
  answer: string
  options?: string[]
  vi?: string
}

type QuizFile = { n: number; level: string; items: QuizItem[] }

const lessonFiles = import.meta.glob('../content/a1/L*.json', { eager: true }) as Record<string, { default: unknown }>

function asLesson(raw: unknown): LessonFile {
  const l = raw as LessonFile
  if (!l || typeof l.n !== 'number' || !l.parts) throw new Error('lesson file without parts')
  const parts = l.parts
  return {
    n: l.n,
    level: l.level ?? 'A1',
    deck: l.deck,
    slides: l.slides,
    parts: {
      vocab: parts.vocab ?? [],
      grammar: parts.grammar ?? [],
      grammarChoose: parts.grammarChoose ?? [],
      dialogue: parts.dialogue ?? [],
      listenCheck: parts.listenCheck ?? [],
      flow: parts.flow ?? [],
      speakPrompts: parts.speakPrompts ?? [],
    },
  }
}

export const A1: LessonFile[] = Object.entries(lessonFiles)
  .filter(([path]) => !path.includes('-quiz') && !path.includes('-reading'))
  .map(([, mod]) => asLesson(mod.default))
  .sort((a, b) => a.n - b.n)

const quizFiles = import.meta.glob('../content/a1/L*-quiz.json', { eager: true }) as Record<string, { default: unknown }>

/** Vietnamese gloss for each practice prompt, keyed by the prompt itself so it survives a quiz rebuild. */
const quizViFiles = import.meta.glob('../content/a1/quiz-vi.json', { eager: true }) as Record<string, { default: unknown }>

export const QUIZ_VI: Record<string, string> = (Object.values(quizViFiles)[0]?.default as Record<string, string>) ?? {}

export const A1_QUIZ: Record<number, QuizItem[]> = Object.fromEntries(
  Object.entries(quizFiles).map(([, mod]) => {
    const q = mod.default as QuizFile
    return [q.n, q.items ?? []]
  }),
)

/** 'doc_ab12_MOVE_ACTIVATE_1_L01_BUILD YES-NO QUESTION _VIP.pptx' -> 'BUILD YES-NO QUESTION' */
const TITLE_FIX: Record<number, string> = {
  5: 'This, That, These, Those, There + be',
  7: 'Revision: Lessons 1-6',
}

export function titleOf(lesson: LessonFile): string {
  if (TITLE_FIX[lesson.n]) return TITLE_FIX[lesson.n]
  const raw = (lesson.deck ?? '')
    .replace(/^doc_[a-f0-9]+_/i, '')
    .replace(/^MOVE[\s_]*ACTIVATE[\s_]*1[\s_]*L\d+[\s_]*/i, '')
    .replace(/[\s_]*VIP.*$/i, '')
    .replace(/\.pptx$/i, '')
    .replace(/[\s_]+/g, ' ')
    .trim()
  // 'BUILD YES-NO QUESTION' -> 'Build Yes-No Question'
  return raw
    .toLowerCase()
    .split(' ')
    .map((word) => word.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('-'))
    .join(' ')
}

/** Teaching order of the parts; also the identity used when progress is stored. */
export const PART_ORDER: Record<string, number> = {
  Overview: 5,
  Vocabulary: 20,
  'Before you listen': 30,
  Grammar: 40,
  Pronunciation: 50,
  Dialogue: 60,
  'Listening check': 70,
  Activate: 80,
  Practice: 85,
  'Real talk': 90,
  Reflect: 100,
  Mission: 110,
}

export type PartPlan = { key: string; label: string }

/** The parts a lesson actually shows, in order — the single source the screen and the sync share. */
export function partPlan(lesson: LessonFile): PartPlan[] {
  const plan: (PartPlan & { order: number })[] = []
  const push = (key: string, label: string) => plan.push({ key, label, order: PART_ORDER[label] ?? 200 })
  const p = lesson.parts
  if (p.vocab.length) push('vocab', 'Vocabulary')
  if (p.grammar.length) push('grammar', 'Grammar')
  if (p.dialogue.length) push('dialogue', 'Dialogue')
  if (p.listenCheck.length) push('check', 'Listening check')
  if (p.grammarChoose.length || hasChoicePractice(lesson.n)) push('choose', 'Practice')
  for (const g of p.flow) {
    const covered = (g.group === 'Grammar' && p.grammar.length > 0) || (g.group === 'Vocabulary' && p.vocab.length > 0)
    if (!covered) push(`flow-${g.group}`, g.group)
  }
  return plan.sort((a, b) => a.order - b.order).map(({ key, label }) => ({ key, label }))
}

/** A lesson shows Practice when its quiz has more than one option to choose between. */
export function hasChoicePractice(n: number): boolean {
  return (A1_QUIZ[n] ?? []).some((q) => q.kind === 'choice' && (q.options ?? []).length > 1)
}

/** Parts with material in them — what the lesson screen actually shows. */
export function partCount(lesson: LessonFile): number {
  const p = lesson.parts
  const structured = [p.vocab.length, p.grammar.length, p.dialogue.length, p.listenCheck.length, p.grammarChoose.length || (hasChoicePractice(lesson.n) ? 1 : 0)].filter(Boolean).length
  return structured + p.flow.length
}

export function lessonA1(n: number): LessonFile | undefined {
  return A1.find((l) => l.n === n)
}

export function quizFor(n: number): QuizItem[] {
  return (A1_QUIZ[n] ?? []).map((q) => ({ ...q, vi: q.vi ?? QUIZ_VI[q.prompt] }))
}

/** One short reading per lesson, written to reuse that lesson's words and structures. */
export type ReadingQuestion = { q: string; options: string[]; answer: string; explain?: string }
export type ReadingFile = { lesson: number; title: string; text: string; questions: ReadingQuestion[] }

const readingFiles = import.meta.glob('../content/a1/L*-reading.json', { eager: true }) as Record<string, { default: unknown }>

export const A1_READING: Record<number, ReadingFile> = Object.fromEntries(
  Object.entries(readingFiles).map(([, mod]) => {
    const r = mod.default as ReadingFile
    return [r.lesson, r]
  }),
)

export function readingFor(n: number): ReadingFile | undefined {
  return A1_READING[n]
}

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
  }
}

export type QuizItem = {
  kind: 'choice' | 'translate' | 'chunks' | 'reveal'
  section: string
  prompt: string
  answer: string
  options?: string[]
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
    },
  }
}

export const A1: LessonFile[] = Object.entries(lessonFiles)
  .filter(([path]) => !path.includes('-quiz'))
  .map(([, mod]) => asLesson(mod.default))
  .sort((a, b) => a.n - b.n)

const quizFiles = import.meta.glob('../content/a1/L*-quiz.json', { eager: true }) as Record<string, { default: unknown }>

export const A1_QUIZ: Record<number, QuizItem[]> = Object.fromEntries(
  Object.entries(quizFiles).map(([, mod]) => {
    const q = mod.default as QuizFile
    return [q.n, q.items ?? []]
  }),
)

export function lessonA1(n: number): LessonFile | undefined {
  return A1.find((l) => l.n === n)
}

export function quizFor(n: number): QuizItem[] {
  return A1_QUIZ[n] ?? []
}

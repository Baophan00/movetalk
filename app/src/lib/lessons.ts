import raw from '../content/lessons.json'

export type Block =
  | { t: 'h'; text: string }
  | { t: 'note'; text: string }
  | { t: 'p'; text: string }
  | { t: 'label'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'say'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'flashcard'; items: Flashcard[] }
  | { t: 'quiz'; items: QuizItem[] }
  | { t: 'dialog'; title: string; target?: string; lift?: string; lines: { speaker: string; text: string }[]; check?: string[]; answers?: string; note?: string }
  | { t: 'steps'; title: string; context?: string; steps: string[]; useful?: string }
  | { t: 'retrieval'; items: { vi: string; en: string }[] }

export type Flashcard = {
  word: string
  phonetic?: string
  vi: string
  def?: string
  examples?: { text: string; context?: string }[]
}
export type QuizItem = { q: string; options: string[]; answer: number }

export type Lesson = {
  n: number
  title: string
  vi: string
  goal: string
  today: string[]
  parts: Record<string, Block[]>
}

export const LESSONS = raw as Lesson[]

export const PART_ORDER = [
  'vocab', 'grammar', 'reading', 'conversations', 'listening',
  'exercises', 'speaking', 'roleplay', 'finalTask', 'reference',
] as const

export const PART_META: Record<string, { label: string; short: string }> = {
  vocab: { label: 'Từ vựng', short: 'Từ vựng' },
  grammar: { label: 'Ngữ pháp', short: 'Ngữ pháp' },
  reading: { label: 'Đọc', short: 'Đọc' },
  conversations: { label: 'Hội thoại', short: 'Hội thoại' },
  listening: { label: 'Nghe và nhắc lại', short: 'Nghe' },
  exercises: { label: 'Bài tập', short: 'Bài tập' },
  speaking: { label: 'Nói', short: 'Nói' },
  roleplay: { label: 'Nhập vai', short: 'Nhập vai' },
  finalTask: { label: 'Bài cuối', short: 'Bài cuối' },
  reference: { label: 'Tra nhanh', short: 'Tra nhanh' },
}

export function partsOf(lesson?: Lesson) {
  if (!lesson) return []
  return PART_ORDER.filter((k) => lesson.parts[k]?.length).map((k) => ({ key: k, blocks: lesson.parts[k] }))
}

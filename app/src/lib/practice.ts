import { A1_QUIZ, type LessonFile, type QuizItem } from './curriculum'

/** Game data is derived from the lesson the learner already has, so a new lesson needs no new code. */

export function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export type Pair = { id: string; word: string; vi: string; ipa: string; example: string }

export function pairsFor(lesson: LessonFile, count = 6): Pair[] {
  return lesson.parts.vocab
    .filter((v) => v.word && v.vi)
    .slice(0, count)
    .map((v, i) => ({ id: `${i}-${v.word}`, word: v.word, vi: v.vi, ipa: v.ipa, example: v.example }))
}

export function quizRound(lessonN: number, limit = 10): QuizItem[] {
  const pool = (A1_QUIZ[lessonN] ?? []).filter((q) => q.kind === 'choice' && (q.options?.length ?? 0) >= 2)
  return shuffle(pool).slice(0, limit)
}

export type Builder = { answer: string; tiles: string[]; vi: string }

export function buildersFor(lesson: LessonFile, count = 5): Builder[] {
  return lesson.parts.vocab
    .filter((v) => {
      const words = v.example.trim().split(/\s+/)
      return words.length >= 4 && words.length <= 9
    })
    .slice(0, count)
    .map((v) => {
      const words = v.example.replace(/[.?!]+$/, '').split(/\s+/)
      return { answer: words.join(' '), tiles: shuffle(words), vi: v.vi }
    })
}

export type Listen = { id: string; word: string; ipa: string; options: string[]; answer: string }

export function listensFor(lesson: LessonFile, count = 5): Listen[] {
  const pool = lesson.parts.vocab.filter((v) => v.word && v.vi)
  const picked = shuffle(pool).slice(0, count)
  return picked.map((v, i) => {
    const others = shuffle(pool.filter((o) => o.vi !== v.vi)).slice(0, 3).map((o) => o.vi)
    return { id: `${i}-${v.word}`, word: v.word, ipa: v.ipa, options: shuffle([v.vi, ...others]), answer: v.vi }
  })
}

/** A sentence worth saying out loud, for the recording task. */
export function speakingLines(lesson: LessonFile, count = 3): { text: string; vi: string }[] {
  const fromDialogue = lesson.parts.dialogue
    .filter((t) => t.line && t.line.split(/\s+/).length >= 3)
    .slice(0, count)
    .map((t) => ({ text: t.line, vi: t.who }))
  if (fromDialogue.length >= count) return fromDialogue
  const fromVocab = lesson.parts.vocab.filter((v) => v.example).slice(0, count - fromDialogue.length).map((v) => ({ text: v.example, vi: v.vi }))
  return [...fromDialogue, ...fromVocab]
}

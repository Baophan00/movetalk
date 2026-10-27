/**
 * Which lessons a learner may open. A lesson opens when the teacher sends it as an assignment, or
 * when it is unlocked by hand (preview, or a teacher who wants to open one without sending work).
 * The unlock list is per device — a real per-account unlock needs a row on the server.
 */

const KEY = 'mt2_unlocked'

export function unlockedLessons(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown
    return Array.isArray(raw) ? raw.filter((n): n is number => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function unlockLesson(n: number): number[] {
  const next = [...new Set([...unlockedLessons(), n])].sort((a, b) => a - b)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

/** Fold lessons opened on the account into the browser copy, so a new device is not empty. */
export function mergeUnlocked(list: number[]): number[] {
  const next = [...new Set([...unlockedLessons(), ...list])].sort((a, b) => a - b)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function lockLesson(n: number): number[] {
  const next = unlockedLessons().filter((x) => x !== n)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function isPracticeOpen(lessonN: number, assigned: number[] = []): boolean {
  return assigned.includes(lessonN) || unlockedLessons().includes(lessonN)
}

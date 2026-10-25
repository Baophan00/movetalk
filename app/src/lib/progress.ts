const KEY = 'mt2_progress'

export type Progress = Record<string, number[]>   // lesson number -> part indexes read

function read(): Progress {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Progress
  } catch {
    return {}
  }
}

export function markPart(lesson: number, part: number) {
  const all = read()
  const key = String(lesson)
  const seen = new Set(all[key] || [])
  seen.add(part)
  all[key] = [...seen].sort((a, b) => a - b)
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

export function partsSeen(lesson: number): number[] {
  return read()[String(lesson)] || []
}

export function lessonPercent(lesson: number, total: number) {
  return total ? Math.round((partsSeen(lesson).length / total) * 100) : 0
}

/** Union remote progress into the browser cache; never removes what is already local. */
export function mergeProgress(remote: Record<number, number[]>) {
  const all = read()
  for (const [lesson, indexes] of Object.entries(remote)) {
    const seen = new Set([...(all[lesson] ?? []), ...indexes])
    all[lesson] = [...seen].sort((a, b) => a - b)
  }
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

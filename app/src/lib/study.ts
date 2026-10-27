import { supabase } from './supabase'

/**
 * The study loop. Local storage is the source of truth on this device; the server
 * copy is what makes the same learner look the same on another machine, and what
 * lets the teacher see who is stuck. Every server call fails quietly.
 */

export type Attempt = {
  at: number
  kind: 'quiz' | 'listen' | 'build' | 'speak' | 'write' | 'read'
  lesson?: number
  section?: string
  prompt: string
  correct: boolean
}

export type Card = {
  id: string
  term: string
  meaning?: string
  level?: string
  source?: string
  box: number
  due: string // YYYY-MM-DD
  lapses: number
  at: number
}

const A_KEY = 'mt2_attempts'
const C_KEY = 'mt2_cards'
const D_KEY = 'mt2_days'
const KEEP = 800

function readList<T>(key: string): T[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(raw) ? (raw as T[]) : []
  } catch {
    return []
  }
}

function writeList<T>(key: string, list: T[]) {
  localStorage.setItem(key, JSON.stringify(list.slice(-KEEP)))
}

export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(day: string, n: number): string {
  const d = new Date(day + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function me(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id ?? null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ attempts */

export function recordAttempt(a: Omit<Attempt, 'at'>) {
  const list = readList<Attempt>(A_KEY)
  const entry: Attempt = { ...a, at: Date.now() }
  list.push(entry)
  writeList(A_KEY, list)
  bumpDay()
  void (async () => {
    const uid = await me()
    if (!uid) return
    await supabase.from('attempts').insert({
      student_id: uid,
      kind: a.kind,
      lesson_no: a.lesson ?? null,
      section: a.section ?? null,
      prompt: a.prompt.slice(0, 240),
      correct: a.correct,
    })
  })().catch(() => undefined)
}

/** Latest answer per prompt; only prompts whose last answer was wrong are returned. */
export function wrongItems(lesson?: number): Attempt[] {
  const latest = new Map<string, Attempt>()
  for (const a of readList<Attempt>(A_KEY)) {
    if (lesson && a.lesson !== lesson) continue
    const key = a.prompt
    const seen = latest.get(key)
    if (!seen || seen.at < a.at) latest.set(key, a)
  }
  return [...latest.values()].filter((a) => !a.correct).sort((a, b) => b.at - a.at)
}

export function mistakeCount(lesson?: number): number {
  return wrongItems(lesson).length
}

/** Weakest grammar labels, most misses first. */
export function weakSections(limit = 3): { section: string; wrong: number }[] {
  const counts = new Map<string, number>()
  for (const a of wrongItems()) {
    const s = (a.section || '').trim()
    if (!s) continue
    counts.set(s, (counts.get(s) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([section, wrong]) => ({ section, wrong }))
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, limit)
}

/** Raw log, newest last. Used by the progress screen. */
export function allAttempts(): Attempt[] {
  return readList<Attempt>(A_KEY)
}

/** Accuracy per skill, plus how many answers it is based on. */
export function skillStats(kind: Attempt['kind']): { pct: number; total: number } {
  const rows = allAttempts().filter((a) => a.kind === kind)
  if (!rows.length) return { pct: 0, total: 0 }
  const right = rows.filter((a) => a.correct).length
  return { pct: Math.round((right / rows.length) * 100), total: rows.length }
}

/* --------------------------------------------------------------------- cards */

export function listCards(): Card[] {
  return readList<Card>(C_KEY)
}

export function dueCards(): Card[] {
  const t = today()
  return listCards()
    .filter((c) => c.due <= t)
    .sort((a, b) => a.due.localeCompare(b.due))
}

export function addCard(term: string, meaning?: string, level?: string, source?: string): Card[] {
  const clean = term.trim()
  if (!clean) return listCards()
  const list = listCards()
  if (list.some((c) => c.term.toLowerCase() === clean.toLowerCase())) return list
  const card: Card = {
    id: `c${Date.now().toString(36)}`,
    term: clean,
    meaning,
    level,
    source,
    box: 1,
    due: today(),
    lapses: 0,
    at: Date.now(),
  }
  const next = [...list, card]
  writeList(C_KEY, next)
  void (async () => {
    const uid = await me()
    if (!uid) return
    await supabase.from('cards').upsert(
      { term: clean, meaning, level: level ?? 'A1', source: source ?? 'mine', student_id: uid, due: card.due },
      { onConflict: 'student_id,term' },
    )
  })().catch(() => undefined)
  return next
}

const STEPS = [0, 1, 3, 7, 16, 35]

export function reviewCard(id: string, right: boolean): Card[] {
  const next = listCards().map((c) => {
    if (c.id !== id) return c
    const box = right ? Math.min(5, c.box + 1) : 1
    return {
      ...c,
      box,
      lapses: right ? c.lapses : c.lapses + 1,
      due: addDays(today(), STEPS[box] ?? 1),
    }
  })
  writeList(C_KEY, next)
  const changed = next.find((c) => c.id === id)
  void (async () => {
    const uid = await me()
    if (!uid || !changed) return
    await supabase.from('cards').update({ box: changed.box, due: changed.due, lapses: changed.lapses }).match({ student_id: uid, term: changed.term })
  })().catch(() => undefined)
  return next
}

/* --------------------------------------------------------------------- days */

export type Days = Record<string, number>

export function readDays(): Days {
  try {
    const raw = JSON.parse(localStorage.getItem(D_KEY) || '{}')
    return raw && typeof raw === 'object' ? (raw as Days) : {}
  } catch {
    return {}
  }
}

function bumpDay() {
  const days = readDays()
  const t = today()
  days[t] = (days[t] || 0) + 1
  localStorage.setItem(D_KEY, JSON.stringify(days))
  void (async () => {
    const uid = await me()
    if (!uid) return
    await supabase.from('day_log').upsert({ student_id: uid, day: t, items: days[t] }, { onConflict: 'student_id,day' })
  })().catch(() => undefined)
}

/** Consecutive days with at least one finished item, counting back from today. */
export function streak(): number {
  const days = readDays()
  let n = 0
  let cursor = today()
  if (!days[cursor]) cursor = addDays(cursor, -1) // today not started yet does not break the run
  while (days[cursor]) {
    n += 1
    cursor = addDays(cursor, -1)
  }
  return n
}

export function doneToday(): boolean {
  return Boolean(readDays()[today()])
}

/* --------------------------------------------------------------------- sync */

/** Merge what the account already knows into this device. Local answers win on ties. */
export async function pullStudy(): Promise<void> {
  const uid = await me()
  if (!uid) return
  const [at, cd, dl] = await Promise.all([
    supabase.from('attempts').select('kind,lesson_no,section,prompt,correct,at').eq('student_id', uid).order('at', { ascending: false }).limit(400),
    supabase.from('cards').select('term,meaning,level,source,box,due,lapses').eq('student_id', uid),
    supabase.from('day_log').select('day,items').eq('student_id', uid),
  ])
  if (at.data?.length) {
    const local = readList<Attempt>(A_KEY)
    const known = new Set(local.map((a) => `${a.prompt}|${a.at}`))
    const merged = [...local]
    for (const r of at.data as { kind: Attempt['kind']; lesson_no: number | null; section: string | null; prompt: string; correct: boolean; at: string }[]) {
      const stamp = new Date(r.at).getTime()
      const key = `${r.prompt}|${stamp}`
      if (known.has(key)) continue
      merged.push({ at: stamp, kind: r.kind, lesson: r.lesson_no ?? undefined, section: r.section ?? undefined, prompt: r.prompt, correct: r.correct })
    }
    merged.sort((a, b) => a.at - b.at)
    writeList(A_KEY, merged)
  }
  if (cd.data?.length) {
    const local = listCards()
    const known = new Set(local.map((c) => c.term.toLowerCase()))
    const merged = [...local]
    for (const r of cd.data as { term: string; meaning: string | null; level: string | null; source: string | null; box: number; due: string; lapses: number }[]) {
      if (known.has(r.term.toLowerCase())) continue
      merged.push({
        id: `c${r.term.length}${r.term.charCodeAt(0)}`,
        term: r.term,
        meaning: r.meaning ?? undefined,
        level: r.level ?? undefined,
        source: r.source ?? undefined,
        box: r.box,
        due: r.due,
        lapses: r.lapses,
        at: Date.now(),
      })
    }
    writeList(C_KEY, merged)
  }
  if (dl.data?.length) {
    const days = readDays()
    for (const r of dl.data as { day: string; items: number }[]) {
      days[r.day] = Math.max(days[r.day] || 0, r.items)
    }
    localStorage.setItem(D_KEY, JSON.stringify(days))
  }
}

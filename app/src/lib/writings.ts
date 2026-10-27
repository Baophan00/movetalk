import { supabase } from './supabase'

/**
 * Paragraphs on the server. localStorage stays the source of truth on the device; this is the copy
 * that follows the learner to another phone and lets a teacher read it. Every call fails quietly
 * when the table is missing or nobody is signed in.
 */

export type Writing = {
  id: string
  at: number
  level: string
  topic: string
  prompt: string
  body: string
  words: number
}

type Row = {
  id: string
  track: string
  topic: string | null
  prompt: string | null
  body: string
  words: number | null
  created_at: string
}

const LOCAL = 'mt2_writings'

async function me(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export async function saveWriting(input: { level: string; topic: string; prompt: string; body: string; words: number; issues: number }): Promise<boolean> {
  const uid = await me()
  if (!uid) return false
  const { error } = await supabase.from('writings').insert({
    student_id: uid,
    track: input.level,
    topic: input.topic,
    prompt: input.prompt,
    body: input.body,
    words: input.words,
    grammar_issues: input.issues,
  })
  return !error
}

export async function myWritings(): Promise<Writing[]> {
  const uid = await me()
  if (!uid) return []
  const { data, error } = await supabase
    .from('writings')
    .select('id,track,topic,prompt,body,words,created_at')
    .eq('student_id', uid)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return (data as Row[]).map((r) => ({
    id: r.id,
    at: new Date(r.created_at).getTime(),
    level: r.track,
    topic: r.topic ?? '',
    prompt: r.prompt ?? '',
    body: r.body,
    words: r.words ?? r.body.trim().split(/\s+/).filter(Boolean).length,
  }))
}

/** Send anything written while offline (or before the table existed) up to the server once. */
export async function flushLocal(): Promise<void> {
  const uid = await me()
  if (!uid) return
  let rows: { text: string; level?: string; label?: string; at?: string; synced?: boolean }[] = []
  try {
    rows = JSON.parse(localStorage.getItem(LOCAL) ?? '[]')
  } catch {
    return
  }
  const pending = rows.filter((r) => !r.synced && r.text?.trim().length > 20)
  if (!pending.length) return

  const { data, error } = await supabase
    .from('writings')
    .insert(
      pending.map((r) => ({
        student_id: uid,
        track: r.level ?? 'A2',
        topic: r.label ?? '',
        prompt: '',
        body: r.text,
        words: r.text.trim().split(/\s+/).filter(Boolean).length,
      })),
    )
    .select('id')
  if (error || !data) return

  for (const r of pending) r.synced = true
  try {
    localStorage.setItem(LOCAL, JSON.stringify(rows))
  } catch {
    /* storage full: the next write will try again */
  }
}

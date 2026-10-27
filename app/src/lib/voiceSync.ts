import { supabase } from './supabase'

/**
 * Voice answers on the server. A take is uploaded to the private `voice` bucket and a row in
 * `voice_answers` records it, so the teacher hears it from any device. When the bucket or table is
 * missing (or nobody is signed in) every call fails quietly and the browser copy stays the truth.
 */

export type ServerVoice = {
  id: string
  lesson: number
  at: number
  file: string
  heard: boolean
  student?: string
  durationMs: number | null
}

type Row = {
  id: string
  student_id: string
  lesson_no: number
  storage_path: string
  duration_ms: number | null
  heard: boolean
  created_at: string
}

async function me(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

function toVoice(row: Row, file: string, student?: string): ServerVoice {
  return {
    id: row.id,
    lesson: row.lesson_no,
    at: new Date(row.created_at).getTime(),
    file,
    heard: row.heard,
    student,
    durationMs: row.duration_ms,
  }
}

async function signed(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from('voice').createSignedUrls(paths, 60 * 60 * 6)
  if (error || !data) return {}
  const out: Record<string, string> = {}
  for (const item of data) if (item.signedUrl && item.path) out[item.path] = item.signedUrl
  return out
}

export async function uploadVoice(lessonN: number, blob: Blob, durationMs: number | null): Promise<ServerVoice | null> {
  const userId = await me()
  if (!userId) return null
  const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const up = await supabase.storage.from('voice').upload(path, blob, {
    contentType: blob.type || 'audio/webm',
    upsert: false,
  })
  if (up.error) return null

  const { data, error } = await supabase
    .from('voice_answers')
    .insert({ student_id: userId, lesson_no: lessonN, storage_path: path, duration_ms: durationMs })
    .select('id,student_id,lesson_no,storage_path,duration_ms,heard,created_at')
    .single()
  if (error || !data) {
    await supabase.storage.from('voice').remove([path])
    return null
  }

  const urls = await signed([path])
  return toVoice(data as Row, urls[path] ?? '')
}

/** The signed-in learner's own takes, newest first. */
export async function myVoice(): Promise<ServerVoice[]> {
  const userId = await me()
  if (!userId) return []
  const { data, error } = await supabase
    .from('voice_answers')
    .select('id,student_id,lesson_no,storage_path,duration_ms,heard,created_at')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error || !data) return []
  const rows = data as Row[]
  const urls = await signed(rows.map((r) => r.storage_path))
  return rows.map((r) => toVoice(r, urls[r.storage_path] ?? '')).filter((v) => v.file)
}

/** Every learner's takes: the teacher's inbox. */
export async function allVoice(): Promise<ServerVoice[]> {
  const { data, error } = await supabase
    .from('voice_answers')
    .select('id,student_id,lesson_no,storage_path,duration_ms,heard,created_at')
    .order('created_at', { ascending: false })
    .limit(60)
  if (error || !data) return []
  const rows = data as Row[]
  const ids = [...new Set(rows.map((r) => r.student_id))]
  const { data: profiles } = await supabase.from('profiles').select('id,full_name,email').in('id', ids)
  const names: Record<string, string> = {}
  for (const p of profiles ?? []) names[p.id as string] = ((p.full_name as string) || (p.email as string) || 'Student')
  const urls = await signed(rows.map((r) => r.storage_path))
  return rows
    .map((r) => toVoice(r, urls[r.storage_path] ?? '', names[r.student_id] ?? 'Student'))
    .filter((v) => v.file)
}

export async function setHeard(id: string, heard: boolean): Promise<void> {
  await supabase.from('voice_answers').update({ heard }).eq('id', id)
}

export async function deleteVoice(id: string): Promise<void> {
  const { data } = await supabase.from('voice_answers').select('storage_path').eq('id', id).maybeSingle()
  const path = data?.storage_path as string | undefined
  await supabase.from('voice_answers').delete().eq('id', id)
  if (path) await supabase.storage.from('voice').remove([path])
}

/**
 * Voice answers. A recording is kept as a data URL in this browser so a teacher can press play and
 * hear the learner; nothing is uploaded yet — sending audio to the server needs a storage bucket.
 */

export type Voice = { id: string; lesson: number; at: number; file: string; heard?: boolean; note?: string }

const KEY = 'mt2_voice'

export function listVoice(): Voice[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown
    return Array.isArray(raw) ? (raw as Voice[]).filter((v) => v && typeof v.file === 'string') : []
  } catch {
    return []
  }
}

export function addVoice(lesson: number, file: string): Voice[] {
  const next = [{ id: `v${Date.now().toString(36)}`, lesson, at: Date.now(), file }, ...listVoice()]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function setLocalHeard(id: string, heard: boolean): Voice[] {
  const next = listVoice().map((v) => (v.id === id ? { ...v, heard } : v))
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function markHeard(id: string): Voice[] {
  const next = listVoice().map((v) => (v.id === id ? { ...v, heard: !v.heard } : v))
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeVoice(id: string): Voice[] {
  const next = listVoice().filter((v) => v.id !== id)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

/**
 * Notes a tutor keeps on their own calendar: a reminder for a date, a thing to do, a date worth
 * remembering. Kept on the device for now, one list per date, nothing shared with students.
 */

export type Note = { id: string; date: string; text: string; done?: boolean }

const KEY = 'mt2_notes'

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as Note[]) : []
    return Array.isArray(list) ? list.filter((n) => n && typeof n.text === 'string' && typeof n.date === 'string') : []
  } catch {
    return []
  }
}

function save(list: Note[]): Note[] {
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function addNote(list: Note[], date: string, text: string): Note[] {
  const clean = text.trim()
  if (!clean) return list
  return save([...list, { id: `n${Date.now().toString(36)}`, date, text: clean }])
}

export function toggleNote(list: Note[], id: string): Note[] {
  return save(list.map((n) => (n.id === id ? { ...n, done: !n.done } : n)))
}

export function removeNote(list: Note[], id: string): Note[] {
  return save(list.filter((n) => n.id !== id))
}

export function notesOn(list: Note[], date: string): Note[] {
  return list.filter((n) => n.date === date)
}

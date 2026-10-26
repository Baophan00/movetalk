/**
 * The teaching week, as it actually runs: one tutor, twelve 1-1 students, mostly evenings,
 * 30-minute slots, a few trial sessions. These rows are only the starting point: the teacher's
 * own edits live in `teaching.ts`, including one-date changes on top of the weekly template.
 */

export type StudentStatus = 'trial' | 'active' | 'paused'

export type Student = {
  id: string
  name: string
  status: StudentStatus
  note?: string
  email?: string
  /** A1, A2 … shown next to the name, never guessed from progress. */
  level?: string
  /** What they pay per hour, in the currency the tutor quotes. */
  rate?: number
  /** The lesson they are on now, so Open lesson opens the right one. */
  lessonN?: number
}

export type Slot = {
  studentId: string
  /** 0 = Monday … 6 = Sunday */
  weekday: number
  /** minutes from midnight */
  start: number
  end: number
  kind: 'lesson' | 'trial'
}

/** 24 slots — the week of 26 Oct 2026, Monday first, exactly as it runs. Wednesday is free. */
export const WEEK: Slot[] = [
  // Monday 26
  { studentId: 'chi-hien', weekday: 0, start: 9 * 60, end: 10 * 60, kind: 'lesson' },
  { studentId: 'bee', weekday: 0, start: 15 * 60 + 30, end: 16 * 60 + 30, kind: 'lesson' },
  { studentId: 'doan-thao', weekday: 0, start: 17 * 60, end: 18 * 60, kind: 'lesson' },
  { studentId: 'huy', weekday: 0, start: 18 * 60, end: 19 * 60, kind: 'trial' },
  { studentId: 'diem', weekday: 0, start: 19 * 60, end: 20 * 60, kind: 'lesson' },
  { studentId: 'phuong-nhi', weekday: 0, start: 20 * 60, end: 21 * 60, kind: 'lesson' },
  { studentId: 'thi-nho', weekday: 0, start: 21 * 60, end: 22 * 60, kind: 'lesson' },
  { studentId: 'vy', weekday: 0, start: 22 * 60, end: 23 * 60, kind: 'lesson' },
  // Tuesday 27
  { studentId: 'huy', weekday: 1, start: 18 * 60, end: 19 * 60, kind: 'trial' },
  { studentId: 'my-duyen', weekday: 1, start: 19 * 60, end: 20 * 60, kind: 'trial' },
  { studentId: 'ngoc-linh', weekday: 1, start: 21 * 60, end: 22 * 60, kind: 'lesson' },
  // Wednesday 28 — nothing booked
  // Thursday 29
  { studentId: 'thu-hien', weekday: 3, start: 11 * 60, end: 12 * 60, kind: 'lesson' },
  { studentId: 'diem', weekday: 3, start: 16 * 60, end: 17 * 60, kind: 'lesson' },
  { studentId: 'doan-thao', weekday: 3, start: 17 * 60, end: 18 * 60, kind: 'lesson' },
  { studentId: 'vy', weekday: 3, start: 22 * 60, end: 23 * 60, kind: 'lesson' },
  // Friday 30
  { studentId: 'huy', weekday: 4, start: 18 * 60, end: 19 * 60, kind: 'trial' },
  { studentId: 'my-duyen', weekday: 4, start: 19 * 60, end: 20 * 60, kind: 'trial' },
  { studentId: 'phuong-nhi', weekday: 4, start: 20 * 60, end: 21 * 60, kind: 'lesson' },
  { studentId: 'ngoc-linh', weekday: 4, start: 21 * 60, end: 22 * 60, kind: 'lesson' },
  { studentId: 'thi-nho', weekday: 4, start: 22 * 60, end: 23 * 60, kind: 'lesson' },
  // Saturday 31
  { studentId: 'thu-hien', weekday: 5, start: 14 * 60, end: 15 * 60, kind: 'lesson' },
  // Sunday 1 Nov
  { studentId: 'eun-na', weekday: 6, start: 15 * 60, end: 16 * 60, kind: 'lesson' },
  { studentId: 'my-duyen', weekday: 6, start: 19 * 60, end: 20 * 60, kind: 'trial' },
  { studentId: 'ngoc-linh', weekday: 6, start: 20 * 60, end: 21 * 60, kind: 'lesson' },
]

export const STUDENTS: Student[] = [
  { id: 'chi-hien', name: 'Chi Hiền', status: 'active' },
  { id: 'thu-hien', name: 'Thu Hiền', status: 'active' },
  { id: 'bee', name: 'Bee', status: 'active' },
  { id: 'doan-thao', name: 'Doan Thảo', status: 'active' },
  { id: 'diem', name: 'Điểm', status: 'active' },
  { id: 'phuong-nhi', name: 'Phương Nhi', status: 'active' },
  { id: 'thi-nho', name: 'Thị Nhỏ', status: 'active' },
  { id: 'vy', name: 'Vy', status: 'active' },
  { id: 'ngoc-linh', name: 'Ngọc Linh', status: 'active' },
  { id: 'eun-na', name: 'Eun Na', status: 'active' },
  { id: 'huy', name: 'Huy', status: 'trial' },
  { id: 'my-duyen', name: 'Mỹ Duyên', status: 'trial' },
]

export function studentById(id: string) {
  return STUDENTS.find((s) => s.id === id)
}

/** Monday-first week containing `date`, at local midnight. */
export function weekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtHour(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const suffix = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12} ${suffix}`
}

export type Occurrence = Slot & { date: Date; id: string }

/** Every slot in the week that starts on `monday`. */
export function sessionsFor(monday: Date): Occurrence[] {
  return WEEK.map((slot) => {
    const date = addDays(monday, slot.weekday)
    return { ...slot, date, id: `${slot.studentId}-${date.toISOString().slice(0, 10)}-${slot.start}` }
  }).sort((a, b) => a.date.getTime() - b.date.getTime() || a.start - b.start)
}

export function sessionsOn(monday: Date, weekday: number): Occurrence[] {
  return sessionsFor(monday).filter((s) => s.weekday === weekday)
}

/** Total minutes taught in the week, and how many are trials. */
export function weekLoad(monday: Date) {
  const all = sessionsFor(monday)
  const minutes = all.reduce((n, s) => n + (s.end - s.start), 0)
  return { count: all.length, minutes, trials: all.filter((s) => s.kind === 'trial').length }
}

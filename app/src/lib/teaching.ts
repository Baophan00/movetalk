import { STUDENTS, WEEK, type Student, type StudentStatus } from './schedule'

/**
 * Teacher-side working data. Until the classroom backend carries the roster, the teacher edits this
 * on the device: students, one-off session changes and assignments all live here, seeded from the
 * weekly template so the first visit is not empty.
 */

export type Session = { id: string; studentId: string; weekday: number; start: number; end: number; kind: 'lesson' | 'trial'; note?: string }

export type Assignment = {
  id: string
  title: string
  lessonN: number
  studentIds: string[]
  due: string
  status: 'assigned' | 'closed'
}

/** One occurrence changed: the week template stays, this date does not. */
export type Override = { sessionId: string; date: string; cancelled?: boolean; start?: number; end?: number }

export type Teaching = {
  students: Student[]
  sessions: Session[]
  assignments: Assignment[]
  removed: string[]
  overrides: Override[]
}

const KEY = 'mt2_teaching'

function seed(): Teaching {
  return {
    students: STUDENTS.map((s) => ({ ...s })),
    sessions: WEEK.map((s, i) => ({ id: `s${i}`, ...s })),
    assignments: [],
    removed: [],
    overrides: [],
  }
}

export function loadTeaching(): Teaching {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Teaching
    return {
      students: parsed.students ?? seed().students,
      sessions: parsed.sessions ?? seed().sessions,
      assignments: parsed.assignments ?? [],
      removed: parsed.removed ?? [],
      overrides: parsed.overrides ?? [],
    }
  } catch {
    return seed()
  }
}

export function saveTeaching(next: Teaching): Teaching {
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function addStudent(
  t: Teaching,
  name: string,
  status: StudentStatus = 'trial',
  extra: Partial<Student> = {},
): Teaching {
  const clean = name.trim()
  if (!clean) return t
  const student: Student = { id: `n${Date.now().toString(36)}`, status, note: '', lessonN: 1, ...extra, name: clean }
  return saveTeaching({ ...t, students: [...t.students, student] })
}

export function updateStudent(t: Teaching, id: string, patch: Partial<Student>): Teaching {
  return saveTeaching({ ...t, students: t.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
}

/** Removing a student takes their hours and their date changes with them. */
export function removeStudent(t: Teaching, id: string): Teaching {
  const gone = new Set(t.sessions.filter((s) => s.studentId === id).map((s) => s.id))
  return saveTeaching({
    ...t,
    students: t.students.filter((s) => s.id !== id),
    sessions: t.sessions.filter((s) => s.studentId !== id),
    assignments: t.assignments.map((a) => ({ ...a, studentIds: a.studentIds.filter((x) => x !== id) })),
    overrides: t.overrides.filter((o) => !gone.has(o.sessionId)),
  })
}

/** 'YYYY-MM-DD' in local time, the key a date override is stored under. */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function overrideFor(t: Teaching, sessionId: string, date: string): Override | undefined {
  return t.overrides.find((o) => o.sessionId === sessionId && o.date === date)
}

/** What actually happens on that date: the template, unless the date was moved or called off. */
export function occurrence(t: Teaching, s: Session, date: string): { start: number; end: number; cancelled: boolean } {
  const o = overrideFor(t, s.id, date)
  if (!o) return { start: s.start, end: s.end, cancelled: false }
  return { start: o.start ?? s.start, end: o.end ?? s.end, cancelled: Boolean(o.cancelled) }
}

export function setOverride(t: Teaching, next: Override): Teaching {
  const rest = t.overrides.filter((o) => !(o.sessionId === next.sessionId && o.date === next.date))
  return saveTeaching({ ...t, overrides: [...rest, next] })
}

export function clearOverride(t: Teaching, sessionId: string, date: string): Teaching {
  return saveTeaching({ ...t, overrides: t.overrides.filter((o) => !(o.sessionId === sessionId && o.date === date)) })
}

/** A clash only counts when both hours are on the same weekday and neither is called off that date. */
export function clashFor(
  t: Teaching,
  input: { weekday: number; start: number; end: number; date?: string },
  ignoreId?: string,
): Session | undefined {
  return t.sessions.find((s) => {
    if (s.id === ignoreId || s.weekday !== input.weekday) return false
    if (input.date) {
      const occ = occurrence(t, s, input.date)
      if (occ.cancelled) return false
      return input.start < occ.end && occ.start < input.end
    }
    return input.start < s.end && s.start < input.end
  })
}

export function setStudentStatus(t: Teaching, id: string, status: StudentStatus): Teaching {
  return saveTeaching({ ...t, students: t.students.map((s) => (s.id === id ? { ...s, status } : s)) })
}

export function addSession(
  t: Teaching,
  input: { studentId: string; weekday: number; start: number; end: number; kind: 'lesson' | 'trial' },
): Teaching {
  const clash = clashFor(t, input)
  if (clash) return t
  const session: Session = { id: `n${Date.now().toString(36)}`, ...input }
  return saveTeaching({ ...t, sessions: [...t.sessions, session] })
}

export function removeSession(t: Teaching, id: string): Teaching {
  return saveTeaching({ ...t, sessions: t.sessions.filter((s) => s.id !== id) })
}

export function addAssignment(
  t: Teaching,
  input: { title: string; lessonN: number; studentIds: string[]; due: string },
): Teaching & { assignment: Assignment } {
  const assignment: Assignment = {
    id: `a${Date.now().toString(36)}`,
    title: input.title.trim() || `Lesson ${input.lessonN}`,
    lessonN: input.lessonN,
    studentIds: input.studentIds,
    due: input.due,
    status: 'assigned',
  }
  const next = saveTeaching({ ...t, assignments: [assignment, ...t.assignments] })
  return { ...next, assignment }
}

export function setAssignmentStatus(t: Teaching, id: string, status: 'assigned' | 'closed'): Teaching {
  return saveTeaching({ ...t, assignments: t.assignments.map((a) => (a.id === id ? { ...a, status } : a)) })
}

export function removeAssignment(t: Teaching, id: string): Teaching {
  return saveTeaching({ ...t, assignments: t.assignments.filter((a) => a.id !== id) })
}

/** '09:00' -> 540 */
export function hhmmToMin(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Every date in the month that falls on this weekday. */
function datesOfWeekday(ref: Date, weekday: number): Date[] {
  const out: Date[] = []
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  for (let day = 1; day <= last; day++) {
    const d = new Date(ref.getFullYear(), ref.getMonth(), day)
    if ((d.getDay() + 6) % 7 === weekday) out.push(d)
  }
  return out
}

/** Hours this student is actually booked for in the month, called-off dates taken out. */
export function monthHours(t: Teaching, studentId: string, ref: Date = new Date()): number {
  let minutes = 0
  for (const s of t.sessions.filter((x) => x.studentId === studentId)) {
    for (const d of datesOfWeekday(ref, s.weekday)) {
      const occ = occurrence(t, s, isoDate(d))
      if (!occ.cancelled) minutes += occ.end - occ.start
    }
  }
  return minutes / 60
}

/** What the month is worth at each student's own rate; rate is stored in đồng. */
export function monthEarnings(t: Teaching, ref: Date = new Date()): { total: number; rows: { student: Student; hours: number; amount: number }[] } {
  const rows = t.students
    .map((student) => {
      const hours = monthHours(t, student.id, ref)
      const amount = Math.round(hours * (student.rate ?? 0))
      return { student, hours, amount }
    })
    .sort((a, b) => b.amount - a.amount)
  return { total: rows.reduce((n, r) => n + r.amount, 0), rows }
}

/** 180000 -> "180.000₫" */
export function vnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}₫`
}

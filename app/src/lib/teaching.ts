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

export type Teaching = {
  students: Student[]
  sessions: Session[]
  assignments: Assignment[]
  removed: string[]
}

const KEY = 'mt2_teaching'

function seed(): Teaching {
  return {
    students: STUDENTS.map((s) => ({ ...s })),
    sessions: WEEK.map((s, i) => ({ id: `s${i}`, ...s })),
    assignments: [],
    removed: [],
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
    }
  } catch {
    return seed()
  }
}

export function saveTeaching(next: Teaching): Teaching {
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function addStudent(t: Teaching, name: string, status: StudentStatus = 'trial'): Teaching {
  const clean = name.trim()
  if (!clean) return t
  const student: Student = { id: `n${Date.now().toString(36)}`, name: clean, status, note: '' }
  return saveTeaching({ ...t, students: [...t.students, student] })
}

export function setStudentStatus(t: Teaching, id: string, status: StudentStatus): Teaching {
  return saveTeaching({ ...t, students: t.students.map((s) => (s.id === id ? { ...s, status } : s)) })
}

export function addSession(
  t: Teaching,
  input: { studentId: string; weekday: number; start: number; end: number; kind: 'lesson' | 'trial' },
): Teaching {
  const clash = t.sessions.find((s) => s.weekday === input.weekday && input.start < s.end && s.start < input.end)
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

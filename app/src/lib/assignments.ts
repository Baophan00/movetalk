import { supabase } from './supabase'

/**
 * Assignments that travel between two accounts: the teacher writes one, the student sees it in
 * Homework. Both sides read the same table, so the browser is no longer the only copy.
 */

export type Account = { id: string; name: string; email: string }

export type Assigned = {
  id: string
  title: string
  lessonN: number
  due: string | null
  status: 'assigned' | 'closed'
  teacher?: string
}

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from('profiles').select('id,email,full_name,role').eq('role', 'student')
  if (error || !data) return []
  return data.map((p) => ({ id: p.id as string, name: (p.full_name as string) || (p.email as string), email: p.email as string }))
}

export async function createAssignmentFor(input: {
  title: string
  lessonN: number
  due: string
  studentIds: string[]
  instructions?: string
}): Promise<{ ok: boolean; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const teacherId = sessionData.session?.user.id
  if (!teacherId) return { ok: false, error: 'Sign in as the teacher to send this.' }

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      teacher_id: teacherId,
      title: input.title,
      instructions: input.instructions ?? '',
      kind: 'lesson',
      lesson_track: 'A1',
      lesson_no: input.lessonN,
      due_at: input.due || null,
      status: 'published',
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Could not save the assignment.' }

  if (input.studentIds.length) {
    const rows = input.studentIds.map((studentId) => ({ assignment_id: data.id as string, student_id: studentId }))
    const { error: linkError } = await supabase.from('assignment_recipients').insert(rows)
    if (linkError) return { ok: false, error: linkError.message }
  }
  return { ok: true }
}

/** Everything handed to the signed-in student, soonest first. */
export async function myAssignments(): Promise<Assigned[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  const me = sessionData.session?.user.id
  if (!me) return []

  const { data, error } = await supabase
    .from('assignment_recipients')
    .select('assignment:assignments(id,title,lesson_no,due_at,status,kind)')
    .eq('student_id', me)

  if (error || !data) return []
  const rows = (data as unknown as { assignment: Record<string, unknown> | null }[])
    .map((r) => r.assignment)
    .filter((a): a is Record<string, unknown> => Boolean(a) && (a as Record<string, unknown>).status !== 'draft')
    .filter((a) => a.kind === 'lesson' && typeof a.lesson_no === 'number')

  return rows
    .map((a) => ({
      id: a.id as string,
      title: (a.title as string) ?? '',
      lessonN: a.lesson_no as number,
      due: (a.due_at as string) ?? null,
      status: (a.status as string) === 'closed' ? ('closed' as const) : ('assigned' as const),
    }))
    .sort((x, y) => (x.due ?? '9999').localeCompare(y.due ?? '9999'))
}

export async function closeAssignment(id: string): Promise<boolean> {
  const { error } = await supabase.from('assignments').update({ status: 'closed' }).eq('id', id)
  return !error
}

export type TeacherAssignment = Assigned & { students: number }

/** The teacher's own list, newest first, with how many students it went to. */
export async function teacherAssignments(): Promise<TeacherAssignment[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  const me = sessionData.session?.user.id
  if (!me) return []
  const { data, error } = await supabase
    .from('assignments')
    .select('id,title,lesson_no,due_at,status,assignment_recipients(count)')
    .eq('teacher_id', me)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map((a) => {
    const rec = a.assignment_recipients as { count?: number }[] | undefined
    return {
      id: a.id as string,
      title: (a.title as string) ?? '',
      lessonN: (a.lesson_no as number) ?? 1,
      due: (a.due_at as string) ?? null,
      status: (a.status as string) === 'closed' ? ('closed' as const) : ('assigned' as const),
      students: rec?.[0]?.count ?? 0,
    }
  })
}

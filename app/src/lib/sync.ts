import { supabase } from './supabase'
import { A1, partPlan } from './curriculum'
import { mergeProgress } from './progress'

const TRACK = 'A1'

type Row = { lesson_no: number; part: string }

/** Read what this account has already opened, and fold it into the local cache. */
export async function pullProgress(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) return
  const { data, error } = await supabase.from('lesson_progress').select('lesson_no,part').eq('student_id', userId).eq('track', TRACK)
  if (error || !data) return

  const rows = data as Row[]
  const merged: Record<number, number[]> = {}
  for (const row of rows) {
    const lesson = A1.find((l) => l.n === row.lesson_no)
    if (!lesson) continue
    const index = partPlan(lesson).findIndex((p) => p.key === row.part)
    if (index < 0) continue
    merged[lesson.n] = [...(merged[lesson.n] ?? []), index]
  }
  mergeProgress(merged)
}

/** Record one opened part against the account. Silent: progress in the browser must not depend on it. */
export async function pushPart(lessonN: number, partKey: string): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return
  await supabase
    .from('lesson_progress')
    .upsert(
      { student_id: userId, track: TRACK, lesson_no: lessonN, part: partKey },
      { onConflict: 'student_id,track,lesson_no,part', ignoreDuplicates: true },
    )
}

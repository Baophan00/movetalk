import { supabase } from './supabase'
import { mergeUnlocked } from './access'

/**
 * Lessons opened for an account. The teacher's switch writes a row, the learner's Lessons page
 * reads it back on the next sign-in. Without a session (or before the table exists) the local
 * list stays the only copy, so nothing breaks.
 */

const TRACK = 'A1'

async function me(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export async function pullUnlocks(): Promise<number[]> {
  const userId = await me()
  if (!userId) return []
  const { data, error } = await supabase
    .from('lesson_unlocks')
    .select('lesson_no')
    .eq('student_id', userId)
    .eq('track', TRACK)
  if (error || !data) return []
  const list = data.map((r) => r.lesson_no as number)
  mergeUnlocked(list)
  return list
}

export async function pushUnlock(lessonN: number): Promise<void> {
  const userId = await me()
  if (!userId) return
  await supabase
    .from('lesson_unlocks')
    .upsert(
      { student_id: userId, track: TRACK, lesson_no: lessonN, unlocked_by: userId },
      { onConflict: 'student_id,track,lesson_no', ignoreDuplicates: true },
    )
}

export async function removeUnlock(lessonN: number): Promise<void> {
  const userId = await me()
  if (!userId) return
  await supabase.from('lesson_unlocks').delete().eq('student_id', userId).eq('track', TRACK).eq('lesson_no', lessonN)
}

import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'teacher' | 'student'
export type Profile = { id: string; email: string; name: string; role: Role }

/** The role comes from the profiles table; anything unreadable is a student, never a teacher. */
export async function loadProfile(session: Session): Promise<Profile> {
  const fallback: Profile = {
    id: session.user.id,
    email: session.user.email ?? '',
    name: (session.user.user_metadata?.full_name as string | undefined) ?? (session.user.email ?? '').split('@')[0],
    role: 'student',
  }
  const { data, error } = await supabase.from('profiles').select('id,email,full_name,role').eq('id', session.user.id).maybeSingle()
  if (error || !data) return fallback
  return {
    id: data.id as string,
    email: (data.email as string) ?? fallback.email,
    name: (data.full_name as string) ?? fallback.name,
    role: data.role === 'teacher' ? 'teacher' : 'student',
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) return { error: error.message, session: null }
  return { error: null, session: data.session }
}

/**
 * The first account on the project becomes the teacher (a database trigger decides that, not this
 * call), so a signup only asks for a name — there is nothing to claim.
 */
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: fullName.trim() } },
  })
  if (error) return { error: error.message, session: null }
  return { error: null, session: data.session }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function currentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

import { createClient } from '@supabase/supabase-js'

/**
 * Same Supabase project the older single-file app uses. The publishable key is public by design:
 * role and permissions are decided in Postgres (profiles + RLS), never by what this file says.
 */
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? 'https://fdqjvbarvjrmjlquarva.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? 'sb_publishable__IxBBWQ6scn7W4rO--TeyQ_lLjnPhDW'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

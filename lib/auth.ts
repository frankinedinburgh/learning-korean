import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabase-server'

// lib/auth.ts
export async function requireUser() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

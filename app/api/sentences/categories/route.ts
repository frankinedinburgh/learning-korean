import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SentencesRepository } from '@/lib/repositories/sentence'
import { withErrorHandling, withLogging } from '@/lib/api-helper'

// GET /api/sentences/categories — lightweight category/subcategory counts
// for the practice page's filter pills
export async function GET() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return withErrorHandling(
    withLogging(() => SentencesRepository.getCategorySummary(user.id), 'getSentenceCategorySummary')
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CardsRepository } from '@/lib/repositories/card'
import { withErrorHandling, withLogging } from '@/lib/api-helper'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 200

// GET /api/cards/page — paginated deck browsing (category pills use a
// separate lightweight summary; this only feeds the scrolling card grid)
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? undefined
  const subcategory = searchParams.get('subcategory') ?? undefined
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT))

  return withErrorHandling(
    withLogging(
      () => CardsRepository.getCardsPage(user.id, { category, subcategory, offset, limit }),
      'getCardsPage'
    )
  )
}

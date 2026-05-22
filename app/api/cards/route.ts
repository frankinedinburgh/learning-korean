import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CardsRepository } from '@/lib/repositories/card'
import { withErrorHandling } from '@/lib/api-helper'

// GET /api/cards — fetch user's cards with review state
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // Fetch cards

  return withErrorHandling(() =>
    CardsRepository.getCards(user.id, {
      dueOnly: searchParams.get('due') === 'true',
      category: searchParams.get('category') ?? undefined,
    })
  )
}

// POST /api/cards — create a new card
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { korean, english, romanization, category, is_public } = body

  if (!korean || !english) {
    return NextResponse.json({ error: 'korean and english are required' }, { status: 400 })
  }

  return withErrorHandling(
    () =>
      CardsRepository.createCard(user.id, {
        korean,
        english,
        romanization,
        category,
        is_public,
      }),
    201
  )
}

// DELETE /api/cards?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  return withErrorHandling(() => CardsRepository.deleteCard(user.id, id))
}

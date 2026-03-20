import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/cards — fetch user's cards with review state
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dueOnly = searchParams.get('due') === 'true'
  const category = searchParams.get('category')

  // Fetch cards
  let query = supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data: cards, error: cardsError } = await query
  if (cardsError) return NextResponse.json({ error: cardsError.message }, { status: 500 })

  // Fetch reviews for this user
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.id)

  const reviewMap = new Map(reviews?.map(r => [r.card_id, r]) ?? [])

  const now = new Date().toISOString()

  let result = (cards ?? []).map(card => ({
    ...card,
    review: reviewMap.get(card.id) ?? null,
  }))

  if (dueOnly) {
    result = result.filter(c => {
      const due = c.review?.due ?? now
      return due <= now
    })
  }

  return NextResponse.json(result)
}

// POST /api/cards — create a new card
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { korean, english, romanization, category, is_public } = body

  if (!korean || !english) {
    return NextResponse.json({ error: 'korean and english are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cards')
    .insert({
      user_id: user.id,
      korean,
      english,
      romanization: romanization ?? null,
      category: category ?? 'general',
      is_public: is_public ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/cards?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

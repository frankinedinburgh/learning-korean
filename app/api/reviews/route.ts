import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { scheduleCard } from '@/lib/srs'
import type { Rating, ReviewState } from '@/lib/srs'

// POST /api/reviews — submit a rating for a card
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { card_id, rating } = body as { card_id: string; rating: Rating }

  if (!card_id || !rating) {
    return NextResponse.json({ error: 'card_id and rating are required' }, { status: 400 })
  }

  // Get existing review state or use defaults
  const { data: existing } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', card_id)
    .single()

  const currentState: ReviewState = existing ?? {
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    due: new Date().toISOString(),
    stage: 'new',
  }

  const nextState = scheduleCard(currentState, rating)

  // Upsert review
  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      user_id: user.id,
      card_id,
      ...nextState,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,card_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// GET /api/reviews/stats — get SRS distribution counts
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('stage')
    .eq('user_id', user.id)

  const { data: totalCards } = await supabase
    .from('cards')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  const counts = { new: 0, learning: 0, review: 0, mastered: 0 }
  reviews?.forEach(r => {
    if (r.stage in counts) counts[r.stage as keyof typeof counts]++
  })

  // Cards with no review record are "new"
  const reviewedCount = (reviews?.length ?? 0)
  const totalCount = totalCards?.length ?? 0
  counts.new += Math.max(0, totalCount - reviewedCount)

  const now = new Date().toISOString()
  const { data: dueReviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .lte('due', now)

  return NextResponse.json({
    counts,
    total: totalCount,
    due: (dueReviews?.length ?? 0) + Math.max(0, totalCount - reviewedCount),
  })
}

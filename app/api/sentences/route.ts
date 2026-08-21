import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SentencesRepository } from '@/lib/repositories/sentence'
import { withErrorHandling, withLogging } from '@/lib/api-helper'

// GET /api/sentences — fetch user's sentences for practice
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  return withErrorHandling(
    withLogging(
      () =>
        SentencesRepository.getSentences(user.id, {
          category: searchParams.get('category') ?? undefined,
          subcategory: searchParams.get('subcategory') ?? undefined,
        }),
      'getSentences'
    )
  )
}

// POST /api/sentences — create a new sentence
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { korean, english, chunks, decoy_chunks, category, subcategory } = body

  if (!korean || !english || !Array.isArray(chunks) || chunks.length === 0) {
    return NextResponse.json(
      { error: 'korean, english, and at least one chunk are required' },
      { status: 400 }
    )
  }

  return withErrorHandling(
    withLogging(
      () =>
        SentencesRepository.createSentence(user.id, {
          korean,
          english,
          chunks,
          decoy_chunks: Array.isArray(decoy_chunks) ? decoy_chunks : [],
          category,
          subcategory: subcategory || null,
        }),
      'createSentence'
    ),
    201
  )
}

// DELETE /api/sentences?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  return withErrorHandling(
    withLogging(() => SentencesRepository.deleteSentence(user.id, id), 'deleteSentence'),
    204
  )
}

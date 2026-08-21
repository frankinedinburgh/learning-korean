import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { CardWithReview, Card } from '@/lib/types'
import { fetchAllRows } from '@/lib/supabase-pagination'

type CreateCardData = Omit<
  Card,
  'created_at' | 'id' | 'user_id' | 'example_present' | 'example_past' | 'example_future'
> &
  Partial<Pick<Card, 'example_present' | 'example_past' | 'example_future'>>

export const CardsRepository = {
  async getCards(
    userId: string,
    options?: { dueOnly?: boolean; category?: string; subcategory?: string }
  ): Promise<CardWithReview[]> {
    const supabase = createServerSupabaseClient()

    const [cards, { data: reviews }] = await Promise.all([
      fetchAllRows<Card>((from, to) => {
        let cardQuery = supabase
          .from('cards')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .range(from, to)

        if (options?.category) cardQuery = cardQuery.eq('category', options.category)
        if (options?.subcategory) cardQuery = cardQuery.eq('subcategory', options.subcategory)
        return cardQuery
      }),
      supabase.from('reviews').select('*').eq('user_id', userId),
    ])

    const reviewMap = new Map(reviews?.map((r) => [r.card_id, r]) ?? [])
    const now = new Date().toISOString()

    let result = cards.map((card) => ({
      ...card,
      review: reviewMap.get(card.id) ?? null,
    }))

    if (options?.dueOnly) {
      result = result.filter((c) => (c.review?.due ?? now) <= now)
    }

    return result
  },

  // Flat rows — the client groups these into a category -> subcategories tree.
  async getCategorySummary(
    userId: string
  ): Promise<{ category: string; subcategory: string | null; count: number }[]> {
    const supabase = createServerSupabaseClient()

    const rows = await fetchAllRows<{ category: string; subcategory: string | null }>((from, to) =>
      supabase.from('cards').select('category, subcategory').eq('user_id', userId).range(from, to)
    )

    const counts = new Map<string, { category: string; subcategory: string | null; count: number }>()
    for (const { category, subcategory } of rows) {
      const key = JSON.stringify([category, subcategory])
      const existing = counts.get(key)
      if (existing) existing.count++
      else counts.set(key, { category, subcategory, count: 1 })
    }

    return Array.from(counts.values()).sort(
      (a, b) =>
        a.category.localeCompare(b.category) || (a.subcategory ?? '').localeCompare(b.subcategory ?? '')
    )
  },

  async getCardsPage(
    userId: string,
    options: { category?: string; subcategory?: string; offset: number; limit: number }
  ): Promise<{ cards: CardWithReview[]; hasMore: boolean }> {
    const supabase = createServerSupabaseClient()

    let cardQuery = supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      // fetch one extra row so we can tell if there's a next page
      .range(options.offset, options.offset + options.limit)

    if (options.category && options.category !== 'all') {
      cardQuery = cardQuery.eq('category', options.category)
    }
    if (options.subcategory) {
      cardQuery = cardQuery.eq('subcategory', options.subcategory)
    }

    const { data, error } = await cardQuery
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const hasMore = rows.length > options.limit
    const pageCards = hasMore ? rows.slice(0, options.limit) : rows

    const ids = pageCards.map((c) => c.id)
    const { data: reviews } = ids.length
      ? await supabase.from('reviews').select('*').eq('user_id', userId).in('card_id', ids)
      : { data: [] }

    const reviewMap = new Map(reviews?.map((r) => [r.card_id, r]) ?? [])

    return {
      cards: pageCards.map((card) => ({ ...card, review: reviewMap.get(card.id) ?? null })),
      hasMore,
    }
  },

  async getCardsForExport(
    userId: string,
    category?: string,
    subcategory?: string
  ): Promise<Pick<Card, 'korean' | 'english' | 'romanization' | 'category' | 'subcategory'>[]> {
    const supabase = createServerSupabaseClient()

    return fetchAllRows((from, to) => {
      let query = supabase
        .from('cards')
        .select('korean, english, romanization, category, subcategory')
        .eq('user_id', userId)
        .order('category')
        .order('subcategory')
        .order('korean')
        .range(from, to)

      if (category && category !== 'all') query = query.eq('category', category)
      if (subcategory) query = query.eq('subcategory', subcategory)
      return query
    })
  },

  async createCard(userId: string, data: CreateCardData) {
    const supabase = createServerSupabaseClient()
    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        user_id: userId,
        korean: data.korean,
        english: data.english,
        romanization: data.romanization ?? null,
        category: data.category ?? 'general',
        subcategory: data.subcategory ?? null,
        is_public: data.is_public ?? false,
        example_present: data.example_present ?? null,
        example_past: data.example_past ?? null,
        example_future: data.example_future ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('This card already exists in this category.')
      }
      throw new Error(error.message)
    }
    return card
  },

  async deleteCard(userId: string, cardId: string): Promise<void> {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { CardWithReview, Card } from '@/lib/types'

type CreateCardData = Omit<Card, 'created_at' | 'id' | 'user_id'> 

export const CardsRepository = {
  async getCards(
    userId: string,
    options?: { dueOnly?: boolean; category?: string }
  ): Promise<CardWithReview[]> {
    const supabase = createServerSupabaseClient()

    let cardQuery = supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (options?.category) cardQuery = cardQuery.eq('category', options.category)

    const [{ data: cards, error }, { data: reviews }] = await Promise.all([
      cardQuery,
      supabase.from('reviews').select('*').eq('user_id', userId),
    ])

    if (error) throw new Error(error.message)

    const reviewMap = new Map(reviews?.map((r) => [r.card_id, r]) ?? [])
    const now = new Date().toISOString()

    let result = (cards ?? []).map((card) => ({
      ...card,
      review: reviewMap.get(card.id) ?? null,
    }))

    if (options?.dueOnly) {
      result = result.filter((c) => (c.review?.due ?? now) <= now)
    }

    return result
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
        is_public: data.is_public ?? false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
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

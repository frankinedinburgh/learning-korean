import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Sentence } from '@/lib/types'
import { fetchAllRows } from '@/lib/supabase-pagination'

type CreateSentenceData = Omit<Sentence, 'created_at' | 'id' | 'user_id'>

export const SentencesRepository = {
  async getSentences(
    userId: string,
    options?: { category?: string; subcategory?: string }
  ): Promise<Sentence[]> {
    const supabase = createServerSupabaseClient()

    return fetchAllRows<Sentence>((from, to) => {
      let query = supabase
        .from('sentences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range(from, to)

      if (options?.category) query = query.eq('category', options.category)
      if (options?.subcategory) query = query.eq('subcategory', options.subcategory)
      return query
    })
  },

  async getCategorySummary(
    userId: string
  ): Promise<{ category: string; subcategory: string | null; count: number }[]> {
    const supabase = createServerSupabaseClient()

    const rows = await fetchAllRows<{ category: string; subcategory: string | null }>((from, to) =>
      supabase.from('sentences').select('category, subcategory').eq('user_id', userId).range(from, to)
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

  async createSentence(userId: string, data: CreateSentenceData) {
    const supabase = createServerSupabaseClient()
    const { data: sentence, error } = await supabase
      .from('sentences')
      .insert({
        user_id: userId,
        korean: data.korean,
        english: data.english,
        chunks: data.chunks,
        decoy_chunks: data.decoy_chunks ?? [],
        category: data.category ?? 'general',
        subcategory: data.subcategory ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return sentence
  },

  async deleteSentence(userId: string, sentenceId: string): Promise<void> {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('sentences')
      .delete()
      .eq('id', sentenceId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },
}

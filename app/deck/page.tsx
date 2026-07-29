import Nav from '@/components/Nav'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { CardsRepository } from '@/lib/repositories/card'
import DeckClient from './DeckClient'

const PAGE_SIZE = 100

export default async function DeckPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [categories, { cards: initialCards, hasMore }] = await Promise.all([
    CardsRepository.getCategorySummary(user.id),
    CardsRepository.getCardsPage(user.id, { offset: 0, limit: PAGE_SIZE }),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />
      <DeckClient
        initialCards={initialCards}
        initialCategories={categories}
        initialHasMore={hasMore}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}

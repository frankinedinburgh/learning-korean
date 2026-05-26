import Nav from '@/components/Nav'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { CardsRepository } from '@/lib/repositories/card'
import DeckClient from './DeckClient'

export default async function DeckPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const initialCards = await CardsRepository.getCards(user.id)

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />
      <DeckClient initialCards={initialCards} />
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Nav from '@/components/Nav'
import Flashcard from '@/components/Flashcard'
import type { CardWithReview } from '@/lib/types'

export default function StudyPage() {
  const [dueCards, setDueCards] = useState<CardWithReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionDone, setSessionDone] = useState(0)
  const [loading, setLoading] = useState(true)
  const [totalDue, setTotalDue] = useState(0)

  const fetchDueCards = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/cards?due=true')
    const data = await res.json()
    setDueCards(data)
    setTotalDue(data.length)
    setCurrentIndex(0)
    setSessionDone(0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchDueCards() }, [fetchDueCards])

  async function handleRate(rating: 1 | 2 | 3 | 4) {
    const card = dueCards[currentIndex]
    if (!card) return

    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, rating }),
    })

    if (rating === 1) {
      // Requeue card near end
      const newCards = [...dueCards]
      const [removed] = newCards.splice(currentIndex, 1)
      newCards.push(removed)
      setDueCards(newCards)
    } else {
      setSessionDone(d => d + 1)
      setCurrentIndex(i => i + 1)
    }
  }

  const card = dueCards[currentIndex]
  const isDone = !loading && (!card || currentIndex >= dueCards.length)
  const progress = totalDue > 0 ? (sessionDone / totalDue) * 100 : 0

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav dueCount={Math.max(0, totalDue - sessionDone)} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-8 relative z-10">

        {loading && (
          <div className="text-muted text-sm tracking-widest uppercase animate-pulse">
            Loading cards...
          </div>
        )}

        {!loading && isDone && (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-6xl">🎉</div>
            <h2 className="font-serif text-4xl italic text-white">All done for today!</h2>
            <p className="text-muted text-sm">Your reviews are up to date.</p>
            <button
              onClick={fetchDueCards}
              className="mt-4 border border-accent text-accent text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-accent/10 transition-all"
            >
              Refresh
            </button>
          </div>
        )}

        {!loading && !isDone && card && (
          <>
            {/* Progress */}
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-xs text-muted text-center tracking-widest uppercase">
                Card <span className="text-accent">{currentIndex + 1}</span> of <span className="text-accent">{dueCards.length}</span> due today
              </p>
              <div className="h-0.5 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #7c6af7, #e8c547)',
                  }}
                />
              </div>
            </div>

            <Flashcard key={card.id} card={card} onRate={handleRate} />
          </>
        )}
      </main>
    </div>
  )
}

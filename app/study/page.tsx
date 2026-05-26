'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Flashcard from '@/components/Flashcard'
import { StudySessionFactory } from '@/lib/study-session-factory'
import type { CardWithReview } from '@/lib/types'

type SessionState =
  | { status: 'loading' }
  | { status: 'active'; cards: CardWithReview[]; index: number; done: number; isFlipped: boolean }
  | { status: 'complete'; total: number }

function StudyPageContent() {
  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void>()
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const searchParams = useSearchParams()
  const category = searchParams.get('category')

  // 3. The actual listener is a stable wrapper — registers ONCE, never recreated
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      handleKeyDownRef.current?.(e) // always calls the LATEST version
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // ← empty array, registers once on mount

  const fetchDueCards = useCallback(async () => {
    const { endpoint } = category
      ? StudySessionFactory.byCategory(category)
      : StudySessionFactory.allDue()
    const res = await fetch(endpoint)
    const data = await res.json()
    setSession({ status: 'active', cards: data, index: 0, done: 0, isFlipped: false })
  }, [category])

  useEffect(() => {
    fetchDueCards()
  }, [fetchDueCards])

  const handleRate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (session.status !== 'active') return
      const card = session.cards[session.index]
      if (!card) return

      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, rating }),
      })
      setSession((prev) => {
        if (prev.status !== 'active') return prev
        if (rating === 1) {
          const newCards = [...prev.cards]
          const [removed] = newCards.splice(prev.index, 1)
          newCards.push(removed)
          return { ...prev, cards: newCards, isFlipped: false }
        }
        const newIndex = prev.index + 1
        if (newIndex >= prev.cards.length) {
          return { status: 'complete', total: prev.done + 1 } // ← transition here
        }
        return { ...prev, index: newIndex, done: prev.done + 1, isFlipped: false }
      })
    },
    [session]
  )

  // 2. Update the ref on EVERY render (no deps needed — runs every time)
  //    This line is NOT a hook call, just an assignment in the component body
  handleKeyDownRef.current = (e: KeyboardEvent) => {
    if (session.status !== 'active') return
    if (e.key === ' ') {
      e.preventDefault()
      setSession((prev) => (prev.status === 'active' ? { ...prev, isFlipped: true } : prev))
    }
    if (session.isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
      handleRate(Number(e.key) as 1 | 2 | 3 | 4)
    }
  }

  const card = session.status === 'active' ? session.cards[session.index] : null
  const isDone = session.status === 'complete'
  const progress =
    session.status === 'active' && session.cards.length > 0
      ? (session.done / session.cards.length) * 100
      : 0

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav
        dueCount={Math.max(
          0,
          session.status === 'active' ? session.cards.length - session.done : 0
        )}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-8 relative z-10">
        {session.status === 'loading' && (
          <div className="text-muted text-sm tracking-widest uppercase animate-pulse">
            Loading cards...
          </div>
        )}

        {isDone && (
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

        {session.status === 'active' && !isDone && card && (
          <>
            {/* Progress */}
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-xs text-muted text-center tracking-widest uppercase">
                Card <span className="text-accent">{session.index + 1}</span> of{' '}
                <span className="text-accent">{session.cards.length}</span> due today
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

            <Flashcard
              key={card.id}
              card={card}
              onRate={handleRate}
              isFlipped={session.isFlipped}
              onFlip={() => setSession({ ...session, isFlipped: true })}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <StudyPageContent />
    </Suspense>
  )
}

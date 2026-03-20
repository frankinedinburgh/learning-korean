'use client'

import { useState } from 'react'
import type { CardWithReview } from '@/lib/types'

interface FlashcardProps {
  card: CardWithReview
  onRate: (rating: 1 | 2 | 3 | 4) => void
}

export default function Flashcard({ card, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    if (!flipped) setFlipped(true)
  }

  function handleRate(rating: 1 | 2 | 3 | 4) {
    setFlipped(false)
    setTimeout(() => onRate(rating), 100)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Card */}
      <div
        className="card-scene w-full h-72 cursor-pointer"
        onClick={handleFlip}
        role="button"
        aria-label="Flip card"
      >
        <div className={`card-inner w-full h-full relative ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="card-face absolute inset-0 rounded-2xl border border-border bg-surface flex flex-col items-center justify-center gap-3 p-8"
            style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(124,106,247,0.08) 0%, transparent 60%), #16161a' }}>
            <span className="absolute top-4 right-4 text-xs uppercase tracking-widest text-muted bg-surface2 border border-border px-3 py-1 rounded-full">
              {card.category}
            </span>
            <p className="text-xs uppercase tracking-widest text-muted">Korean</p>
            <p className="font-korean text-5xl font-bold text-white leading-tight text-center">
              {card.korean}
            </p>
            <p className="text-xs text-muted mt-4 tracking-widest">click to reveal</p>
          </div>

          {/* Back */}
          <div className="card-face card-back-face absolute inset-0 rounded-2xl border border-border flex flex-col items-center justify-center gap-3 p-8"
            style={{ background: 'radial-gradient(ellipse at 70% 80%, rgba(232,197,71,0.07) 0%, transparent 60%), #1e1e24' }}>
            <span className="absolute top-4 right-4 text-xs uppercase tracking-widest text-muted bg-surface border border-border px-3 py-1 rounded-full">
              {card.category}
            </span>
            <p className="text-xs uppercase tracking-widest text-muted">English</p>
            <p className="font-serif text-3xl italic text-white text-center leading-snug">
              {card.english}
            </p>
            {card.romanization && (
              <p className="text-accent2 text-sm tracking-wide">{card.romanization}</p>
            )}
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div className={`flex gap-3 transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
        {([
          { rating: 1, label: 'Again', color: 'border-red-400 text-red-400 hover:bg-red-400/10' },
          { rating: 2, label: 'Hard', color: 'border-muted text-muted hover:bg-white/5' },
          { rating: 3, label: 'Good', color: 'border-accent text-accent hover:bg-accent/10' },
          { rating: 4, label: 'Easy', color: 'border-green-400 text-green-400 hover:bg-green-400/10' },
        ] as const).map(({ rating, label, color }) => (
          <button
            key={rating}
            onClick={() => handleRate(rating as 1 | 2 | 3 | 4)}
            className={`border rounded-xl px-6 py-2.5 text-xs uppercase tracking-widest font-mono transition-all hover:-translate-y-0.5 ${color}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

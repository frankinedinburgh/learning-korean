'use client'

import { useMemo, useState } from 'react'
import type { Sentence } from '@/lib/types'
import { shuffle } from '@/lib/utils'

interface Tile {
  id: string
  text: string
}

interface SentenceScrambleProps {
  sentence: Sentence
  onComplete: (correct: boolean) => void
}

export default function SentenceScramble({ sentence, onComplete }: SentenceScrambleProps) {
  const [bank, setBank] = useState<Tile[]>(() =>
    shuffle([...sentence.chunks, ...sentence.decoy_chunks]).map((text, i) => ({
      id: `${text}-${i}`,
      text,
    }))
  )
  const [placed, setPlaced] = useState<Tile[]>([])
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)

  const correctAnswer = useMemo(() => sentence.chunks.join(' '), [sentence])

  function placeTile(tile: Tile) {
    if (result) return
    setBank((prev) => prev.filter((t) => t.id !== tile.id))
    setPlaced((prev) => [...prev, tile])
  }

  function returnTile(tile: Tile) {
    if (result) return
    setPlaced((prev) => prev.filter((t) => t.id !== tile.id))
    setBank((prev) => [...prev, tile])
  }

  function handleCheck() {
    const isCorrect = JSON.stringify(placed.map((t) => t.text)) === JSON.stringify(sentence.chunks)
    setResult(isCorrect ? 'correct' : 'incorrect')
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="w-full bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
        <p className="text-xs uppercase tracking-widest text-muted">Translate this sentence</p>
        <p className="font-serif text-xl italic text-white">{sentence.english}</p>

        {/* Answer strip */}
        <div className="min-h-[3.5rem] flex flex-wrap gap-2 items-start border-b border-border pb-4">
          {placed.length === 0 && (
            <span className="text-muted text-sm">Tap the words below in order</span>
          )}
          {placed.map((tile) => (
            <button
              key={tile.id}
              onClick={() => returnTile(tile)}
              disabled={!!result}
              className={`font-korean text-lg px-3 py-1.5 rounded-lg border transition-all ${
                result === 'correct'
                  ? 'border-green-400 text-green-400 bg-green-400/10'
                  : result === 'incorrect'
                    ? 'border-red-400 text-red-400 bg-red-400/10'
                    : 'border-accent text-accent bg-accent/10 hover:bg-accent/20'
              }`}
            >
              {tile.text}
            </button>
          ))}
        </div>

        {result === 'incorrect' && (
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-widest text-muted">Correct answer</p>
            <p className="font-korean text-xl text-accent2">{correctAnswer}</p>
          </div>
        )}

        {/* Word bank */}
        <div className="flex flex-wrap gap-2">
          {bank.map((tile) => (
            <button
              key={tile.id}
              onClick={() => placeTile(tile)}
              disabled={!!result}
              className="font-korean text-lg px-3 py-1.5 rounded-lg border border-border bg-surface2 text-white hover:border-accent2/50 transition-all disabled:opacity-40"
            >
              {tile.text}
            </button>
          ))}
        </div>
      </div>

      {!result ? (
        <button
          onClick={handleCheck}
          disabled={placed.length === 0}
          className="bg-accent text-bg text-xs uppercase tracking-widest font-medium px-8 py-2.5 rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50"
        >
          Check
        </button>
      ) : (
        <button
          onClick={() => onComplete(result === 'correct')}
          className="border border-accent text-accent text-xs uppercase tracking-widest px-8 py-2.5 rounded-xl hover:bg-accent/10 transition-all"
        >
          Next
        </button>
      )}
    </div>
  )
}

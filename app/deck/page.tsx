'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import type { CardWithReview } from '@/lib/types'

const STAGE_COLORS: Record<string, string> = {
  new: '#7c6af7',
  learning: '#e8c547',
  review: '#4ecdc4',
  mastered: '#69db7c',
}

export default function DeckPage() {
  const [cards, setCards] = useState<CardWithReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ korean: '', english: '', romanization: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function fetchCards() {
    setLoading(true)
    const res = await fetch('/api/cards')
    const data = await res.json()
    setCards(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const categories = ['all', ...Array.from(new Set(cards.map((c) => c.category))).sort()]
  const filtered =
    activeCategory === 'all' ? cards : cards.filter((c) => c.category === activeCategory)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.korean || !form.english) return
    setSaving(true)
    await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, category: form.category || 'general' }),
    })
    setForm({ korean: '', english: '', romanization: '', category: '' })
    setShowForm(false)
    setSaving(false)
    fetchCards()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this card?')) return
    await fetch(`/api/cards?id=${id}`, { method: 'DELETE' })
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleExport(format: 'csv' | 'json') {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format, category: activeCategory })
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cat = activeCategory === 'all' ? 'all-cards' : activeCategory
      a.download = `korean-${cat}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl italic text-white">Your Deck</h1>
            <p className="text-muted text-xs mt-1 tracking-widest uppercase">
              {cards.length} total cards · {categories.length - 1} categories
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="border border-green-500 text-green-400 text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-green-500/10 transition-all disabled:opacity-50"
            >
              {exporting ? '...' : 'CSV'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="border border-accent2 text-accent2 text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-accent2/10 transition-all disabled:opacity-50"
            >
              {exporting ? '...' : 'JSON'}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-accent text-bg text-xs uppercase tracking-widest font-medium px-5 py-2.5 rounded-xl hover:bg-yellow-300 transition-all"
            >
              + Add Card
            </button>
          </div>
        </div>

        {/* Add card form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-surface border border-border rounded-2xl p-6 mb-8 flex flex-col gap-4"
          >
            <h3 className="text-xs uppercase tracking-widest text-muted">New Card</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <input
                placeholder="한국어"
                value={form.korean}
                onChange={(e) => setForm((f) => ({ ...f, korean: e.target.value }))}
                className="font-korean bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-base placeholder-muted outline-none focus:border-accent2 transition-colors"
                required
              />
              <input
                placeholder="English"
                value={form.english}
                onChange={(e) => setForm((f) => ({ ...f, english: e.target.value }))}
                className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
                required
              />
              <input
                placeholder="Romanization"
                value={form.romanization}
                onChange={(e) => setForm((f) => ({ ...f, romanization: e.target.value }))}
                className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
              />
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-accent text-bg text-xs uppercase tracking-widest font-medium px-6 py-2.5 rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Card'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl border border-border hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${
                activeCategory === cat
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted hover:text-white'
              }`}
            >
              {cat}
              {cat !== 'all' && (
                <span className="ml-1.5 opacity-50">
                  {cards.filter((c) => c.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active category info */}
        {activeCategory !== 'all' && !loading && (
          <div className="flex items-center justify-between mb-4 bg-surface border border-border rounded-xl px-4 py-3">
            <p className="text-sm text-muted">
              Showing <span className="text-white">{filtered.length} cards</span> in{' '}
              <span className="text-accent">"{activeCategory}"</span>
            </p>
            <p className="text-xs text-muted">Use the CSV / JSON buttons above to export</p>
          </div>
        )}

        {/* SRS stage legend */}
        <div className="flex gap-4 mb-5">
          {Object.entries(STAGE_COLORS).map(([stage, color]) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-muted capitalize">{stage}</span>
            </div>
          ))}
        </div>

        {loading && (
          <p className="text-muted text-sm tracking-widest uppercase animate-pulse">Loading...</p>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((card) => (
            <div
              key={card.id}
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5 hover:border-accent2/50 transition-colors group"
            >
              <div className="flex justify-between items-start">
                <span className="font-korean text-xl font-bold text-white">{card.korean}</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STAGE_COLORS[card.review?.stage ?? 'new'] }}
                    title={card.review?.stage ?? 'new'}
                  />
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                    title="Delete card"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {card.romanization && (
                <span className="text-accent2 text-xs">{card.romanization}</span>
              )}
              <span className="font-serif italic text-muted text-sm leading-snug">
                {card.english}
              </span>
              <span className="text-xs text-muted/60 uppercase tracking-widest mt-1">
                {card.category}
              </span>
            </div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-muted text-sm text-center py-16">No cards in this category yet.</p>
        )}
      </main>
    </div>
  )
}
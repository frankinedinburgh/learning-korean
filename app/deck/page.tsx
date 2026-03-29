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
  const [showExport, setShowExport] = useState(false)
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

  useEffect(() => { fetchCards() }, [])

  useEffect(() => {
    if (!showExport) return
    function handleClickOutside() {
      setShowExport(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showExport])

  const categories = ['all', ...Array.from(new Set(cards.map(c => c.category))).sort()]
  const filtered = activeCategory === 'all' ? cards : cards.filter(c => c.category === activeCategory)

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
    setCards(prev => prev.filter(c => c.id !== id))
  }

  // Triggers a browser file download using the export API
  async function handleExport(format: 'csv' | 'json') {
    console.log('handleExport', format)
    setExporting(true)
    try {
      const params = new URLSearchParams({ format, category: activeCategory })
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      // Create a temporary anchor tag to trigger the download
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
      setShowExport(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 relative z-10">
        {/* Header row with title and action buttons */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl italic text-white">Your Deck</h1>
            <p className="text-muted text-xs mt-1 tracking-widest uppercase">
              {cards.length} total cards · {categories.length - 1} categories
            </p>
          </div>
          <div className="flex gap-2">
            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="border border-accent2 text-accent2 text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-accent2/10 transition-all flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>

              {showExport && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-12 bg-surface border border-border rounded-xl shadow-2xl z-50 w-64 overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <p className="text-xs text-muted uppercase tracking-widest mb-1">Exporting</p>
                    <p className="text-white text-sm font-medium">
                      {activeCategory === 'all' ? 'All cards' : `"${activeCategory}"`}
                      <span className="text-muted ml-1">({filtered.length} cards)</span>
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        console.log('export csv')
                        e.stopPropagation()
                        handleExport('csv')
                      }}
                      disabled={exporting}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface2 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <span className="text-green-400 text-xs font-bold">CSV</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          {exporting ? 'Downloading...' : 'Download CSV'}
                        </p>
                        <p className="text-muted text-xs">For Excel, Google Sheets</p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExport('json')
                      }}
                      disabled={exporting}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface2 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent2/10 border border-accent2/20 flex items-center justify-center shrink-0">
                        <span className="text-accent2 text-xs font-bold">JSON</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          {exporting ? 'Downloading...' : 'Download JSON'}
                        </p>
                        <p className="text-muted text-xs">For developers / Anki import</p>
                      </div>
                    </button>
                  </div>
                  <div className="px-4 pb-3 pt-1 border-t border-border">
                    <p className="text-muted/60 text-xs">
                      Tip: select a category first to export just that category
                    </p>
                  </div>
                </div>
              )}
            </div>

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

        {/* Per-category export shortcut */}
        {activeCategory !== 'all' && !loading && (
          <div className="flex items-center justify-between mb-4 bg-surface border border-border rounded-xl px-4 py-3">
            <p className="text-sm text-muted">
              Showing <span className="text-white">{filtered.length} cards</span> in{' '}
              <span className="text-accent">"{activeCategory}"</span>
            </p>
            <button
              onClick={() => setShowExport(true)}
              className="text-xs text-accent2 hover:text-white transition-colors tracking-widest uppercase"
            >
              Export this category →
            </button>
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
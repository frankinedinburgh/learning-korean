'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CardWithReview } from '@/lib/types'

type FormState = 'closed' | 'open' | 'saving'
type CategoryRow = { category: string; subcategory: string | null; count: number }

const STAGE_COLORS: Record<string, string> = {
  new: '#7c6af7',
  learning: '#e8c547',
  review: '#4ecdc4',
  mastered: '#69db7c',
}

function sortRows(a: CategoryRow, b: CategoryRow) {
  return a.category.localeCompare(b.category) || (a.subcategory ?? '').localeCompare(b.subcategory ?? '')
}

// Flat {category, subcategory, count} rows -> category -> subcategories tree
function buildCategoryTree(rows: CategoryRow[]) {
  const tree = new Map<string, { total: number; subcategories: { subcategory: string; count: number }[] }>()
  for (const row of rows) {
    const entry = tree.get(row.category) ?? { total: 0, subcategories: [] }
    entry.total += row.count
    if (row.subcategory) entry.subcategories.push({ subcategory: row.subcategory, count: row.count })
    tree.set(row.category, entry)
  }
  Array.from(tree.values()).forEach((entry) => {
    entry.subcategories.sort((a, b) => a.subcategory.localeCompare(b.subcategory))
  })
  return tree
}

export default function DeckClient({
  initialCards,
  initialCategories,
  initialHasMore,
  pageSize,
}: {
  initialCards: CardWithReview[]
  initialCategories: CategoryRow[]
  initialHasMore: boolean
  pageSize: number
}) {
  const [cards, setCards] = useState(initialCards)
  const [categoryRows, setCategoryRows] = useState(initialCategories)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [formState, setFormState] = useState<FormState>('closed')
  const [form, setForm] = useState({
    korean: '',
    english: '',
    romanization: '',
    category: '',
    subcategory: '',
    example_present: '',
    example_past: '',
    example_future: '',
  })
  const [showTenseFields, setShowTenseFields] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const isFirstRun = useRef(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // The IntersectionObserver callback fires from an event, not a render, so
  // it can't close over fresh state — it reads whatever's current here instead.
  const liveRef = useRef({ activeCategory, activeSubcategory, hasMore, loadingMore, offset: cards.length })
  liveRef.current = { activeCategory, activeSubcategory, hasMore, loadingMore, offset: cards.length }

  // Bumped on every fetch (category switch AND load-more). A response only
  // gets applied if it's still the most recent request — otherwise a
  // slow load-more response could land after a category switch and
  // reintroduce cards from the old filter.
  const requestIdRef = useRef(0)

  const totalCards = categoryRows.reduce((sum, r) => sum + r.count, 0)
  const categoryTree = buildCategoryTree(categoryRows)
  const categories = ['all', ...Array.from(categoryTree.keys()).sort()]
  const activeSubcategories = categoryTree.get(activeCategory)?.subcategories ?? []

  const fetchPage = useCallback(
    async (category: string, subcategory: string | null, offset: number) => {
      const params = new URLSearchParams({ offset: String(offset), limit: String(pageSize) })
      if (category !== 'all') params.set('category', category)
      if (subcategory) params.set('subcategory', subcategory)
      const res = await fetch(`/api/cards/page?${params}`)
      if (!res.ok) throw new Error('Failed to load cards')
      return (await res.json()) as { cards: CardWithReview[]; hasMore: boolean }
    },
    [pageSize]
  )

  // Re-fetch from the top whenever the category/subcategory filter changes
  // (skip on mount — the initial 'all' page already arrived via server props)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    const myRequestId = ++requestIdRef.current
    setCards([])
    setHasMore(false)
    setLoadingMore(true)
    fetchPage(activeCategory, activeSubcategory, 0)
      .then(({ cards: page, hasMore: more }) => {
        if (requestIdRef.current !== myRequestId) return // superseded by a later switch
        setCards(page)
        setHasMore(more)
      })
      .finally(() => {
        if (requestIdRef.current === myRequestId) setLoadingMore(false)
      })
  }, [activeCategory, activeSubcategory, fetchPage])

  // Created once — recreating this on every card append/state change is what
  // caused an earlier bug (a fresh observer fires immediately on `observe()`
  // using whatever state was captured at creation time, which raced with the
  // category-switch effect above). Reads current state via liveRef instead.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        const { activeCategory: category, activeSubcategory: subcategory, hasMore: more, loadingMore: loading, offset } = liveRef.current
        if (!more || loading) return

        const myRequestId = ++requestIdRef.current
        setLoadingMore(true)
        fetchPage(category, subcategory, offset)
          .then(({ cards: page, hasMore: moreNext }) => {
            if (requestIdRef.current !== myRequestId) return
            setCards((prev) => [...prev, ...page])
            setHasMore(moreNext)
          })
          .finally(() => {
            if (requestIdRef.current === myRequestId) setLoadingMore(false)
          })
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage])

  function bumpCategoryCount(category: string, subcategory: string | null, delta: number) {
    setCategoryRows((prev) => {
      const idx = prev.findIndex((r) => r.category === category && r.subcategory === subcategory)
      if (idx === -1) {
        if (delta <= 0) return prev
        return [...prev, { category, subcategory, count: delta }].sort(sortRows)
      }
      const nextCount = prev[idx].count + delta
      if (nextCount <= 0) return prev.filter((_, i) => i !== idx)
      return prev.map((r, i) => (i === idx ? { ...r, count: nextCount } : r))
    })
  }

  function selectCategory(cat: string) {
    setActiveCategory(cat)
    setActiveSubcategory(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.korean || !form.english) return
    setFormState('saving')
    setAddError(null)
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        category: form.category || 'general',
        subcategory: form.subcategory || null,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setAddError(body?.error ?? 'Failed to add card')
      setFormState('open')
      return
    }
    const newCard: CardWithReview = { ...(await res.json()), review: null }
    bumpCategoryCount(newCard.category, newCard.subcategory, 1)
    const matchesFilter =
      (activeCategory === 'all' || activeCategory === newCard.category) &&
      (activeSubcategory === null || activeSubcategory === newCard.subcategory)
    if (matchesFilter) {
      setCards((prev) => [...prev, newCard])
    }
    setForm({
      korean: '',
      english: '',
      romanization: '',
      category: '',
      subcategory: '',
      example_present: '',
      example_past: '',
      example_future: '',
    })
    setShowTenseFields(false)
    setFormState('closed')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this card?')) return
    const card = cards.find((c) => c.id === id)
    await fetch(`/api/cards?id=${id}`, { method: 'DELETE' })
    setCards((prev) => prev.filter((c) => c.id !== id))
    if (card) bumpCategoryCount(card.category, card.subcategory, -1)
  }

  async function handleExport(format: 'csv' | 'json') {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format, category: activeCategory })
      if (activeSubcategory) params.set('subcategory', activeSubcategory)
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cat = activeCategory === 'all' ? 'all-cards' : activeCategory
      const sub = activeSubcategory ? `-${activeSubcategory}` : ''
      a.download = `korean-${cat}${sub}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const studyHref = (() => {
    const params = new URLSearchParams({ category: activeCategory })
    if (activeSubcategory) params.set('subcategory', activeSubcategory)
    return `/study?${params}`
  })()

  const activeCategoryTotal =
    activeCategory === 'all'
      ? totalCards
      : activeSubcategory
        ? categoryRows.find((r) => r.category === activeCategory && r.subcategory === activeSubcategory)?.count ?? 0
        : categoryTree.get(activeCategory)?.total ?? 0

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl italic text-white">Your Deck</h1>
          <p className="text-muted text-xs mt-1 tracking-widest uppercase">
            {totalCards} total cards · {categoryTree.size} categories
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
            onClick={() => setFormState('open')}
            className="bg-accent text-bg text-xs uppercase tracking-widest font-medium px-5 py-2.5 rounded-xl hover:bg-yellow-300 transition-all"
          >
            + Add Card
          </button>
        </div>
      </div>

      {/* Add card form */}
      {formState !== 'closed' && (
        <form
          onSubmit={handleAdd}
          className="bg-surface border border-border rounded-2xl p-6 mb-8 flex flex-col gap-4"
        >
          <h3 className="text-xs uppercase tracking-widest text-muted">New Card</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
            <input
              placeholder="Subcategory (optional)"
              value={form.subcategory}
              onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
              className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowTenseFields((s) => !s)}
            className="text-xs text-muted hover:text-white transition-colors self-start"
          >
            {showTenseFields ? '− Hide verb tense examples' : '+ Add verb tense examples (optional)'}
          </button>

          {showTenseFields && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                placeholder="Present, e.g. 가요"
                value={form.example_present}
                onChange={(e) => setForm((f) => ({ ...f, example_present: e.target.value }))}
                className="font-korean bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
              />
              <input
                placeholder="Past, e.g. 갔어요"
                value={form.example_past}
                onChange={(e) => setForm((f) => ({ ...f, example_past: e.target.value }))}
                className="font-korean bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
              />
              <input
                placeholder="Future, e.g. 갈 거예요"
                value={form.example_future}
                onChange={(e) => setForm((f) => ({ ...f, example_future: e.target.value }))}
                className="font-korean bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
              />
            </div>
          )}

          {addError && <p className="text-red-400 text-xs">{addError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={formState === 'saving'}
              className="bg-accent text-bg text-xs uppercase tracking-widest font-medium px-6 py-2.5 rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50"
            >
              {formState === 'saving' ? 'Saving...' : 'Save Card'}
            </button>
            <button
              type="button"
              onClick={() => setFormState('closed')}
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
            onClick={() => selectCategory(cat)}
            className={`text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${
              activeCategory === cat
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-muted hover:text-white'
            }`}
          >
            {cat}
            {cat !== 'all' && (
              <span className="ml-1.5 opacity-50">{categoryTree.get(cat)?.total ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      {/* Subcategory filter pills — only shown when the active category has any */}
      {activeCategory !== 'all' && activeSubcategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6 -mt-3 pl-4 border-l-2 border-border">
          <button
            onClick={() => setActiveSubcategory(null)}
            className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
              activeSubcategory === null
                ? 'border-accent2 text-accent2 bg-accent2/10'
                : 'border-border text-muted hover:text-white'
            }`}
          >
            All
          </button>
          {activeSubcategories.map(({ subcategory, count }) => (
            <button
              key={subcategory}
              onClick={() => setActiveSubcategory(subcategory)}
              className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                activeSubcategory === subcategory
                  ? 'border-accent2 text-accent2 bg-accent2/10'
                  : 'border-border text-muted hover:text-white'
              }`}
            >
              {subcategory}
              <span className="ml-1.5 opacity-50">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active category info */}
      {activeCategory !== 'all' && (
        <div className="flex items-center justify-between mb-4 bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-sm text-muted">
            Showing <span className="text-white">{activeCategoryTotal} cards</span> in{' '}
            <span className="text-accent">{activeCategory}</span>
            {activeSubcategory && (
              <>
                {' '}
                / <span className="text-accent2">{activeSubcategory}</span>
              </>
            )}
          </p>
          <p className="hidden sm:block text-xs text-muted">Use the CSV / JSON buttons above to export</p>
          <Link
            href={studyHref}
            className="border border-accent text-accent text-xs uppercase tracking-widest px-4 py-1.5 rounded-xl hover:bg-accent/10 transition-all"
          >
            Study {activeSubcategory ?? activeCategory}
          </Link>
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

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => (
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
              {card.subcategory && <> · {card.subcategory}</>}
            </span>
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger + loading state */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <p className="text-muted text-xs text-center py-8 tracking-widest uppercase animate-pulse">
          Loading more...
        </p>
      )}

      {!loadingMore && cards.length === 0 && (
        <p className="text-muted text-sm text-center py-16">No cards in this category yet.</p>
      )}
    </main>
  )
}

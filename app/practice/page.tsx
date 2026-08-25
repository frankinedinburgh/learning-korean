'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import SentenceScramble from '@/components/SentenceScramble'
import { shuffle, buildCategoryTree, sortCategoryRows, type CategoryRow } from '@/lib/utils'
import type { Sentence } from '@/lib/types'

type SessionState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'active'; sentences: Sentence[]; index: number; correct: number }
  | { status: 'complete'; total: number; correct: number }

type FormState = 'closed' | 'open' | 'saving'

const emptyForm = {
  korean: '',
  english: '',
  chunks: '',
  decoyChunks: '',
  category: '',
  subcategory: '',
}

function PracticePageContent() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const searchParams = useSearchParams()

  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([])
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? 'all')
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    searchParams.get('subcategory')
  )

  const [formState, setFormState] = useState<FormState>('closed')
  const [form, setForm] = useState(emptyForm)
  const [addError, setAddError] = useState<string | null>(null)

  const categoryTree = buildCategoryTree(categoryRows)
  const categories = ['all', ...Array.from(categoryTree.keys()).sort()]
  const activeSubcategories = categoryTree.get(activeCategory)?.subcategories ?? []

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/sentences/categories')
    if (res.ok) setCategoryRows(await res.json())
  }, [])

  const fetchSentences = useCallback(async () => {
    setSession({ status: 'loading' })
    const params = new URLSearchParams()
    if (activeCategory !== 'all') params.set('category', activeCategory)
    if (activeSubcategory) params.set('subcategory', activeSubcategory)
    const res = await fetch(`/api/sentences?${params}`)
    const data: Sentence[] = await res.json()
    if (data.length === 0) {
      setSession({ status: 'empty' })
      return
    }
    setSession({ status: 'active', sentences: shuffle(data), index: 0, correct: 0 })
  }, [activeCategory, activeSubcategory])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchSentences()
  }, [fetchSentences])

  function selectCategory(cat: string) {
    setActiveCategory(cat)
    setActiveSubcategory(null)
  }

  function bumpCategoryCount(category: string, subcategory: string | null, delta: number) {
    setCategoryRows((prev) => {
      const idx = prev.findIndex((r) => r.category === category && r.subcategory === subcategory)
      if (idx === -1) {
        if (delta <= 0) return prev
        return [...prev, { category, subcategory, count: delta }].sort(sortCategoryRows)
      }
      const nextCount = prev[idx].count + delta
      if (nextCount <= 0) return prev.filter((_, i) => i !== idx)
      return prev.map((r, i) => (i === idx ? { ...r, count: nextCount } : r))
    })
  }

  function handleComplete(wasCorrect: boolean) {
    setSession((prev) => {
      if (prev.status !== 'active') return prev
      const correct = prev.correct + (wasCorrect ? 1 : 0)
      const nextIndex = prev.index + 1
      if (nextIndex >= prev.sentences.length) {
        return { status: 'complete', total: prev.sentences.length, correct }
      }
      return { ...prev, index: nextIndex, correct }
    })
  }

  async function handleAddSentence(e: React.FormEvent) {
    e.preventDefault()
    const chunks = form.chunks
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean)
    if (!form.korean || !form.english || chunks.length === 0) return

    const decoy_chunks = form.decoyChunks
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    setFormState('saving')
    setAddError(null)
    const category = form.category || 'general'
    const subcategory = form.subcategory || null
    const res = await fetch('/api/sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        korean: form.korean,
        english: form.english,
        chunks,
        decoy_chunks,
        category,
        subcategory,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setAddError(body?.error ?? 'Failed to add sentence')
      setFormState('open')
      return
    }
    bumpCategoryCount(category, subcategory, 1)
    setForm(emptyForm)
    setFormState('closed')
    fetchSentences()
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />

      <main className="flex-1 flex flex-col items-center px-4 py-10 gap-8 relative z-10">
        <div className="w-full max-w-lg flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              onClick={() => setFormState(formState === 'closed' ? 'open' : 'closed')}
              className="border border-accent text-accent text-xs uppercase tracking-widest px-4 py-1.5 rounded-xl hover:bg-accent/10 transition-all"
            >
              {formState === 'closed' ? '+ Add Sentence' : 'Cancel'}
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap">
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
            <div className="flex gap-2 flex-wrap pl-4 border-l-2 border-border">
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
        </div>

        {formState !== 'closed' && (
          <form
            onSubmit={handleAddSentence}
            className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 flex flex-col gap-3"
          >
            <h3 className="text-xs uppercase tracking-widest text-muted">New Sentence</h3>
            <input
              placeholder="English translation"
              value={form.english}
              onChange={(e) => setForm((f) => ({ ...f, english: e.target.value }))}
              className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted outline-none focus:border-accent2 transition-colors"
              required
            />
            <input
              placeholder="한국어 chunks, separated by | (e.g. 이번 | 주에 | 소개팅을 | 해요.)"
              value={form.chunks}
              onChange={(e) => setForm((f) => ({ ...f, chunks: e.target.value }))}
              className="font-korean bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-base placeholder-muted outline-none focus:border-accent2 transition-colors"
              required
            />
            <input
              placeholder="Decoy chunks, comma-separated (optional)"
              value={form.decoyChunks}
              onChange={(e) => setForm((f) => ({ ...f, decoyChunks: e.target.value }))}
              className="font-korean bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-base placeholder-muted outline-none focus:border-accent2 transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
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
            {addError && <p className="text-red-400 text-xs">{addError}</p>}
            <button
              type="submit"
              disabled={formState === 'saving'}
              className="bg-accent text-bg text-xs uppercase tracking-widest font-medium px-6 py-2.5 rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50 self-start"
            >
              {formState === 'saving' ? 'Saving...' : 'Save Sentence'}
            </button>
          </form>
        )}

        {session.status === 'loading' && (
          <div className="text-muted text-sm tracking-widest uppercase animate-pulse">
            Loading sentences...
          </div>
        )}

        {session.status === 'empty' && (
          <div className="text-center flex flex-col items-center gap-3">
            <p className="text-muted text-sm">No sentences in this category yet.</p>
            <p className="text-muted text-xs">Use the &ldquo;+ Add Sentence&rdquo; button above to create one.</p>
          </div>
        )}

        {session.status === 'active' && (
          <>
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-xs text-muted text-center tracking-widest uppercase">
                Sentence <span className="text-accent">{session.index + 1}</span> of{' '}
                <span className="text-accent">{session.sentences.length}</span>
              </p>
              <div className="h-0.5 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(session.index / session.sentences.length) * 100}%`,
                    background: 'linear-gradient(90deg, #7c6af7, #e8c547)',
                  }}
                />
              </div>
            </div>
            <SentenceScramble
              key={session.sentences[session.index].id}
              sentence={session.sentences[session.index]}
              onComplete={handleComplete}
            />
          </>
        )}

        {session.status === 'complete' && (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-6xl">🎉</div>
            <h2 className="font-serif text-4xl italic text-white">Session complete!</h2>
            <p className="text-muted text-sm">
              {session.correct} of {session.total} correct
            </p>
            <button
              onClick={fetchSentences}
              className="mt-4 border border-accent text-accent text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-accent/10 transition-all"
            >
              Practice again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <PracticePageContent />
    </Suspense>
  )
}

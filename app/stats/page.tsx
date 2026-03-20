'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'

interface StatsData {
  counts: { new: number; learning: number; review: number; mastered: number }
  total: number
  due: number
}

const STAGE_META = [
  { key: 'new', label: 'New', color: '#7c6af7' },
  { key: 'learning', label: 'Learning', color: '#e8c547' },
  { key: 'review', label: 'Review', color: '#4ecdc4' },
  { key: 'mastered', label: 'Mastered', color: '#69db7c' },
] as const

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/reviews')
      const data = await res.json()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  const maxCount = stats ? Math.max(...Object.values(stats.counts), 1) : 1

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 relative z-10">
        <h1 className="font-serif text-3xl italic text-white mb-8">Your Progress</h1>

        {loading && (
          <p className="text-muted text-sm tracking-widest uppercase animate-pulse">Loading...</p>
        )}

        {stats && (
          <div className="flex flex-col gap-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Cards', value: stats.total, color: 'text-white' },
                { label: 'Due Now', value: stats.due, color: 'text-accent' },
                { label: 'Mastered', value: stats.counts.mastered, color: 'text-green-400' },
                { label: 'Learning', value: stats.counts.learning, color: 'text-accent2' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface border border-border rounded-2xl p-5">
                  <div className={`font-serif text-4xl leading-none mb-1 ${color}`}>{value}</div>
                  <div className="text-xs uppercase tracking-widest text-muted">{label}</div>
                </div>
              ))}
            </div>

            {/* SRS distribution */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-xs uppercase tracking-widest text-muted">SRS Distribution</h2>
              {STAGE_META.map(({ key, label, color }) => {
                const count = stats.counts[key]
                const pct = (count / maxCount) * 100
                return (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-sm text-muted w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="text-sm text-muted w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Mastery progress ring (SVG) */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-8">
              <MasteryRing mastered={stats.counts.mastered} total={stats.total} />
              <div>
                <h2 className="font-serif text-2xl italic text-white mb-1">
                  {stats.total > 0
                    ? `${Math.round((stats.counts.mastered / stats.total) * 100)}% mastered`
                    : 'No cards yet'}
                </h2>
                <p className="text-muted text-sm">
                  {stats.counts.mastered} of {stats.total} cards have an interval over 21 days.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function MasteryRing({ mastered, total }: { mastered: number; total: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? mastered / total : 0
  const dash = pct * circ

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e1e24" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="#69db7c"
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white"
        style={{ fontFamily: 'var(--font-serif)', fontSize: '14px' }}>
        {total > 0 ? `${Math.round(pct * 100)}%` : '0%'}
      </text>
    </svg>
  )
}

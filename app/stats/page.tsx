import Nav from '@/components/Nav'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Fragment, Suspense } from 'react'

interface StatsData {
  counts: { new: number; learning: number; review: number; mastered: number }
  total: number
  due: number
  accuracy: Record<string, { total: number; correct: number }>
}

const STAGE_META = [
  { key: 'new', label: 'New', color: '#7c6af7' },
  { key: 'learning', label: 'Learning', color: '#e8c547' },
  { key: 'review', label: 'Review', color: '#4ecdc4' },
  { key: 'mastered', label: 'Mastered', color: '#69db7c' },
] as const

async function getStats(): Promise<StatsData> {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date().toISOString()
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: reviews }, { data: totalCards }, { data: dueReviews }, { data: reviewLog }] =
    await Promise.all([
      supabase.from('reviews').select('stage').eq('user_id', user.id),
      supabase.from('cards').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('reviews').select('id').eq('user_id', user.id).lte('due', now),
      supabase
        .from('review_log')
        .select('category, rating')
        .eq('user_id', user.id)
        .gte('reviewed_at', lastWeek),
    ])

  const counts = { new: 0, learning: 0, review: 0, mastered: 0 }
  reviews?.forEach((r) => {
    if (r.stage in counts) counts[r.stage as keyof typeof counts]++
  })

  const reviewedCount = reviews?.length ?? 0
  const totalCount = totalCards?.length ?? 0
  counts.new += Math.max(0, totalCount - reviewedCount)

  const accuracy = reviewLog?.reduce(
    (acc, value) => {
      return {
        ...acc,
        [value.category]: acc[value.category]
          ? {
              total: acc[value.category].total + 1,
              correct: acc[value.category].correct + (value.rating >= 3 ? 1 : 0),
            }
          : { total: 1, correct: value.rating >= 3 ? 1 : 0 },
      }
    },
    {} as Record<string, { total: number; correct: number }>
  )

  return {
    counts,
    total: totalCount,
    due: (dueReviews?.length ?? 0) + Math.max(0, totalCount - reviewedCount),
    accuracy: accuracy ?? {},
  }
}

// Synchronous — renders shell immediately, no waiting
export default function StatsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 relative z-10">
        <h1 className="font-serif text-3xl italic text-foreground mb-8">Your Progress</h1>

        <Suspense
          fallback={
            <p className="text-muted text-sm tracking-widest uppercase animate-pulse">
              Loading stats...
            </p>
          }
        >
          <StatsContent />
        </Suspense>
      </main>
    </div>
  )
}

// Async — fetches data here, inside the Suspense boundary, suspends while fetching
async function StatsContent() {
  const stats = await getStats()
  const maxCount = Math.max(...Object.values(stats.counts), 1)
  return <StatsGrid stats={stats} maxCount={maxCount} />
}

function SummaryCards({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total Cards', value: stats.total, color: 'text-foreground' },
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
  )
}

function StatsGrid({ stats, maxCount }: { stats: StatsData; maxCount: number }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <SummaryCards stats={stats} />

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

      {/* Acccuracy */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-6">
        {Object.entries(stats.accuracy).length === 0 ? (
          <p className="text-muted text-sm">No reviews in the last 7 days</p>
        ) : (
          Object.entries(stats.accuracy).map(([category, { total, correct }]) => (
            <div key={category} className="flex gap-8 items-center">
              <div>
                <MasteryRing mastered={correct} total={total} />
              </div>
              <div>
                <h2 className="font-serif text-2xl italic text-foreground mb-1">
                  {total > 0 ? `${Math.round((correct / total) * 100)}% accuracy` : 'No cards yet'}
                </h2>
                <p className="text-muted text-sm">
                  {correct} of {total} accuracy in the last 7 days for category{' '}
                  <span className="text-sm text-accent w-20 shrink-0">{category}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mastery progress ring (SVG) */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-8">
        <MasteryRing mastered={stats.counts.mastered} total={stats.total} />
        <div>
          <h2 className="font-serif text-2xl italic text-foreground mb-1">
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
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#69db7c"
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        style={{ fontFamily: 'var(--font-serif)', fontSize: '14px' }}
      >
        {total > 0 ? `${Math.round(pct * 100)}%` : '0%'}
      </text>
    </svg>
  )
}

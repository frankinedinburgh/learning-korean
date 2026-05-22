export type Rating = 1 | 2 | 3 | 4 // again | hard | good | easy
export type Stage = 'new' | 'learning' | 'review' | 'mastered'

export interface ReviewState {
  interval_days: number
  ease_factor: number
  repetitions: number
  due: string // ISO timestamp
  stage: Stage
}

/**
 * SM-2 spaced repetition algorithm.
 * Returns updated review state given a rating.
 */
export function scheduleCard(current: ReviewState, rating: Rating): ReviewState {
  const now = Date.now()
  const day = 86_400_000

  const strategies: Record<Rating, (state: ReviewState) => Partial<ReviewState>> = {
    1: ({ ease_factor }) => ({
      interval_days: 0,
      ease_factor: Math.max(1.3, ease_factor - 0.2),
      repetitions: 0,
      due: new Date(now + 10 * 60_000).toISOString(),
    }),
    2: ({ interval_days, ease_factor, repetitions }) => ({
      interval_days: Math.max(1, Math.floor(interval_days * 1.2)),
      ease_factor: Math.max(1.3, ease_factor - 0.15),
      repetitions: repetitions + 1,
    }),
    3: ({ interval_days, ease_factor, repetitions }) => ({
      interval_days:
        interval_days === 0 ? 1 : interval_days === 1 ? 4 : Math.round(interval_days * ease_factor),
      ease_factor: Math.max(1.3, ease_factor - 0.15),
      repetitions: repetitions + 1,
    }),
    4: ({ interval_days, ease_factor, repetitions }) => ({
      interval_days: interval_days === 0 ? 4 : Math.round(interval_days * ease_factor * 1.3),
      ease_factor: Math.min(3.0, ease_factor + 0.15),
      repetitions: repetitions + 1,
    }),
  }

  const updates = strategies[rating](current)
  const interval = updates.interval_days ?? current.interval_days
  const stage: Stage =
    updates.stage ?? (interval > 21 ? 'mastered' : interval > 3 ? 'review' : 'learning')
  const due = updates.due ?? new Date(now + interval * day).toISOString()

  return { ...current, ...updates, interval_days: interval, stage, due }
}

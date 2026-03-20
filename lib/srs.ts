export type Rating = 1 | 2 | 3 | 4  // again | hard | good | easy
export type Stage = 'new' | 'learning' | 'review' | 'mastered'

export interface ReviewState {
  interval_days: number
  ease_factor: number
  repetitions: number
  due: string        // ISO timestamp
  stage: Stage
}

/**
 * SM-2 spaced repetition algorithm.
 * Returns updated review state given a rating.
 */
export function scheduleCard(current: ReviewState, rating: Rating): ReviewState {
  const now = Date.now()
  const day = 86_400_000

  let { interval_days, ease_factor, repetitions } = current
  let stage: Stage

  if (rating === 1) {
    // Again — reset, review in 10 minutes
    return {
      interval_days: 0,
      ease_factor: Math.max(1.3, ease_factor - 0.2),
      repetitions: 0,
      due: new Date(now + 10 * 60_000).toISOString(),
      stage: 'learning',
    }
  }

  repetitions++

  if (rating === 2) {
    // Hard
    interval_days = Math.max(1, Math.floor(interval_days * 1.2))
    ease_factor = Math.max(1.3, ease_factor - 0.15)
  } else if (rating === 3) {
    // Good
    if (interval_days === 0) interval_days = 1
    else if (interval_days === 1) interval_days = 4
    else interval_days = Math.round(interval_days * ease_factor)
  } else {
    // Easy
    ease_factor = Math.min(3.0, ease_factor + 0.15)
    if (interval_days === 0) interval_days = 4
    else interval_days = Math.round(interval_days * ease_factor * 1.3)
  }

  if (interval_days > 21) stage = 'mastered'
  else if (interval_days > 3) stage = 'review'
  else stage = 'learning'

  return {
    interval_days,
    ease_factor,
    repetitions,
    due: new Date(now + interval_days * day).toISOString(),
    stage,
  }
}

export interface Card {
  id: string
  user_id: string
  korean: string
  english: string
  romanization: string | null
  category: string
  is_public: boolean
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  card_id: string
  interval_days: number
  ease_factor: number
  repetitions: number
  due: string
  stage: 'new' | 'learning' | 'review' | 'mastered'
  updated_at: string
}

export interface CardWithReview extends Card {
  review: Review | null
}

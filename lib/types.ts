export interface Card {
  id: string
  user_id: string
  korean: string
  english: string
  romanization: string | null
  category: string
  subcategory: string | null
  is_public: boolean
  created_at: string
  // Conjugated example of the verb, e.g. 가다 -> 가요 / 갔어요 / 갈 거예요
  example_present: string | null
  example_past: string | null
  example_future: string | null
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

export interface Sentence {
  id: string
  user_id: string
  korean: string
  english: string
  chunks: string[]
  decoy_chunks: string[]
  category: string
  subcategory: string | null
  created_at: string
}

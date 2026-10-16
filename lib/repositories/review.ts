import { Rating, ReviewState } from '../srs'

export const ReviewsRepository = {
  // operations POST and GET

  // POST request interacts with reviews and cards table
  // GET request interacts with the reviews and cards table

  async getExistingReview(userId: string, cardId: string): ReviewState {}, // fetch or null

  async upsertReview(userId: string, cardId: string, state: ReviewState) {}, // insert or update

  async logReview(userId: string, cardId: string, category: string, rating: Rating) {}, // append to log

  async getStats(userId: string) {}, // fetch counts + due

  async submitReview(userId: string, cardId: string, rating: Rating) {},
}

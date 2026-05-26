import { describe, it, expect } from '@jest/globals';
import { scheduleCard, ReviewState } from '@/lib/srs';

describe('SRS', () => {
  //Test cases for SRS functionality
  it('Should calculate next review date based on current stage and rating', () => {
    // Example test case for scheduleCard function
    const currentState: ReviewState = {
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      due: new Date().toISOString(),
      stage: 'new' as const,
    };

    const rating = 3; // good
    const nextState = scheduleCard(currentState, rating);

    expect(nextState.stage).toBe('learning');
    expect(nextState.interval_days).toBe(1);
    expect(nextState.ease_factor).toBeCloseTo(2.35);
    expect(new Date(nextState.due).getTime()).toBeGreaterThan(Date.now());
  });

  it('rating 1 resets interval and schedules 10 minutes ahead', () => {
    const currentState: ReviewState = {
      interval_days: 5,
      ease_factor: 2.5,
      repetitions: 3,
      due: new Date().toISOString(),
      stage: 'review' as const,
    };

    const rating = 1; // again
    const nextState = scheduleCard(currentState, rating);

    expect(nextState.stage).toBe('learning');
    expect(nextState.interval_days).toBe(0);
    expect(nextState.ease_factor).toBeCloseTo(2.3);
    expect(new Date(nextState.due).getTime()).toBeGreaterThan(Date.now() + 9 * 60_000);
    expect(new Date(nextState.due).getTime()).toBeLessThan(Date.now() + 11 * 60_000);   
  })

  it('rating 4 increases ease factor and grows interval faster', () => {
    const currentState: ReviewState = {
      interval_days: 10,
      ease_factor: 2.5,
      repetitions: 5,
      due: new Date().toISOString(),
      stage: 'review' as const,
    };
    const rating = 4; // easy
    const nextState = scheduleCard(currentState, rating);

    expect(nextState.stage).toBe('mastered');
    expect(nextState.interval_days).toBeGreaterThan(10);
    expect(nextState.ease_factor).toBeCloseTo(2.65);
    expect(new Date(nextState.due).getTime()).toBeGreaterThan(Date.now() + 10 * 86_400_000);
  })
  it('mastered stage is reached after interval exceeds 21 days', () => {
    const currentState: ReviewState = {
      interval_days: 22,
      ease_factor: 2.5,
      repetitions: 10,
      due: new Date().toISOString(),
      stage: 'review' as const,
    };
    const rating = 3; // good
    const nextState = scheduleCard(currentState, rating);

    expect(nextState.stage).toBe('mastered');
    expect(nextState.interval_days).toBeGreaterThan(22);
    expect(nextState.ease_factor).toBeCloseTo(2.35);
  })
});
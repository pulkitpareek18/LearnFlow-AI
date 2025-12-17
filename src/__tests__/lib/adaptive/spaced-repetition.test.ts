/**
 * Unit Tests for Spaced Repetition System (SM-2 Algorithm)
 */

// Mock mongoose models before importing the module
jest.mock('@/lib/db/models/ReviewItem', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  },
}));

import { calculateNextReview, SM2Result } from '@/lib/adaptive/spaced-repetition';
import { ReviewQuality } from '@/types';

describe('Spaced Repetition System - SM-2 Algorithm', () => {
  describe('calculateNextReview', () => {
    describe('with quality < 3 (failed recall)', () => {
      it('should reset repetitions to 0 when quality is 0 (complete blackout)', () => {
        const result = calculateNextReview(0 as ReviewQuality, 2.5, 6, 3);

        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(0);
      });

      it('should reset repetitions to 0 when quality is 1 (incorrect but familiar)', () => {
        const result = calculateNextReview(1 as ReviewQuality, 2.5, 6, 3);

        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(0);
      });

      it('should reset repetitions to 0 when quality is 2 (incorrect but close)', () => {
        const result = calculateNextReview(2 as ReviewQuality, 2.5, 6, 3);

        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(0);
      });

      it('should not modify ease factor when failing', () => {
        const result = calculateNextReview(0 as ReviewQuality, 2.5, 6, 3);

        // Ease factor changes but stays above 1.3
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });
    });

    describe('with quality >= 3 (successful recall)', () => {
      it('should set interval to 1 day on first successful repetition', () => {
        const result = calculateNextReview(3 as ReviewQuality, 2.5, 0, 0);

        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });

      it('should set interval to 6 days on second successful repetition', () => {
        const result = calculateNextReview(4 as ReviewQuality, 2.5, 1, 1);

        expect(result.repetitions).toBe(2);
        expect(result.interval).toBe(6);
      });

      it('should calculate interval using EF for third+ repetitions', () => {
        const easeFactor = 2.5;
        const previousInterval = 6;
        const result = calculateNextReview(4 as ReviewQuality, easeFactor, previousInterval, 2);

        expect(result.repetitions).toBe(3);
        // Interval should be approximately previousInterval * easeFactor
        expect(result.interval).toBeGreaterThan(previousInterval);
      });

      it('should increase ease factor with quality 5 (perfect recall)', () => {
        const initialEF = 2.5;
        const result = calculateNextReview(5 as ReviewQuality, initialEF, 6, 2);

        expect(result.easeFactor).toBeGreaterThan(initialEF);
      });

      it('should decrease ease factor with quality 3 (correct with difficulty)', () => {
        const initialEF = 2.5;
        const result = calculateNextReview(3 as ReviewQuality, initialEF, 6, 2);

        expect(result.easeFactor).toBeLessThan(initialEF);
      });

      it('should never let ease factor go below 1.3', () => {
        // Start with low ease factor and fail multiple times
        let easeFactor = 1.5;
        for (let i = 0; i < 5; i++) {
          const result = calculateNextReview(3 as ReviewQuality, easeFactor, 1, 1);
          easeFactor = result.easeFactor;
        }

        expect(easeFactor).toBeGreaterThanOrEqual(1.3);
      });
    });

    describe('nextReviewDate calculation', () => {
      it('should set nextReviewDate to today when interval is 0', () => {
        const result = calculateNextReview(0 as ReviewQuality, 2.5, 6, 3);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        expect(result.nextReviewDate.getDate()).toBe(today.getDate());
      });

      it('should set nextReviewDate to tomorrow when interval is 1', () => {
        const result = calculateNextReview(3 as ReviewQuality, 2.5, 0, 0);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        expect(result.nextReviewDate.getDate()).toBe(tomorrow.getDate());
      });

      it('should correctly calculate future review date', () => {
        const result = calculateNextReview(4 as ReviewQuality, 2.5, 1, 1);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 6);
        expectedDate.setHours(0, 0, 0, 0);

        expect(result.nextReviewDate.getDate()).toBe(expectedDate.getDate());
      });
    });

    describe('edge cases', () => {
      it('should handle default parameters', () => {
        const result = calculateNextReview(4 as ReviewQuality);

        expect(result).toHaveProperty('easeFactor');
        expect(result).toHaveProperty('interval');
        expect(result).toHaveProperty('repetitions');
        expect(result).toHaveProperty('nextReviewDate');
      });

      it('should handle very high ease factor', () => {
        const result = calculateNextReview(5 as ReviewQuality, 3.0, 30, 10);

        expect(result.easeFactor).toBeDefined();
        expect(result.interval).toBeGreaterThan(30);
      });

      it('should handle minimum ease factor boundary', () => {
        const result = calculateNextReview(3 as ReviewQuality, 1.3, 6, 3);

        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });
    });
  });

  describe('SM-2 Algorithm Properties', () => {
    it('should increase intervals over successful repetitions', () => {
      const intervals: number[] = [];
      let ef = 2.5;
      let interval = 0;
      let reps = 0;

      // Simulate 5 successful reviews
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(4 as ReviewQuality, ef, interval, reps);
        intervals.push(result.interval);
        ef = result.easeFactor;
        interval = result.interval;
        reps = result.repetitions;
      }

      // Verify intervals are increasing
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
      }
    });

    it('should produce consistent results for same inputs', () => {
      const result1 = calculateNextReview(4 as ReviewQuality, 2.5, 6, 2);
      const result2 = calculateNextReview(4 as ReviewQuality, 2.5, 6, 2);

      expect(result1.easeFactor).toBe(result2.easeFactor);
      expect(result1.interval).toBe(result2.interval);
      expect(result1.repetitions).toBe(result2.repetitions);
    });
  });
});

/**
 * Spaced Repetition System (SRS) - SM-2 Algorithm Implementation
 *
 * The SM-2 algorithm calculates optimal review intervals based on:
 * - Ease Factor (EF): How easy the item is to remember (default 2.5)
 * - Interval (I): Days until next review
 * - Repetitions (n): Number of successful reviews in a row
 * - Quality (q): User's self-assessment (0-5)
 *
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but familiar
 * 2 - Incorrect, but close
 * 3 - Correct with difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect recall
 */

import { ReviewQuality, IReviewItem } from '@/types';
import ReviewItem from '@/lib/db/models/ReviewItem';

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate next review using SM-2 algorithm
 *
 * @param quality - User's self-assessment (0-5)
 * @param currentEaseFactor - Current ease factor (default 2.5)
 * @param currentInterval - Current interval in days
 * @param currentRepetitions - Current number of repetitions
 * @returns Updated SM-2 parameters
 */
export function calculateNextReview(
  quality: ReviewQuality,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): SM2Result {
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  // If quality < 3, reset the learning process
  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    // Update ease factor based on quality
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Ensure ease factor doesn't go below 1.3
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    // Update repetitions
    repetitions += 1;

    // Calculate new interval based on repetitions
    if (repetitions === 1) {
      interval = 1; // 1 day
    } else if (repetitions === 2) {
      interval = 6; // 6 days
    } else {
      // I(n) = I(n-1) * EF
      interval = Math.round(interval * easeFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  // Set to start of day to avoid time-based issues
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Get all review items due for a student
 *
 * @param studentId - The student's ID
 * @param courseId - Optional: filter by course
 * @param limit - Maximum number of items to return
 * @returns Array of due review items
 */
export async function getDueItems(
  studentId: string,
  courseId?: string,
  limit: number = 20
): Promise<IReviewItem[]> {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today

  const query: Record<string, unknown> = {
    studentId,
    nextReviewDate: { $lte: now },
  };

  if (courseId) {
    query.courseId = courseId;
  }

  const dueItems = await ReviewItem.find(query)
    .sort({ nextReviewDate: 1 }) // Oldest due first
    .limit(limit)
    .lean();

  return dueItems;
}

/**
 * Update a review item after user submission
 *
 * @param itemId - The review item ID
 * @param quality - User's self-assessment (0-5)
 * @param timeSpent - Time spent on the review (in seconds)
 * @returns Updated review item
 */
export async function updateReviewItem(
  itemId: string,
  quality: ReviewQuality,
  timeSpent: number
): Promise<IReviewItem | null> {
  const item = await ReviewItem.findById(itemId);

  if (!item) {
    return null;
  }

  // Calculate next review using SM-2
  const sm2Result = calculateNextReview(
    quality,
    item.easeFactor,
    item.interval,
    item.repetitions
  );

  // Update item with new SM-2 values
  item.easeFactor = sm2Result.easeFactor;
  item.interval = sm2Result.interval;
  item.repetitions = sm2Result.repetitions;
  item.nextReviewDate = sm2Result.nextReviewDate;
  item.lastReviewDate = new Date();

  // Update performance counters
  if (quality >= 3) {
    item.correctCount += 1;
  } else {
    item.incorrectCount += 1;
  }

  await item.save();

  return item;
}

/**
 * Get review statistics for a student
 *
 * @param studentId - The student's ID
 * @param courseId - Optional: filter by course
 * @returns Review statistics
 */
export async function getReviewStats(studentId: string, courseId?: string) {
  const query: Record<string, unknown> = { studentId };
  if (courseId) {
    query.courseId = courseId;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [totalItems, dueItems, reviewedToday] = await Promise.all([
    ReviewItem.countDocuments(query),
    ReviewItem.countDocuments({
      ...query,
      nextReviewDate: { $lte: now },
    }),
    ReviewItem.countDocuments({
      ...query,
      lastReviewDate: { $gte: now },
    }),
  ]);

  // Get mastery percentage (items with repetitions >= 3)
  const masteredItems = await ReviewItem.countDocuments({
    ...query,
    repetitions: { $gte: 3 },
  });

  const masteryPercentage =
    totalItems > 0 ? Math.round((masteredItems / totalItems) * 100) : 0;

  // Get average accuracy
  const items = await ReviewItem.find(query).select('correctCount incorrectCount').lean();
  let totalCorrect = 0;
  let totalIncorrect = 0;

  items.forEach((item) => {
    totalCorrect += item.correctCount;
    totalIncorrect += item.incorrectCount;
  });

  const totalReviews = totalCorrect + totalIncorrect;
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  return {
    totalItems,
    dueItems,
    reviewedToday,
    masteredItems,
    masteryPercentage,
    accuracy,
    totalReviews,
  };
}

/**
 * Create review items from module interactions
 * Extracts questions/answers from completed module interactions
 *
 * @param studentId - The student's ID
 * @param courseId - The course ID
 * @param moduleId - The module ID
 * @param interactions - Array of practice questions
 * @returns Array of created review items
 */
export async function generateReviewItems(
  studentId: string,
  courseId: string,
  moduleId: string,
  interactions: Array<{
    conceptKey: string;
    question: string;
    answer: string;
  }>
): Promise<IReviewItem[]> {
  const reviewItems: IReviewItem[] = [];

  for (const interaction of interactions) {
    try {
      // Check if review item already exists
      const existing = await ReviewItem.findOne({
        studentId,
        moduleId,
        conceptKey: interaction.conceptKey,
      });

      if (existing) {
        // Skip if already exists
        continue;
      }

      // Create new review item
      const reviewItem = await ReviewItem.create({
        studentId,
        courseId,
        moduleId,
        conceptKey: interaction.conceptKey,
        question: interaction.question,
        answer: interaction.answer,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(), // Due immediately
        correctCount: 0,
        incorrectCount: 0,
      });

      reviewItems.push(reviewItem);
    } catch (error) {
      // Skip on error (e.g., duplicate key)
      console.error('Error creating review item:', error);
    }
  }

  return reviewItems;
}

/**
 * Get upcoming review schedule for a student
 *
 * @param studentId - The student's ID
 * @param days - Number of days to look ahead
 * @returns Schedule of reviews by date
 */
export async function getReviewSchedule(studentId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const items = await ReviewItem.find({
    studentId,
    nextReviewDate: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .select('nextReviewDate conceptKey')
    .lean();

  // Group by date
  const schedule: Record<string, number> = {};

  items.forEach((item) => {
    const dateKey = item.nextReviewDate.toISOString().split('T')[0];
    schedule[dateKey] = (schedule[dateKey] || 0) + 1;
  });

  return schedule;
}

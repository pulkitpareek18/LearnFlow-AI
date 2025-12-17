/**
 * Performance Calculator for Adaptive Learning
 *
 * Calculates metrics used to determine learning adjustments
 */

import { InteractionResponse, ModuleInteractionProgress } from '@/types';

export interface PerformanceMetrics {
  accuracy: number; // 0-100%
  averageTimePerQuestion: number; // in seconds
  conceptMasteryMap: Record<string, number>; // concept -> mastery percentage
  recentTrend: 'improving' | 'stable' | 'declining';
  streakData: {
    correct: number;
    incorrect: number;
  };
  totalResponses: number;
  correctResponses: number;
  averageScore: number;
  completionRate: number;
  // Extended metrics for personalization
  conceptsMastered: string[];
  conceptsStruggling: string[];
  correctStreak: number;
  incorrectStreak: number;
}

interface LearningMetricsInput {
  conceptsMastered?: string[];
  conceptsStruggling?: string[];
  interactionAccuracy?: number;
  correctStreak?: number;
  incorrectStreak?: number;
  recentTrend?: 'improving' | 'stable' | 'declining';
}

/**
 * Calculate comprehensive performance metrics from interaction responses
 */
export function calculatePerformanceMetrics(
  moduleInteractions: ModuleInteractionProgress[],
  existingMetrics?: LearningMetricsInput
): PerformanceMetrics {
  // Flatten all responses
  const allResponses: InteractionResponse[] = moduleInteractions.flatMap(
    (mi) => mi.responses || []
  );

  // Filter to only graded responses (has isCorrect)
  const gradedResponses = allResponses.filter((r) => r.isCorrect !== undefined);
  const correctResponses = gradedResponses.filter((r) => r.isCorrect === true);

  // Calculate basic metrics
  const accuracy =
    gradedResponses.length > 0
      ? Math.round((correctResponses.length / gradedResponses.length) * 100)
      : 0;

  const averageTimePerQuestion =
    gradedResponses.length > 0
      ? Math.round(
          gradedResponses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) /
            gradedResponses.length
        )
      : 0;

  // Calculate concept mastery
  const conceptMasteryMap = calculateConceptMastery(allResponses);

  // Calculate recent trend (last 10 vs previous 10)
  const recentTrend = calculateRecentTrend(gradedResponses);

  // Calculate streaks (from most recent responses going backwards)
  const streakData = calculateStreaks(gradedResponses);

  // Calculate average score
  const totalScore = moduleInteractions.reduce(
    (sum, mi) => sum + (mi.totalScore || 0),
    0
  );
  const maxScore = moduleInteractions.reduce(
    (sum, mi) => sum + (mi.maxPossibleScore || 0),
    0
  );
  const averageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Calculate completion rate
  const completedModules = moduleInteractions.filter(
    (mi) => mi.percentageComplete === 100
  ).length;
  const completionRate =
    moduleInteractions.length > 0
      ? Math.round((completedModules / moduleInteractions.length) * 100)
      : 0;

  // Derive mastered and struggling concepts from mastery map
  const masteredConcepts = Object.entries(conceptMasteryMap)
    .filter(([, mastery]) => mastery >= 80)
    .map(([concept]) => concept);

  const strugglingConcepts = Object.entries(conceptMasteryMap)
    .filter(([, mastery]) => mastery < 60)
    .map(([concept]) => concept);

  return {
    accuracy,
    averageTimePerQuestion,
    conceptMasteryMap,
    recentTrend: existingMetrics?.recentTrend || recentTrend,
    streakData,
    totalResponses: allResponses.length,
    correctResponses: correctResponses.length,
    averageScore,
    completionRate,
    // Extended metrics - merge with existing if available
    conceptsMastered: existingMetrics?.conceptsMastered?.length
      ? [...new Set([...existingMetrics.conceptsMastered, ...masteredConcepts])]
      : masteredConcepts,
    conceptsStruggling: existingMetrics?.conceptsStruggling?.length
      ? [...new Set([...existingMetrics.conceptsStruggling, ...strugglingConcepts])]
      : strugglingConcepts,
    correctStreak: existingMetrics?.correctStreak ?? streakData.correct,
    incorrectStreak: existingMetrics?.incorrectStreak ?? streakData.incorrect,
  };
}

/**
 * Calculate mastery percentage for each concept
 */
function calculateConceptMastery(
  responses: InteractionResponse[]
): Record<string, number> {
  const conceptStats: Record<string, { correct: number; total: number }> = {};

  // Note: We need to access conceptKey from the content block, not the response
  // This is a simplified version that uses blockId patterns
  // In production, you'd join with the actual block data

  responses.forEach((response) => {
    // Extract concept from blockId if it contains concept info (e.g., "block_concept_intro_1")
    // For now, we'll group by interactionType as a proxy
    const concept = response.interactionType;

    if (!conceptStats[concept]) {
      conceptStats[concept] = { correct: 0, total: 0 };
    }

    if (response.isCorrect !== undefined) {
      conceptStats[concept].total++;
      if (response.isCorrect) {
        conceptStats[concept].correct++;
      }
    }
  });

  // Convert to percentages
  const masteryMap: Record<string, number> = {};
  Object.entries(conceptStats).forEach(([concept, stats]) => {
    masteryMap[concept] =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  });

  return masteryMap;
}

/**
 * Calculate recent performance trend
 */
function calculateRecentTrend(
  gradedResponses: InteractionResponse[]
): 'improving' | 'stable' | 'declining' {
  if (gradedResponses.length < 5) {
    return 'stable';
  }

  // Get last 10 responses
  const recentResponses = gradedResponses.slice(-10);
  const recentCorrect = recentResponses.filter((r) => r.isCorrect).length;
  const recentAccuracy = (recentCorrect / recentResponses.length) * 100;

  // Get previous 10 responses (or all remaining)
  const previousResponses = gradedResponses.slice(-20, -10);
  if (previousResponses.length === 0) {
    return 'stable';
  }

  const previousCorrect = previousResponses.filter((r) => r.isCorrect).length;
  const previousAccuracy = (previousCorrect / previousResponses.length) * 100;

  // Determine trend with 10% threshold
  if (recentAccuracy > previousAccuracy + 10) {
    return 'improving';
  } else if (recentAccuracy < previousAccuracy - 10) {
    return 'declining';
  }

  return 'stable';
}

/**
 * Calculate current correct/incorrect streaks
 */
function calculateStreaks(
  gradedResponses: InteractionResponse[]
): { correct: number; incorrect: number } {
  if (gradedResponses.length === 0) {
    return { correct: 0, incorrect: 0 };
  }

  // Sort by submission time (most recent first)
  const sortedResponses = [...gradedResponses].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  // Check if most recent is correct or incorrect
  const mostRecent = sortedResponses[0];
  let correctStreak = 0;
  let incorrectStreak = 0;

  if (mostRecent.isCorrect) {
    // Count consecutive correct answers
    for (const response of sortedResponses) {
      if (response.isCorrect) {
        correctStreak++;
      } else {
        break;
      }
    }
  } else {
    // Count consecutive incorrect answers
    for (const response of sortedResponses) {
      if (!response.isCorrect) {
        incorrectStreak++;
      } else {
        break;
      }
    }
  }

  return { correct: correctStreak, incorrect: incorrectStreak };
}

/**
 * Calculate overall course progress percentage
 */
export function calculateCourseProgress(
  completedModules: string[],
  totalModules: number
): number {
  if (totalModules === 0) return 0;
  return Math.round((completedModules.length / totalModules) * 100);
}

/**
 * Calculate estimated time remaining for a course
 */
export function calculateTimeRemaining(
  averageTimePerModule: number,
  remainingModules: number
): number {
  return averageTimePerModule * remainingModules;
}

/**
 * Adaptive Difficulty Engine
 *
 * Determines difficulty adjustments based on student performance
 */

import { PerformanceMetrics } from './calculator';
import { AdaptiveRecommendation } from '@/types';

export interface DifficultyDecision {
  adjustment: number; // -5 to +5
  newDifficulty: number; // 1-10
  reason: string;
  recommendations: AdaptiveRecommendation[];
}

export interface DifficultyRules {
  // Thresholds for difficulty adjustment
  excellentThreshold: number; // accuracy above this + improving = increase difficulty
  goodThreshold: number; // accuracy above this = maintain difficulty
  strugglingThreshold: number; // accuracy below this = decrease difficulty
  criticalThreshold: number; // accuracy below this = major decrease

  // Streak thresholds
  incorrectStreakThreshold: number; // consecutive incorrect before intervention
  correctStreakThreshold: number; // consecutive correct before challenge

  // Adjustment amounts
  majorIncrease: number;
  minorIncrease: number;
  minorDecrease: number;
  majorDecrease: number;
}

// Default rules based on the plan
const DEFAULT_RULES: DifficultyRules = {
  excellentThreshold: 90,
  goodThreshold: 70,
  strugglingThreshold: 70,
  criticalThreshold: 50,
  incorrectStreakThreshold: 3,
  correctStreakThreshold: 5,
  majorIncrease: 2,
  minorIncrease: 1,
  minorDecrease: -1,
  majorDecrease: -2,
};

/**
 * Calculate difficulty adjustment based on performance metrics
 */
export function calculateDifficultyAdjustment(
  metrics: PerformanceMetrics,
  currentDifficulty: number,
  rules: DifficultyRules = DEFAULT_RULES
): DifficultyDecision {
  const recommendations: AdaptiveRecommendation[] = [];
  let adjustment = 0;
  let reason = '';

  // Rule 1: Check for incorrect streak (highest priority intervention)
  if (metrics.streakData.incorrect >= rules.incorrectStreakThreshold) {
    adjustment = rules.majorDecrease;
    reason = `${metrics.streakData.incorrect} incorrect answers in a row. Slowing down to help you learn.`;

    recommendations.push({
      type: 'slow_down',
      message:
        "Let's take a step back. It's okay - learning takes time, and reviewing helps!",
    });

    recommendations.push({
      type: 'review',
      message: 'Consider reviewing the previous sections before continuing.',
    });
  }
  // Rule 2: Critical accuracy (< 50%)
  else if (metrics.accuracy < rules.criticalThreshold) {
    adjustment = rules.majorDecrease;
    reason = `Accuracy at ${metrics.accuracy}%. Simplifying content to build stronger foundations.`;

    recommendations.push({
      type: 'simplify',
      message:
        "I'll provide simpler explanations to help you understand the basics.",
    });

    recommendations.push({
      type: 'extra_examples',
      message: 'Here are some additional examples to help clarify these concepts.',
    });
  }
  // Rule 3: Struggling accuracy (50-70%)
  else if (metrics.accuracy < rules.strugglingThreshold) {
    adjustment = rules.minorDecrease;
    reason = `Accuracy at ${metrics.accuracy}%. Providing additional support.`;

    recommendations.push({
      type: 'extra_examples',
      message: 'Some extra examples might help reinforce these concepts.',
    });
  }
  // Rule 4: Excellent accuracy (> 90%) + improving trend
  else if (
    metrics.accuracy >= rules.excellentThreshold &&
    metrics.recentTrend === 'improving'
  ) {
    adjustment = rules.majorIncrease;
    reason = `Excellent performance at ${metrics.accuracy}% with improving trend. Ready for more challenge!`;

    recommendations.push({
      type: 'speed_up',
      message: "You're doing great! Let's pick up the pace.",
    });

    recommendations.push({
      type: 'challenge',
      message: "Ready for something more challenging? You've earned it!",
    });
  }
  // Rule 5: Correct streak (bonus challenge)
  else if (metrics.streakData.correct >= rules.correctStreakThreshold) {
    adjustment = rules.minorIncrease;
    reason = `${metrics.streakData.correct} correct answers in a row! Adding a bit more challenge.`;

    recommendations.push({
      type: 'challenge',
      message: `Amazing streak of ${metrics.streakData.correct}! Let's try something a bit harder.`,
    });
  }
  // Rule 6: Good but declining
  else if (
    metrics.accuracy >= rules.goodThreshold &&
    metrics.recentTrend === 'declining'
  ) {
    adjustment = 0;
    reason = `Performance is good at ${metrics.accuracy}% but recent trend is declining. Maintaining current level.`;

    recommendations.push({
      type: 'review',
      message:
        'Your scores have dipped slightly. Consider reviewing recent material.',
    });
  }
  // Rule 7: Stable performance (70-90%)
  else if (metrics.accuracy >= rules.goodThreshold) {
    adjustment = 0;
    reason = `Steady progress at ${metrics.accuracy}%. Keep up the good work!`;
  }

  // Calculate new difficulty (clamped between 1 and 10)
  const newDifficulty = Math.max(1, Math.min(10, currentDifficulty + adjustment));

  // If adjustment would go out of bounds, adjust the actual change
  const actualAdjustment = newDifficulty - currentDifficulty;

  return {
    adjustment: actualAdjustment,
    newDifficulty,
    reason,
    recommendations,
  };
}

/**
 * Determine if a module should be skipped based on performance
 * (for adaptive path through course)
 */
export function shouldSkipModule(
  moduleDifficulty: number,
  studentDifficulty: number,
  metrics: PerformanceMetrics
): boolean {
  // Skip if module is too easy and student is performing excellently
  if (
    metrics.accuracy >= 90 &&
    metrics.recentTrend === 'improving' &&
    moduleDifficulty < studentDifficulty - 2
  ) {
    return true;
  }

  return false;
}

/**
 * Get recommended next module from available modules
 */
export function getRecommendedNextModule(
  availableModules: Array<{
    id: string;
    title: string;
    difficultyLevel: number;
    isCompleted: boolean;
  }>,
  studentDifficulty: number,
  metrics: PerformanceMetrics
): { id: string; title: string } | null {
  // Filter to incomplete modules
  const incompleteModules = availableModules.filter((m) => !m.isCompleted);

  if (incompleteModules.length === 0) {
    return null;
  }

  // Sort by how close difficulty is to student's level
  const sortedModules = incompleteModules.sort((a, b) => {
    const diffA = Math.abs(a.difficultyLevel - studentDifficulty);
    const diffB = Math.abs(b.difficultyLevel - studentDifficulty);
    return diffA - diffB;
  });

  // If struggling, prefer easier modules
  if (metrics.accuracy < 70) {
    const easierModules = sortedModules.filter(
      (m) => m.difficultyLevel <= studentDifficulty
    );
    if (easierModules.length > 0) {
      return { id: easierModules[0].id, title: easierModules[0].title };
    }
  }

  // If excelling, prefer slightly harder modules
  if (metrics.accuracy >= 90 && metrics.recentTrend === 'improving') {
    const harderModules = sortedModules.filter(
      (m) => m.difficultyLevel >= studentDifficulty
    );
    if (harderModules.length > 0) {
      return { id: harderModules[0].id, title: harderModules[0].title };
    }
  }

  // Default: return closest difficulty match
  return { id: sortedModules[0].id, title: sortedModules[0].title };
}

/**
 * Determine content adaptation needs based on performance
 */
export function getContentAdaptations(
  metrics: PerformanceMetrics
): {
  showExtraExamples: boolean;
  showSimplifiedContent: boolean;
  showAdvancedContent: boolean;
  suggestReview: boolean;
} {
  return {
    showExtraExamples:
      metrics.accuracy < 70 || metrics.streakData.incorrect >= 2,
    showSimplifiedContent: metrics.accuracy < 50,
    showAdvancedContent:
      metrics.accuracy >= 90 && metrics.recentTrend === 'improving',
    suggestReview:
      metrics.recentTrend === 'declining' ||
      metrics.streakData.incorrect >= 3,
  };
}

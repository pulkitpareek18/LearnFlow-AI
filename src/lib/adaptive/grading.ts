/**
 * Grade Calculator for Adaptive Learning
 *
 * Calculates final grades based on interactions and assessments
 */

import { GradeResult, InteractiveSettings, ModuleInteractionProgress, AssessmentScore } from '@/types';

export interface GradingInput {
  moduleInteractions: ModuleInteractionProgress[];
  assessmentScores: AssessmentScore[];
  interactiveSettings: InteractiveSettings;
}

/**
 * Calculate final grade based on interactions and assessments
 */
export function calculateFinalGrade(input: GradingInput): GradeResult {
  const { moduleInteractions, assessmentScores, interactiveSettings } = input;

  // Get weights from settings (default 30% interactions, 70% assessments)
  const interactionWeight = interactiveSettings?.gradingWeight?.interactions ?? 0.30;
  const assessmentWeight = interactiveSettings?.gradingWeight?.assessments ?? 0.70;

  // Calculate interaction score
  const interactionTotals = moduleInteractions.reduce(
    (acc, mi) => ({
      earned: acc.earned + (mi.totalScore || 0),
      possible: acc.possible + (mi.maxPossibleScore || 0),
    }),
    { earned: 0, possible: 0 }
  );

  const interactionScore =
    interactionTotals.possible > 0
      ? (interactionTotals.earned / interactionTotals.possible) * 100
      : 0;

  // Calculate assessment score
  const assessmentTotals = assessmentScores.reduce(
    (acc, as) => ({
      total: acc.total + as.score,
      count: acc.count + 1,
    }),
    { total: 0, count: 0 }
  );

  const assessmentScore =
    assessmentTotals.count > 0
      ? assessmentTotals.total / assessmentTotals.count
      : 0;

  // Calculate weighted final score
  let finalScore: number;

  if (interactionTotals.possible === 0 && assessmentTotals.count === 0) {
    // No grades yet
    finalScore = 0;
  } else if (interactionTotals.possible === 0) {
    // Only assessment grades
    finalScore = assessmentScore;
  } else if (assessmentTotals.count === 0) {
    // Only interaction grades
    finalScore = interactionScore;
  } else {
    // Both grades available - use weights
    finalScore =
      interactionScore * interactionWeight + assessmentScore * assessmentWeight;
  }

  // Round to 2 decimal places
  finalScore = Math.round(finalScore * 100) / 100;

  // Determine letter grade
  const letterGrade = getLetterGrade(finalScore);

  return {
    interactionScore: Math.round(interactionScore * 100) / 100,
    assessmentScore: Math.round(assessmentScore * 100) / 100,
    finalScore,
    letterGrade,
    breakdown: {
      interactions: {
        earned: interactionTotals.earned,
        possible: interactionTotals.possible,
        weight: interactionWeight,
      },
      assessments: {
        earned: assessmentTotals.total,
        possible: assessmentTotals.count * 100, // Assuming scores are out of 100
        weight: assessmentWeight,
      },
    },
  };
}

/**
 * Convert numeric score to letter grade
 */
export function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get grade description
 */
export function getGradeDescription(letterGrade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  const descriptions: Record<string, string> = {
    A: 'Excellent! You have demonstrated outstanding understanding of the material.',
    B: 'Great work! You have a solid grasp of the concepts.',
    C: 'Good effort! You understand the basics but could benefit from more practice.',
    D: 'You passed, but there is room for improvement. Consider reviewing the material.',
    F: 'More work is needed. Please review the material and try again.',
  };
  return descriptions[letterGrade];
}

/**
 * Calculate progress toward passing
 */
export function calculateProgressToPass(
  currentScore: number,
  passingScore: number = 70
): {
  isPass: boolean;
  percentToPass: number;
  pointsNeeded: number;
} {
  const isPass = currentScore >= passingScore;
  const percentToPass = Math.min(100, (currentScore / passingScore) * 100);
  const pointsNeeded = Math.max(0, passingScore - currentScore);

  return {
    isPass,
    percentToPass: Math.round(percentToPass * 100) / 100,
    pointsNeeded: Math.round(pointsNeeded * 100) / 100,
  };
}

/**
 * Calculate module-level grade
 */
export function calculateModuleGrade(
  moduleInteraction: ModuleInteractionProgress
): {
  score: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  isComplete: boolean;
} {
  const score =
    moduleInteraction.maxPossibleScore > 0
      ? (moduleInteraction.totalScore / moduleInteraction.maxPossibleScore) * 100
      : 0;

  return {
    score: Math.round(score * 100) / 100,
    letterGrade: getLetterGrade(score),
    isComplete: moduleInteraction.percentageComplete === 100,
  };
}

/**
 * Generate grade report summary
 */
export function generateGradeReport(
  gradeResult: GradeResult,
  studentName: string
): string {
  const lines: string[] = [];

  lines.push(`Grade Report for ${studentName}`);
  lines.push('='.repeat(40));
  lines.push('');
  lines.push(`Final Grade: ${gradeResult.letterGrade} (${gradeResult.finalScore}%)`);
  lines.push('');
  lines.push('Breakdown:');
  lines.push(
    `  Interactions (${gradeResult.breakdown.interactions.weight * 100}%): ${gradeResult.interactionScore}%`
  );
  lines.push(
    `    - Earned: ${gradeResult.breakdown.interactions.earned} / ${gradeResult.breakdown.interactions.possible} points`
  );
  lines.push(
    `  Assessments (${gradeResult.breakdown.assessments.weight * 100}%): ${gradeResult.assessmentScore}%`
  );
  lines.push(
    `    - Average score: ${gradeResult.assessmentScore}%`
  );
  lines.push('');
  lines.push(getGradeDescription(gradeResult.letterGrade));

  return lines.join('\n');
}

/**
 * Check if student meets course completion requirements
 */
export function checkCourseCompletion(
  gradeResult: GradeResult,
  moduleInteractions: ModuleInteractionProgress[],
  requiredModules: number,
  passingScore: number = 70
): {
  isComplete: boolean;
  meetsCriteria: {
    passingGrade: boolean;
    modulesCompleted: boolean;
  };
  message: string;
} {
  const passingGrade = gradeResult.finalScore >= passingScore;
  const completedModules = moduleInteractions.filter(
    (mi) => mi.percentageComplete === 100
  ).length;
  const modulesCompleted = completedModules >= requiredModules;

  const isComplete = passingGrade && modulesCompleted;

  let message: string;
  if (isComplete) {
    message = 'Congratulations! You have successfully completed this course.';
  } else if (!passingGrade && !modulesCompleted) {
    message = `You need a passing grade (${passingScore}%) and to complete all ${requiredModules} modules.`;
  } else if (!passingGrade) {
    message = `Your current grade is ${gradeResult.finalScore}%. You need ${passingScore}% to pass.`;
  } else {
    message = `You have completed ${completedModules} of ${requiredModules} required modules.`;
  }

  return {
    isComplete,
    meetsCriteria: {
      passingGrade,
      modulesCompleted,
    },
    message,
  };
}

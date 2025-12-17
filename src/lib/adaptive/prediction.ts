import {
  IStudentProgress,
  PredictionModel,
  RiskFactor,
  PredictiveRecommendation,
  StudentEngagementHistory,
  LearningProfile,
} from '@/types';

/**
 * Calculate risk score for a student based on their progress and engagement
 * Returns a score from 0-100, where higher means more at risk
 */
export function calculateRiskScore(
  progress: IStudentProgress,
  engagementHistory: StudentEngagementHistory,
  courseMetrics: { avgCompletionTime: number; avgAccuracy: number }
): PredictionModel {
  const riskFactors = identifyRiskFactors(progress, engagementHistory);

  // Calculate weighted risk score
  let totalRisk = 0;
  let totalWeight = 0;

  riskFactors.forEach((factor) => {
    const weight = getFactorWeight(factor.type);
    totalRisk += factor.severity * weight;
    totalWeight += weight;
  });

  const riskScore = totalWeight > 0 ? Math.min(100, (totalRisk / totalWeight) * 100) : 0;

  // Determine predicted outcome
  let predictedOutcome: 'complete' | 'at_risk' | 'likely_dropout';
  if (riskScore < 30) {
    predictedOutcome = 'complete';
  } else if (riskScore < 70) {
    predictedOutcome = 'at_risk';
  } else {
    predictedOutcome = 'likely_dropout';
  }

  // Calculate confidence based on data availability
  const confidenceScore = calculateConfidence(progress, engagementHistory);

  // Generate recommendations
  const recommendations = generatePredictiveRecommendations(
    riskFactors,
    (progress as any).learningProfile
  );

  return {
    riskScore,
    riskFactors,
    predictedOutcome,
    confidenceScore,
    recommendations,
    calculatedAt: new Date(),
  };
}

/**
 * Identify specific risk factors from student data
 */
export function identifyRiskFactors(
  progress: IStudentProgress,
  engagementHistory: StudentEngagementHistory
): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const metrics = (progress.learningMetrics as any) || {};
  const dailyActivity = engagementHistory.dailyActivity || [];

  // 1. Check for engagement drop
  const engagementFactor = checkEngagementDrop(dailyActivity);
  if (engagementFactor) {
    factors.push(engagementFactor);
  }

  // 2. Check for performance decline
  const performanceFactor = checkPerformanceDecline(metrics, dailyActivity);
  if (performanceFactor) {
    factors.push(performanceFactor);
  }

  // 3. Check for long absence
  const absenceFactor = checkLongAbsence(progress.lastAccessedAt);
  if (absenceFactor) {
    factors.push(absenceFactor);
  }

  // 4. Check for difficulty spike
  const difficultyFactor = checkDifficultySpike(metrics);
  if (difficultyFactor) {
    factors.push(difficultyFactor);
  }

  // 5. Check for pace mismatch
  const paceFactor = checkPaceMismatch(dailyActivity, metrics);
  if (paceFactor) {
    factors.push(paceFactor);
  }

  return factors;
}

/**
 * Check if engagement has dropped significantly
 */
function checkEngagementDrop(
  dailyActivity: Array<{
    date: Date;
    minutesSpent: number;
    modulesViewed: number;
    interactionsCompleted: number;
    accuracy: number;
  }>
): RiskFactor | null {
  if (dailyActivity.length < 7) {
    return null; // Not enough data
  }

  // Compare last 3 days to previous 7 days
  const recent = dailyActivity.slice(-3);
  const previous = dailyActivity.slice(-10, -3);

  const recentAvgMinutes =
    recent.reduce((sum, day) => sum + day.minutesSpent, 0) / recent.length;
  const previousAvgMinutes =
    previous.reduce((sum, day) => sum + day.minutesSpent, 0) / previous.length;

  const recentAvgInteractions =
    recent.reduce((sum, day) => sum + day.interactionsCompleted, 0) / recent.length;
  const previousAvgInteractions =
    previous.reduce((sum, day) => sum + day.interactionsCompleted, 0) / previous.length;

  const minutesDrop = previousAvgMinutes > 0
    ? (previousAvgMinutes - recentAvgMinutes) / previousAvgMinutes
    : 0;
  const interactionsDrop = previousAvgInteractions > 0
    ? (previousAvgInteractions - recentAvgInteractions) / previousAvgInteractions
    : 0;

  // If dropped by more than 40%, flag it
  if (minutesDrop > 0.4 || interactionsDrop > 0.4) {
    const severity = Math.max(minutesDrop, interactionsDrop);
    return {
      type: 'engagement_drop',
      severity: Math.min(1, severity),
      description: `Engagement has dropped ${Math.round(severity * 100)}% in recent days`,
      dataPoints: [
        `Previous avg: ${previousAvgMinutes.toFixed(1)} min/day`,
        `Recent avg: ${recentAvgMinutes.toFixed(1)} min/day`,
        `Previous interactions: ${previousAvgInteractions.toFixed(1)}/day`,
        `Recent interactions: ${recentAvgInteractions.toFixed(1)}/day`,
      ],
    };
  }

  return null;
}

/**
 * Check if performance is declining
 */
function checkPerformanceDecline(
  metrics: any,
  dailyActivity: Array<{ date: Date; accuracy: number }>
): RiskFactor | null {
  if (dailyActivity.length < 5) {
    return null;
  }

  // Compare recent accuracy to overall average
  const recent = dailyActivity.slice(-5);
  const recentAvgAccuracy =
    recent.reduce((sum, day) => sum + day.accuracy, 0) / recent.length;

  const overallAccuracy = metrics.interactionAccuracy || metrics.averageScore || 0;

  if (overallAccuracy > 0 && recentAvgAccuracy < overallAccuracy * 0.7) {
    const decline = (overallAccuracy - recentAvgAccuracy) / overallAccuracy;
    return {
      type: 'performance_decline',
      severity: Math.min(1, decline * 2), // Amplify severity
      description: `Recent performance is ${Math.round(decline * 100)}% below average`,
      dataPoints: [
        `Overall accuracy: ${overallAccuracy.toFixed(1)}%`,
        `Recent accuracy: ${recentAvgAccuracy.toFixed(1)}%`,
        `Trend: ${metrics.recentTrend || 'unknown'}`,
      ],
    };
  }

  // Check for declining trend
  if (metrics.recentTrend === 'declining' && metrics.incorrectStreak >= 3) {
    return {
      type: 'performance_decline',
      severity: 0.6,
      description: `Performance trending downward with ${metrics.incorrectStreak} incorrect answers in a row`,
      dataPoints: [
        `Trend: declining`,
        `Incorrect streak: ${metrics.incorrectStreak}`,
        `Current accuracy: ${metrics.interactionAccuracy || 0}%`,
      ],
    };
  }

  return null;
}

/**
 * Check if student has been absent for a long time
 */
function checkLongAbsence(lastAccessedAt?: Date): RiskFactor | null {
  if (!lastAccessedAt) {
    return {
      type: 'long_absence',
      severity: 0.9,
      description: 'No activity recorded',
      dataPoints: ['No last access date available'],
    };
  }

  const now = new Date();
  const daysSinceAccess = Math.floor(
    (now.getTime() - new Date(lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceAccess >= 14) {
    return {
      type: 'long_absence',
      severity: Math.min(1, daysSinceAccess / 30), // Max out at 30 days
      description: `No activity for ${daysSinceAccess} days`,
      dataPoints: [
        `Last accessed: ${new Date(lastAccessedAt).toLocaleDateString()}`,
        `Days absent: ${daysSinceAccess}`,
      ],
    };
  } else if (daysSinceAccess >= 7) {
    return {
      type: 'long_absence',
      severity: daysSinceAccess / 14,
      description: `Inactive for ${daysSinceAccess} days`,
      dataPoints: [
        `Last accessed: ${new Date(lastAccessedAt).toLocaleDateString()}`,
        `Days absent: ${daysSinceAccess}`,
      ],
    };
  }

  return null;
}

/**
 * Check if difficulty is too high for student
 */
function checkDifficultySpike(metrics: any): RiskFactor | null {
  const accuracy = metrics.interactionAccuracy || metrics.averageScore || 0;
  const difficulty = metrics.adaptiveDifficulty || 5;
  const incorrectStreak = metrics.incorrectStreak || 0;

  // If accuracy is very low and difficulty is high
  if (accuracy < 40 && difficulty >= 7) {
    return {
      type: 'difficulty_spike',
      severity: 0.8,
      description: 'Content difficulty appears too high for current skill level',
      dataPoints: [
        `Accuracy: ${accuracy}%`,
        `Difficulty level: ${difficulty}/10`,
        `Incorrect streak: ${incorrectStreak}`,
      ],
    };
  }

  // If consistent failures
  if (incorrectStreak >= 5 && accuracy < 50) {
    return {
      type: 'difficulty_spike',
      severity: 0.7,
      description: 'Struggling with current content difficulty',
      dataPoints: [
        `Incorrect streak: ${incorrectStreak}`,
        `Accuracy: ${accuracy}%`,
      ],
    };
  }

  return null;
}

/**
 * Check if pace is mismatched (too fast or too slow)
 */
function checkPaceMismatch(
  dailyActivity: Array<{ date: Date; minutesSpent: number; modulesViewed: number }>,
  metrics: any
): RiskFactor | null {
  if (dailyActivity.length < 7) {
    return null;
  }

  const recent = dailyActivity.slice(-7);
  const avgMinutesPerModule =
    recent.reduce((sum, day) => sum + day.minutesSpent, 0) /
    Math.max(1, recent.reduce((sum, day) => sum + day.modulesViewed, 0));

  const expectedTime = metrics.averageTimePerModule || 20; // Default 20 min

  // Too fast (rushing)
  if (avgMinutesPerModule < expectedTime * 0.5 && metrics.interactionAccuracy < 60) {
    return {
      type: 'pace_mismatch',
      severity: 0.5,
      description: 'May be rushing through content without proper understanding',
      dataPoints: [
        `Avg time per module: ${avgMinutesPerModule.toFixed(1)} min`,
        `Expected time: ${expectedTime} min`,
        `Accuracy: ${metrics.interactionAccuracy || 0}%`,
      ],
    };
  }

  // Too slow (struggling or distracted)
  if (avgMinutesPerModule > expectedTime * 2 && metrics.interactionAccuracy < 70) {
    return {
      type: 'pace_mismatch',
      severity: 0.6,
      description: 'Taking significantly longer than average, may be struggling',
      dataPoints: [
        `Avg time per module: ${avgMinutesPerModule.toFixed(1)} min`,
        `Expected time: ${expectedTime} min`,
        `Accuracy: ${metrics.interactionAccuracy || 0}%`,
      ],
    };
  }

  return null;
}

/**
 * Get weight for each risk factor type
 */
function getFactorWeight(type: RiskFactor['type']): number {
  const weights = {
    long_absence: 1.5, // Highest weight
    engagement_drop: 1.3,
    performance_decline: 1.2,
    difficulty_spike: 1.0,
    pace_mismatch: 0.8,
  };
  return weights[type] || 1.0;
}

/**
 * Calculate confidence in the prediction
 */
function calculateConfidence(
  progress: IStudentProgress,
  engagementHistory: StudentEngagementHistory
): number {
  let confidence = 0;

  // More data = higher confidence
  const dayCount = engagementHistory.dailyActivity?.length || 0;
  if (dayCount >= 14) confidence += 0.3;
  else if (dayCount >= 7) confidence += 0.2;
  else if (dayCount >= 3) confidence += 0.1;

  // Module completions
  const moduleCount = progress.completedModules?.length || 0;
  if (moduleCount >= 10) confidence += 0.3;
  else if (moduleCount >= 5) confidence += 0.2;
  else if (moduleCount >= 1) confidence += 0.1;

  // Interaction data
  const metrics = (progress.learningMetrics as any) || {};
  if (metrics.interactionAccuracy !== undefined) confidence += 0.2;
  if (metrics.recentTrend) confidence += 0.1;

  // Assessment scores
  if (progress.assessmentScores?.length > 0) confidence += 0.2;

  return Math.min(1, confidence);
}

/**
 * Generate actionable recommendations based on risk factors
 */
export function generatePredictiveRecommendations(
  riskFactors: RiskFactor[],
  studentProfile?: LearningProfile
): PredictiveRecommendation[] {
  const recommendations: PredictiveRecommendation[] = [];

  riskFactors.forEach((factor) => {
    switch (factor.type) {
      case 'long_absence':
        recommendations.push({
          priority: factor.severity > 0.7 ? 'high' : 'medium',
          action: 'Send gentle reminder to return to learning',
          reason: `Student has been absent for an extended period`,
          automatedAction: {
            type: 'send_reminder',
            payload: {
              message: "We've missed you! Ready to continue your learning journey?",
              includeProgress: true,
            },
          },
        });
        break;

      case 'engagement_drop':
        recommendations.push({
          priority: 'medium',
          action: 'Send motivational message and check-in',
          reason: 'Engagement has decreased significantly',
          automatedAction: {
            type: 'send_reminder',
            payload: {
              message: "We noticed you've been less active lately. Everything okay?",
              offerSupport: true,
            },
          },
        });
        break;

      case 'performance_decline':
        recommendations.push({
          priority: 'high',
          action: 'Offer additional support and review materials',
          reason: 'Student is struggling with recent content',
          automatedAction: {
            type: 'suggest_review',
            payload: {
              reviewConcepts: true,
              offerTutorHelp: true,
            },
          },
        });
        if (factor.severity > 0.6) {
          recommendations.push({
            priority: 'high',
            action: 'Consider adjusting difficulty level',
            reason: 'Content may be too challenging',
            automatedAction: {
              type: 'adjust_difficulty',
              payload: {
                adjustment: -1,
                temporary: true,
              },
            },
          });
        }
        break;

      case 'difficulty_spike':
        recommendations.push({
          priority: 'high',
          action: 'Reduce difficulty and provide scaffolding',
          reason: 'Student is overwhelmed by current difficulty',
          automatedAction: {
            type: 'adjust_difficulty',
            payload: {
              adjustment: -2,
              addExamples: true,
              simplifyLanguage: true,
            },
          },
        });
        recommendations.push({
          priority: 'medium',
          action: 'Suggest reviewing prerequisite concepts',
          reason: 'May have gaps in foundational knowledge',
          automatedAction: {
            type: 'suggest_review',
            payload: {
              reviewPreviousModules: true,
            },
          },
        });
        break;

      case 'pace_mismatch':
        if (factor.description.includes('rushing')) {
          recommendations.push({
            priority: 'medium',
            action: 'Encourage student to slow down and review',
            reason: 'Student may be rushing through content',
            automatedAction: {
              type: 'offer_help',
              payload: {
                message: 'Take your time to fully understand each concept',
                suggestReview: true,
              },
            },
          });
        } else {
          recommendations.push({
            priority: 'medium',
            action: 'Offer additional support or simplify content',
            reason: 'Student is taking longer than expected',
            automatedAction: {
              type: 'offer_help',
              payload: {
                offerTutorChat: true,
                simplifyContent: true,
              },
            },
          });
        }
        break;
    }
  });

  // Add general recommendation if no specific factors
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      action: 'Continue monitoring progress',
      reason: 'Student appears to be on track',
    });
  }

  return recommendations;
}

/**
 * Determine if an intervention should be triggered
 */
export function shouldTriggerIntervention(prediction: PredictionModel): {
  trigger: boolean;
  type: string;
  urgency: 'immediate' | 'soon' | 'scheduled';
} {
  // Immediate intervention for high risk
  if (prediction.riskScore >= 70 && prediction.confidenceScore >= 0.5) {
    return {
      trigger: true,
      type: 'critical_support',
      urgency: 'immediate',
    };
  }

  // Soon intervention for moderate risk
  if (prediction.riskScore >= 50 && prediction.confidenceScore >= 0.4) {
    return {
      trigger: true,
      type: 'proactive_support',
      urgency: 'soon',
    };
  }

  // Scheduled check-in for at-risk students
  if (prediction.riskScore >= 30) {
    return {
      trigger: true,
      type: 'wellness_check',
      urgency: 'scheduled',
    };
  }

  return {
    trigger: false,
    type: 'none',
    urgency: 'scheduled',
  };
}

/**
 * Real-Time Struggle Detection System
 *
 * Monitors student interactions in real-time to detect when they're struggling
 * and provides immediate intervention suggestions.
 */

import { ExtendedLearningMetrics, IStudentProgress } from '@/types';

export interface StruggleIndicator {
  type: 'time_on_task' | 'repeated_errors' | 'help_seeking' | 'engagement_drop' | 'difficulty_mismatch';
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  description: string;
  suggestedAction: string;
  dataPoints: Record<string, number | string>;
}

export interface StruggleDetectionResult {
  isStruggling: boolean;
  indicators: StruggleIndicator[];
  overallSeverity: 'none' | 'low' | 'medium' | 'high';
  recommendedIntervention?: {
    type: 'hint' | 'simplify' | 'scaffolding' | 'break' | 'review' | 'tutor';
    message: string;
    action?: string;
  };
}

export interface InteractionEvent {
  timestamp: Date;
  type: 'answer_submitted' | 'hint_requested' | 'content_viewed' | 'interaction_started' | 'interaction_completed';
  correct?: boolean;
  timeSpent?: number; // seconds
  attemptNumber?: number;
  conceptKey?: string;
}

/**
 * Analyze real-time interactions to detect struggle
 */
export function detectStruggle(
  recentEvents: InteractionEvent[],
  currentMetrics: Partial<ExtendedLearningMetrics>,
  expectedTimePerInteraction: number = 60 // seconds
): StruggleDetectionResult {
  const indicators: StruggleIndicator[] = [];

  // Check for time on task issues
  const timeIndicator = checkTimeOnTask(recentEvents, expectedTimePerInteraction);
  if (timeIndicator) indicators.push(timeIndicator);

  // Check for repeated errors
  const errorIndicator = checkRepeatedErrors(recentEvents);
  if (errorIndicator) indicators.push(errorIndicator);

  // Check for excessive help seeking
  const helpIndicator = checkHelpSeeking(recentEvents);
  if (helpIndicator) indicators.push(helpIndicator);

  // Check for engagement drop
  const engagementIndicator = checkEngagementDrop(recentEvents, currentMetrics);
  if (engagementIndicator) indicators.push(engagementIndicator);

  // Check for difficulty mismatch
  const difficultyIndicator = checkDifficultyMismatch(currentMetrics);
  if (difficultyIndicator) indicators.push(difficultyIndicator);

  // Calculate overall severity
  const overallSeverity = calculateOverallSeverity(indicators);
  const isStruggling = overallSeverity !== 'none';

  // Generate intervention recommendation
  const recommendedIntervention = isStruggling
    ? generateIntervention(indicators, overallSeverity)
    : undefined;

  return {
    isStruggling,
    indicators,
    overallSeverity,
    recommendedIntervention,
  };
}

/**
 * Check if student is spending too much/too little time
 */
function checkTimeOnTask(
  events: InteractionEvent[],
  expectedTime: number
): StruggleIndicator | null {
  const interactionStarts = events.filter(e => e.type === 'interaction_started');
  const interactionCompletions = events.filter(e => e.type === 'interaction_completed');

  if (interactionStarts.length === 0) return null;

  // Calculate average time per interaction
  const timesSpent = interactionCompletions
    .filter(e => e.timeSpent !== undefined)
    .map(e => e.timeSpent!);

  if (timesSpent.length === 0) return null;

  const avgTime = timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length;
  const ratio = avgTime / expectedTime;

  // Too slow - might be struggling to understand
  if (ratio > 2.5) {
    return {
      type: 'time_on_task',
      severity: ratio > 4 ? 'high' : 'medium',
      confidence: Math.min(0.9, 0.5 + (ratio - 2.5) * 0.1),
      description: 'Taking significantly longer than expected on interactions',
      suggestedAction: 'Consider offering simpler explanation or scaffolding',
      dataPoints: {
        averageTime: Math.round(avgTime),
        expectedTime,
        ratio: ratio.toFixed(2),
      },
    };
  }

  // Too fast with errors - might be rushing
  if (ratio < 0.3) {
    const recentAnswers = events.filter(e => e.type === 'answer_submitted');
    const incorrectCount = recentAnswers.filter(e => e.correct === false).length;
    const errorRate = recentAnswers.length > 0 ? incorrectCount / recentAnswers.length : 0;

    if (errorRate > 0.5) {
      return {
        type: 'time_on_task',
        severity: 'medium',
        confidence: 0.7,
        description: 'Rushing through content with errors',
        suggestedAction: 'Encourage slower, more careful reading',
        dataPoints: {
          averageTime: Math.round(avgTime),
          expectedTime,
          errorRate: (errorRate * 100).toFixed(0) + '%',
        },
      };
    }
  }

  return null;
}

/**
 * Check for repeated incorrect answers
 */
function checkRepeatedErrors(events: InteractionEvent[]): StruggleIndicator | null {
  const answers = events.filter(e => e.type === 'answer_submitted');
  if (answers.length < 3) return null;

  // Look at last 5 answers
  const recentAnswers = answers.slice(-5);
  const incorrectCount = recentAnswers.filter(e => e.correct === false).length;

  // Check for consecutive errors
  let consecutiveErrors = 0;
  let maxConsecutive = 0;

  for (const answer of recentAnswers) {
    if (answer.correct === false) {
      consecutiveErrors++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveErrors);
    } else {
      consecutiveErrors = 0;
    }
  }

  if (maxConsecutive >= 3 || incorrectCount >= 4) {
    return {
      type: 'repeated_errors',
      severity: maxConsecutive >= 4 ? 'high' : 'medium',
      confidence: 0.85,
      description: `${maxConsecutive} consecutive incorrect answers`,
      suggestedAction: 'Provide hint or review prerequisite concept',
      dataPoints: {
        consecutiveErrors: maxConsecutive,
        recentErrorRate: ((incorrectCount / recentAnswers.length) * 100).toFixed(0) + '%',
      },
    };
  }

  return null;
}

/**
 * Check for excessive help seeking
 */
function checkHelpSeeking(events: InteractionEvent[]): StruggleIndicator | null {
  const last10Minutes = Date.now() - 10 * 60 * 1000;
  const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > last10Minutes);

  const hintRequests = recentEvents.filter(e => e.type === 'hint_requested');
  const interactions = recentEvents.filter(
    e => e.type === 'interaction_started' || e.type === 'interaction_completed'
  );

  if (interactions.length === 0) return null;

  const hintRatio = hintRequests.length / Math.max(1, interactions.length / 2);

  if (hintRatio > 0.8 && hintRequests.length >= 3) {
    return {
      type: 'help_seeking',
      severity: hintRatio > 1.5 ? 'high' : 'medium',
      confidence: 0.75,
      description: 'Requesting hints frequently',
      suggestedAction: 'Review foundational concepts or offer tutoring support',
      dataPoints: {
        hintsRequested: hintRequests.length,
        interactions: Math.floor(interactions.length / 2),
        windowMinutes: 10,
      },
    };
  }

  return null;
}

/**
 * Check for engagement drop
 */
function checkEngagementDrop(
  events: InteractionEvent[],
  metrics: Partial<ExtendedLearningMetrics>
): StruggleIndicator | null {
  // Check for long gaps between events
  if (events.length < 2) return null;

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const gaps: number[] = [];
  for (let i = 1; i < sortedEvents.length; i++) {
    const gap = new Date(sortedEvents[i].timestamp).getTime() -
                new Date(sortedEvents[i - 1].timestamp).getTime();
    gaps.push(gap / 1000); // Convert to seconds
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const maxGap = Math.max(...gaps);

  // If there's a very long gap (more than 5 minutes in a session)
  if (maxGap > 300) {
    return {
      type: 'engagement_drop',
      severity: maxGap > 600 ? 'high' : 'medium',
      confidence: 0.6,
      description: 'Extended pause detected during learning session',
      suggestedAction: 'Check in with student or suggest a break',
      dataPoints: {
        maxGapSeconds: Math.round(maxGap),
        avgGapSeconds: Math.round(avgGap),
      },
    };
  }

  // Check declining trend from metrics
  if (metrics.recentTrend === 'declining') {
    return {
      type: 'engagement_drop',
      severity: 'low',
      confidence: 0.5,
      description: 'Performance trending downward',
      suggestedAction: 'Offer encouragement and check understanding',
      dataPoints: {
        trend: 'declining',
        accuracy: metrics.interactionAccuracy || 0,
      },
    };
  }

  return null;
}

/**
 * Check for difficulty mismatch
 */
function checkDifficultyMismatch(
  metrics: Partial<ExtendedLearningMetrics>
): StruggleIndicator | null {
  const accuracy = metrics.interactionAccuracy || 0;
  const difficulty = metrics.adaptiveDifficulty || 5;
  const incorrectStreak = metrics.incorrectStreak || 0;

  // High difficulty with low accuracy
  if (difficulty >= 7 && accuracy < 50 && incorrectStreak >= 2) {
    return {
      type: 'difficulty_mismatch',
      severity: 'high',
      confidence: 0.8,
      description: 'Content difficulty exceeds current skill level',
      suggestedAction: 'Lower difficulty and provide additional support',
      dataPoints: {
        currentDifficulty: difficulty,
        accuracy: accuracy + '%',
        incorrectStreak,
      },
    };
  }

  // Moderate mismatch
  if (difficulty >= 5 && accuracy < 40) {
    return {
      type: 'difficulty_mismatch',
      severity: 'medium',
      confidence: 0.7,
      description: 'Struggling with current difficulty level',
      suggestedAction: 'Consider reducing difficulty temporarily',
      dataPoints: {
        currentDifficulty: difficulty,
        accuracy: accuracy + '%',
      },
    };
  }

  return null;
}

/**
 * Calculate overall severity from all indicators
 */
function calculateOverallSeverity(
  indicators: StruggleIndicator[]
): 'none' | 'low' | 'medium' | 'high' {
  if (indicators.length === 0) return 'none';

  const severityScores = {
    low: 1,
    medium: 2,
    high: 3,
  };

  // Weight by confidence
  let weightedScore = 0;
  let totalWeight = 0;

  for (const indicator of indicators) {
    const score = severityScores[indicator.severity];
    const weight = indicator.confidence;
    weightedScore += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 'none';

  const avgScore = weightedScore / totalWeight;

  if (avgScore >= 2.5) return 'high';
  if (avgScore >= 1.5) return 'medium';
  if (avgScore >= 0.5) return 'low';
  return 'none';
}

/**
 * Generate appropriate intervention based on indicators
 */
function generateIntervention(
  indicators: StruggleIndicator[],
  severity: 'low' | 'medium' | 'high'
): StruggleDetectionResult['recommendedIntervention'] {
  // Find the most severe indicator
  const severityOrder = ['high', 'medium', 'low'] as const;
  let primaryIndicator: StruggleIndicator | undefined;

  for (const sev of severityOrder) {
    primaryIndicator = indicators.find(i => i.severity === sev);
    if (primaryIndicator) break;
  }

  if (!primaryIndicator) {
    return {
      type: 'hint',
      message: 'Need some help? Click here for a hint.',
    };
  }

  switch (primaryIndicator.type) {
    case 'repeated_errors':
      if (severity === 'high') {
        return {
          type: 'review',
          message: "Let's review the key concepts before continuing.",
          action: 'show_concept_review',
        };
      }
      return {
        type: 'hint',
        message: 'Would you like a hint to help you solve this?',
        action: 'show_hint',
      };

    case 'time_on_task':
      if (primaryIndicator.description.includes('rushing')) {
        return {
          type: 'scaffolding',
          message: 'Take your time! Read through the question carefully.',
        };
      }
      return {
        type: 'simplify',
        message: "This concept can be tricky. Let me explain it differently.",
        action: 'show_simplified',
      };

    case 'help_seeking':
      return {
        type: 'tutor',
        message: 'Would you like to chat with the AI tutor about this topic?',
        action: 'open_tutor_chat',
      };

    case 'engagement_drop':
      return {
        type: 'break',
        message: 'You\'ve been working hard! Consider taking a short break.',
      };

    case 'difficulty_mismatch':
      return {
        type: 'simplify',
        message: 'Let me show you an easier version of this concept first.',
        action: 'reduce_difficulty',
      };

    default:
      return {
        type: 'hint',
        message: 'Need some help? I\'m here to assist you.',
      };
  }
}

/**
 * Track and aggregate struggle indicators over time
 */
export class StruggleTracker {
  private events: InteractionEvent[] = [];
  private maxEvents: number = 50;

  addEvent(event: Omit<InteractionEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: new Date(),
    });

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getEvents(): InteractionEvent[] {
    return [...this.events];
  }

  analyze(
    metrics: Partial<ExtendedLearningMetrics>,
    expectedTime?: number
  ): StruggleDetectionResult {
    return detectStruggle(this.events, metrics, expectedTime);
  }

  clear(): void {
    this.events = [];
  }
}

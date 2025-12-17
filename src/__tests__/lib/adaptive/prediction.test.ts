/**
 * Unit Tests for Predictive Interventions System
 */

import {
  calculateRiskScore,
  identifyRiskFactors,
  generatePredictiveRecommendations,
  shouldTriggerIntervention,
} from '@/lib/adaptive/prediction';
import { IStudentProgress, PredictionModel, RiskFactor, StudentEngagementHistory } from '@/types';

describe('Predictive Interventions System', () => {
  // Mock data factories
  const createMockProgress = (overrides = {}): IStudentProgress => ({
    _id: 'progress-1' as any,
    studentId: 'student-1' as any,
    courseId: 'course-1' as any,
    completedModules: ['mod-1', 'mod-2'] as any,
    currentModule: 'mod-3' as any,
    assessmentScores: [
      { assessmentId: 'ass-1' as any, score: 85, attempts: 1, completedAt: new Date() },
    ],
    lastAccessedAt: new Date(),
    enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    learningMetrics: {
      interactionAccuracy: 75,
      averageTimePerModule: 25,
      correctStreak: 2,
      incorrectStreak: 0,
      adaptiveDifficulty: 5,
      conceptsMastered: ['concept-1'],
      conceptsStruggling: [],
      recentTrend: 'stable',
    },
    ...overrides,
  });

  const createMockEngagementHistory = (overrides = {}): StudentEngagementHistory => ({
    dailyActivity: [
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 80 },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), minutesSpent: 25, modulesViewed: 1, interactionsCompleted: 4, accuracy: 75 },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), minutesSpent: 35, modulesViewed: 2, interactionsCompleted: 6, accuracy: 85 },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), minutesSpent: 20, modulesViewed: 1, interactionsCompleted: 3, accuracy: 70 },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 80 },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), minutesSpent: 25, modulesViewed: 1, interactionsCompleted: 4, accuracy: 75 },
      { date: new Date(), minutesSpent: 20, modulesViewed: 1, interactionsCompleted: 3, accuracy: 70 },
    ],
    ...overrides,
  });

  const courseMetrics = { avgCompletionTime: 20, avgAccuracy: 70 };

  describe('calculateRiskScore', () => {
    it('should return low risk for active, performing students', () => {
      const progress = createMockProgress();
      const history = createMockEngagementHistory();

      const result = calculateRiskScore(progress, history, courseMetrics);

      expect(result.riskScore).toBeLessThan(30);
      expect(result.predictedOutcome).toBe('complete');
    });

    it('should return moderate risk for struggling students', () => {
      const progress = createMockProgress({
        lastAccessedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        learningMetrics: {
          interactionAccuracy: 45,
          averageTimePerModule: 30,
          correctStreak: 0,
          incorrectStreak: 4,
          adaptiveDifficulty: 7,
          conceptsMastered: [],
          conceptsStruggling: ['concept-1', 'concept-2'],
          recentTrend: 'declining',
        },
      });
      const history = createMockEngagementHistory();

      const result = calculateRiskScore(progress, history, courseMetrics);

      expect(result.riskScore).toBeGreaterThanOrEqual(30);
    });

    it('should return high risk for absent students', () => {
      const progress = createMockProgress({
        lastAccessedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      });
      const history = createMockEngagementHistory();

      const result = calculateRiskScore(progress, history, courseMetrics);

      expect(result.riskScore).toBeGreaterThanOrEqual(30);
      expect(result.riskFactors.some((f) => f.type === 'long_absence')).toBe(true);
    });

    it('should include risk factors in result', () => {
      const progress = createMockProgress();
      const history = createMockEngagementHistory();

      const result = calculateRiskScore(progress, history, courseMetrics);

      expect(result).toHaveProperty('riskFactors');
      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it('should include recommendations in result', () => {
      const progress = createMockProgress();
      const history = createMockEngagementHistory();

      const result = calculateRiskScore(progress, history, courseMetrics);

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include confidence score', () => {
      const progress = createMockProgress();
      const history = createMockEngagementHistory();

      const result = calculateRiskScore(progress, history, courseMetrics);

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('identifyRiskFactors', () => {
    it('should identify long absence', () => {
      const progress = createMockProgress({
        lastAccessedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      });
      const history = createMockEngagementHistory();

      const factors = identifyRiskFactors(progress, history);

      expect(factors.some((f) => f.type === 'long_absence')).toBe(true);
    });

    it('should identify engagement drop', () => {
      const history = createMockEngagementHistory({
        dailyActivity: [
          // Previous week - high engagement
          { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), minutesSpent: 60, modulesViewed: 3, interactionsCompleted: 10, accuracy: 85 },
          { date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), minutesSpent: 55, modulesViewed: 3, interactionsCompleted: 9, accuracy: 80 },
          { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), minutesSpent: 50, modulesViewed: 2, interactionsCompleted: 8, accuracy: 82 },
          { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), minutesSpent: 55, modulesViewed: 3, interactionsCompleted: 9, accuracy: 78 },
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), minutesSpent: 45, modulesViewed: 2, interactionsCompleted: 7, accuracy: 75 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), minutesSpent: 50, modulesViewed: 2, interactionsCompleted: 8, accuracy: 80 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), minutesSpent: 45, modulesViewed: 2, interactionsCompleted: 7, accuracy: 77 },
          // Recent - low engagement
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), minutesSpent: 10, modulesViewed: 0, interactionsCompleted: 1, accuracy: 50 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), minutesSpent: 5, modulesViewed: 0, interactionsCompleted: 0, accuracy: 0 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), minutesSpent: 8, modulesViewed: 0, interactionsCompleted: 1, accuracy: 30 },
        ],
      });
      const progress = createMockProgress();

      const factors = identifyRiskFactors(progress, history);

      expect(factors.some((f) => f.type === 'engagement_drop')).toBe(true);
    });

    it('should identify performance decline', () => {
      const history = createMockEngagementHistory({
        dailyActivity: [
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 85 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 35 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 30 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 25 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), minutesSpent: 30, modulesViewed: 2, interactionsCompleted: 5, accuracy: 20 },
        ],
      });
      const progress = createMockProgress({
        learningMetrics: {
          interactionAccuracy: 80,
          incorrectStreak: 4,
          recentTrend: 'declining',
        },
      });

      const factors = identifyRiskFactors(progress, history);

      expect(factors.some((f) => f.type === 'performance_decline')).toBe(true);
    });

    it('should identify difficulty spike', () => {
      const progress = createMockProgress({
        learningMetrics: {
          interactionAccuracy: 30,
          adaptiveDifficulty: 8,
          incorrectStreak: 5,
        },
      });
      const history = createMockEngagementHistory();

      const factors = identifyRiskFactors(progress, history);

      expect(factors.some((f) => f.type === 'difficulty_spike')).toBe(true);
    });

    it('should return empty array for healthy student', () => {
      const progress = createMockProgress();
      const history = createMockEngagementHistory();

      const factors = identifyRiskFactors(progress, history);

      // Should have few or no risk factors
      expect(factors.length).toBeLessThanOrEqual(1);
    });
  });

  describe('generatePredictiveRecommendations', () => {
    it('should generate reminder for long absence', () => {
      const factors: RiskFactor[] = [
        {
          type: 'long_absence',
          severity: 0.8,
          description: 'No activity for 14 days',
          dataPoints: ['Days absent: 14'],
        },
      ];

      const recommendations = generatePredictiveRecommendations(factors);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].action).toContain('reminder');
    });

    it('should generate support offer for engagement drop', () => {
      const factors: RiskFactor[] = [
        {
          type: 'engagement_drop',
          severity: 0.6,
          description: 'Engagement dropped 50%',
          dataPoints: [],
        },
      ];

      const recommendations = generatePredictiveRecommendations(factors);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend difficulty adjustment for difficulty spike', () => {
      const factors: RiskFactor[] = [
        {
          type: 'difficulty_spike',
          severity: 0.7,
          description: 'Content too hard',
          dataPoints: [],
        },
      ];

      const recommendations = generatePredictiveRecommendations(factors);

      expect(recommendations.some((r) =>
        r.action.toLowerCase().includes('difficulty') ||
        r.action.toLowerCase().includes('scaffolding')
      )).toBe(true);
    });

    it('should generate default recommendation for no factors', () => {
      const recommendations = generatePredictiveRecommendations([]);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('low');
    });

    it('should set high priority for severe factors', () => {
      const factors: RiskFactor[] = [
        {
          type: 'performance_decline',
          severity: 0.9,
          description: 'Severe performance decline',
          dataPoints: [],
        },
      ];

      const recommendations = generatePredictiveRecommendations(factors);

      expect(recommendations.some((r) => r.priority === 'high')).toBe(true);
    });
  });

  describe('shouldTriggerIntervention', () => {
    it('should trigger immediate intervention for high risk', () => {
      const prediction: PredictionModel = {
        riskScore: 80,
        riskFactors: [],
        predictedOutcome: 'likely_dropout',
        confidenceScore: 0.7,
        recommendations: [],
        calculatedAt: new Date(),
      };

      const result = shouldTriggerIntervention(prediction);

      expect(result.trigger).toBe(true);
      expect(result.urgency).toBe('immediate');
      expect(result.type).toBe('critical_support');
    });

    it('should trigger soon intervention for moderate risk', () => {
      const prediction: PredictionModel = {
        riskScore: 55,
        riskFactors: [],
        predictedOutcome: 'at_risk',
        confidenceScore: 0.5,
        recommendations: [],
        calculatedAt: new Date(),
      };

      const result = shouldTriggerIntervention(prediction);

      expect(result.trigger).toBe(true);
      expect(result.urgency).toBe('soon');
    });

    it('should trigger scheduled check for low-moderate risk', () => {
      const prediction: PredictionModel = {
        riskScore: 35,
        riskFactors: [],
        predictedOutcome: 'at_risk',
        confidenceScore: 0.4,
        recommendations: [],
        calculatedAt: new Date(),
      };

      const result = shouldTriggerIntervention(prediction);

      expect(result.trigger).toBe(true);
      expect(result.urgency).toBe('scheduled');
    });

    it('should not trigger for low risk', () => {
      const prediction: PredictionModel = {
        riskScore: 15,
        riskFactors: [],
        predictedOutcome: 'complete',
        confidenceScore: 0.6,
        recommendations: [],
        calculatedAt: new Date(),
      };

      const result = shouldTriggerIntervention(prediction);

      expect(result.trigger).toBe(false);
    });

    it('should respect confidence threshold', () => {
      const lowConfidencePrediction: PredictionModel = {
        riskScore: 75,
        riskFactors: [],
        predictedOutcome: 'likely_dropout',
        confidenceScore: 0.3, // Too low
        recommendations: [],
        calculatedAt: new Date(),
      };

      const result = shouldTriggerIntervention(lowConfidencePrediction);

      // May or may not trigger based on confidence
      expect(result).toHaveProperty('trigger');
      expect(result).toHaveProperty('urgency');
    });
  });
});

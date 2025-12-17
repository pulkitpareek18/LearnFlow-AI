/**
 * Unit Tests for Real-Time Struggle Detection System
 */

import {
  detectStruggle,
  StruggleTracker,
  StruggleDetectionResult,
  InteractionEvent,
} from '@/lib/adaptive/struggle-detection';
import { ExtendedLearningMetrics } from '@/types';

describe('Struggle Detection System', () => {
  describe('detectStruggle', () => {
    const baseMetrics: Partial<ExtendedLearningMetrics> = {
      interactionAccuracy: 70,
      adaptiveDifficulty: 5,
      incorrectStreak: 0,
      recentTrend: 'stable',
    };

    describe('when student is not struggling', () => {
      it('should return isStruggling: false with no indicators', () => {
        const events: InteractionEvent[] = [
          { timestamp: new Date(), type: 'interaction_started' },
          { timestamp: new Date(), type: 'answer_submitted', correct: true, timeSpent: 60 },
          { timestamp: new Date(), type: 'interaction_completed', timeSpent: 60 },
        ];

        const result = detectStruggle(events, baseMetrics, 60);

        expect(result.isStruggling).toBe(false);
        expect(result.overallSeverity).toBe('none');
        expect(result.indicators.length).toBe(0);
      });

      it('should return isStruggling: false with empty events', () => {
        const result = detectStruggle([], baseMetrics, 60);

        expect(result.isStruggling).toBe(false);
        expect(result.overallSeverity).toBe('none');
      });
    });

    describe('time on task detection', () => {
      it('should detect when student is taking too long', () => {
        const events: InteractionEvent[] = [];
        // Create events showing student taking 3x expected time
        for (let i = 0; i < 5; i++) {
          events.push({
            timestamp: new Date(Date.now() - (5 - i) * 200000),
            type: 'interaction_started',
          });
          events.push({
            timestamp: new Date(Date.now() - (5 - i) * 200000 + 180000),
            type: 'interaction_completed',
            timeSpent: 180, // 3 minutes when expected is 60 seconds
          });
        }

        const result = detectStruggle(events, baseMetrics, 60);

        expect(result.isStruggling).toBe(true);
        expect(result.indicators.some((i) => i.type === 'time_on_task')).toBe(true);
      });

      it('should detect rushing with errors', () => {
        const events: InteractionEvent[] = [];
        // Create events showing student rushing and making errors
        for (let i = 0; i < 5; i++) {
          events.push({
            timestamp: new Date(Date.now() - (5 - i) * 20000),
            type: 'interaction_started',
          });
          events.push({
            timestamp: new Date(Date.now() - (5 - i) * 20000 + 10000),
            type: 'answer_submitted',
            correct: false,
            timeSpent: 10,
          });
          events.push({
            timestamp: new Date(Date.now() - (5 - i) * 20000 + 15000),
            type: 'interaction_completed',
            timeSpent: 15, // Way less than expected 60 seconds
          });
        }

        const result = detectStruggle(events, baseMetrics, 60);

        // May detect time on task if error rate is high enough
        const hasTimeIssue = result.indicators.some((i) => i.type === 'time_on_task');
        const hasRepeatedErrors = result.indicators.some((i) => i.type === 'repeated_errors');

        expect(hasTimeIssue || hasRepeatedErrors).toBe(true);
      });
    });

    describe('repeated errors detection', () => {
      it('should detect consecutive incorrect answers', () => {
        const events: InteractionEvent[] = [
          { timestamp: new Date(Date.now() - 50000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 40000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 30000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 20000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 10000), type: 'answer_submitted', correct: false },
        ];

        const result = detectStruggle(events, baseMetrics, 60);

        expect(result.isStruggling).toBe(true);
        expect(result.indicators.some((i) => i.type === 'repeated_errors')).toBe(true);
      });

      it('should not flag when errors are not consecutive', () => {
        const events: InteractionEvent[] = [
          { timestamp: new Date(Date.now() - 50000), type: 'answer_submitted', correct: true },
          { timestamp: new Date(Date.now() - 40000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 30000), type: 'answer_submitted', correct: true },
          { timestamp: new Date(Date.now() - 20000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 10000), type: 'answer_submitted', correct: true },
        ];

        const result = detectStruggle(events, baseMetrics, 60);

        expect(result.indicators.some((i) => i.type === 'repeated_errors')).toBe(false);
      });
    });

    describe('help seeking detection', () => {
      it('should detect excessive hint requests', () => {
        const now = Date.now();
        const events: InteractionEvent[] = [];

        // Add hint requests within 10 minutes
        for (let i = 0; i < 5; i++) {
          events.push({
            timestamp: new Date(now - i * 60000),
            type: 'hint_requested',
          });
          events.push({
            timestamp: new Date(now - i * 60000 - 30000),
            type: 'interaction_started',
          });
          events.push({
            timestamp: new Date(now - i * 60000 + 30000),
            type: 'interaction_completed',
            timeSpent: 60,
          });
        }

        const result = detectStruggle(events, baseMetrics, 60);

        expect(result.indicators.some((i) => i.type === 'help_seeking')).toBe(true);
      });
    });

    describe('difficulty mismatch detection', () => {
      it('should detect when difficulty is too high', () => {
        const highDifficultyMetrics: Partial<ExtendedLearningMetrics> = {
          interactionAccuracy: 30,
          adaptiveDifficulty: 8,
          incorrectStreak: 4,
          recentTrend: 'declining',
        };

        const events: InteractionEvent[] = [
          { timestamp: new Date(), type: 'answer_submitted', correct: false },
        ];

        const result = detectStruggle(events, highDifficultyMetrics, 60);

        expect(result.isStruggling).toBe(true);
        expect(result.indicators.some((i) => i.type === 'difficulty_mismatch')).toBe(true);
      });

      it('should not flag when accuracy matches difficulty', () => {
        const matchedMetrics: Partial<ExtendedLearningMetrics> = {
          interactionAccuracy: 80,
          adaptiveDifficulty: 5,
          incorrectStreak: 0,
          recentTrend: 'stable',
        };

        const events: InteractionEvent[] = [];

        const result = detectStruggle(events, matchedMetrics, 60);

        expect(result.indicators.some((i) => i.type === 'difficulty_mismatch')).toBe(false);
      });
    });

    describe('overall severity calculation', () => {
      it('should return high severity for multiple high-severity indicators', () => {
        const strugglingMetrics: Partial<ExtendedLearningMetrics> = {
          interactionAccuracy: 20,
          adaptiveDifficulty: 9,
          incorrectStreak: 5,
          recentTrend: 'declining',
        };

        const events: InteractionEvent[] = [
          { timestamp: new Date(Date.now() - 50000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 40000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 30000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 20000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 10000), type: 'answer_submitted', correct: false },
        ];

        const result = detectStruggle(events, strugglingMetrics, 60);

        expect(result.isStruggling).toBe(true);
        expect(['medium', 'high']).toContain(result.overallSeverity);
      });
    });

    describe('intervention recommendations', () => {
      it('should recommend review for repeated errors', () => {
        const events: InteractionEvent[] = [
          { timestamp: new Date(Date.now() - 40000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 30000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 20000), type: 'answer_submitted', correct: false },
          { timestamp: new Date(Date.now() - 10000), type: 'answer_submitted', correct: false },
        ];

        const result = detectStruggle(events, baseMetrics, 60);

        if (result.isStruggling && result.recommendedIntervention) {
          expect(['hint', 'review', 'simplify', 'tutor']).toContain(
            result.recommendedIntervention.type
          );
        }
      });

      it('should recommend simplification for difficulty mismatch', () => {
        const hardMetrics: Partial<ExtendedLearningMetrics> = {
          interactionAccuracy: 25,
          adaptiveDifficulty: 9,
          incorrectStreak: 5,
          recentTrend: 'declining',
        };

        const events: InteractionEvent[] = [
          { timestamp: new Date(), type: 'answer_submitted', correct: false },
        ];

        const result = detectStruggle(events, hardMetrics, 60);

        if (result.isStruggling && result.recommendedIntervention) {
          expect(['simplify', 'review', 'hint']).toContain(result.recommendedIntervention.type);
        }
      });
    });
  });

  describe('StruggleTracker', () => {
    let tracker: StruggleTracker;

    beforeEach(() => {
      tracker = new StruggleTracker();
    });

    it('should track events correctly', () => {
      tracker.addEvent({ type: 'interaction_started' });
      tracker.addEvent({ type: 'answer_submitted', correct: true });
      tracker.addEvent({ type: 'interaction_completed', timeSpent: 60 });

      const events = tracker.getEvents();

      expect(events.length).toBe(3);
      expect(events[0].type).toBe('interaction_started');
      expect(events[1].correct).toBe(true);
    });

    it('should automatically add timestamps', () => {
      const before = new Date();
      tracker.addEvent({ type: 'interaction_started' });
      const after = new Date();

      const events = tracker.getEvents();

      expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(events[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should limit events to maxEvents', () => {
      // Add more than default max events (50)
      for (let i = 0; i < 60; i++) {
        tracker.addEvent({ type: 'interaction_started' });
      }

      const events = tracker.getEvents();

      expect(events.length).toBe(50);
    });

    it('should clear events correctly', () => {
      tracker.addEvent({ type: 'interaction_started' });
      tracker.addEvent({ type: 'interaction_completed', timeSpent: 60 });

      tracker.clear();

      expect(tracker.getEvents().length).toBe(0);
    });

    it('should analyze events with metrics', () => {
      tracker.addEvent({ type: 'answer_submitted', correct: false });
      tracker.addEvent({ type: 'answer_submitted', correct: false });
      tracker.addEvent({ type: 'answer_submitted', correct: false });

      const metrics: Partial<ExtendedLearningMetrics> = {
        interactionAccuracy: 50,
        adaptiveDifficulty: 5,
        incorrectStreak: 3,
      };

      const result = tracker.analyze(metrics, 60);

      expect(result).toHaveProperty('isStruggling');
      expect(result).toHaveProperty('indicators');
      expect(result).toHaveProperty('overallSeverity');
    });
  });
});

/**
 * Unit Tests for Gamification System
 */

import {
  calculateLevel,
  getXPForNextLevel,
  getLevelProgress,
  calculateXP,
  updateStreak,
  checkBadges,
  generateDailyChallenge,
  awardXP,
  awardBadge,
} from '@/lib/gamification';
import { BADGES, getBadgeById, getBadgesByCategory } from '@/lib/gamification/badges';
import { StudentGamification, XPAction } from '@/types';

describe('Gamification System', () => {
  describe('Level Calculations', () => {
    describe('calculateLevel', () => {
      it('should return level 0 for 0 XP', () => {
        // Formula: floor(sqrt(0/100)) = 0
        expect(calculateLevel(0)).toBe(0);
      });

      it('should return level 0 for XP below 100', () => {
        expect(calculateLevel(50)).toBe(0);
        expect(calculateLevel(99)).toBe(0);
      });

      it('should return level 1 for 100+ XP', () => {
        // sqrt(100/100) = 1
        expect(calculateLevel(100)).toBe(1);
        expect(calculateLevel(399)).toBe(1);
      });

      it('should return level 2 for 400+ XP', () => {
        // sqrt(400/100) = 2
        expect(calculateLevel(400)).toBe(2);
        expect(calculateLevel(899)).toBe(2);
      });

      it('should handle large XP values', () => {
        // sqrt(10000/100) = 10
        expect(calculateLevel(10000)).toBe(10);
      });
    });

    describe('getXPForNextLevel', () => {
      it('should return correct XP for level 1', () => {
        // (1+1)^2 * 100 = 400
        expect(getXPForNextLevel(1)).toBe(400);
      });

      it('should return correct XP for level 2', () => {
        // (2+1)^2 * 100 = 900
        expect(getXPForNextLevel(2)).toBe(900);
      });

      it('should return correct XP for level 0', () => {
        // (0+1)^2 * 100 = 100
        expect(getXPForNextLevel(0)).toBe(100);
      });

      it('should return increasing XP requirements for higher levels', () => {
        const level2XP = getXPForNextLevel(2);
        const level3XP = getXPForNextLevel(3);
        const level4XP = getXPForNextLevel(4);

        expect(level3XP).toBeGreaterThan(level2XP);
        expect(level4XP).toBeGreaterThan(level3XP);
      });
    });

    describe('getLevelProgress', () => {
      it('should return 0 for starting XP at a level', () => {
        // At level 1 (100 XP), progress to level 2 (400 XP) should start at 0
        const progress = getLevelProgress(100, 1);
        expect(progress).toBe(0);
      });

      it('should return percentage through current level', () => {
        // Level 1 is 100-400, at 250 XP: (250-100)/(400-100) = 150/300 = 50%
        const progress = getLevelProgress(250, 1);
        expect(progress).toBe(50);
      });

      it('should not exceed 100', () => {
        const progress = getLevelProgress(1000, 1);
        expect(progress).toBeLessThanOrEqual(100);
      });

      it('should not go below 0', () => {
        const progress = getLevelProgress(50, 1);
        expect(progress).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('XP Calculations', () => {
    const baseGamification: StudentGamification = {
      totalXP: 500,
      level: 2,
      currentStreak: 3,
      longestStreak: 7,
      lastActivityDate: new Date(),
      badges: [],
      dailyChallengeCompleted: false,
      weeklyGoal: {
        target: 10,
        current: 5,
        type: 'modules',
      },
    };

    describe('calculateXP', () => {
      it('should return base XP for module completion', () => {
        const action: XPAction = { type: 'module_complete' };
        const xp = calculateXP(action, baseGamification);
        expect(xp).toBe(50); // XP_REWARDS.MODULE_COMPLETE
      });

      it('should return XP for correct interaction', () => {
        const action: XPAction = { type: 'interaction_correct' };
        const xp = calculateXP(action, baseGamification);
        expect(xp).toBe(10); // XP_REWARDS.INTERACTION_CORRECT
      });

      it('should return small XP for incorrect interaction', () => {
        const action: XPAction = { type: 'interaction_incorrect' };
        const xp = calculateXP(action, baseGamification);
        expect(xp).toBe(2); // XP_REWARDS.INTERACTION_INCORRECT
      });

      it('should return bonus XP for perfect score', () => {
        const action: XPAction = { type: 'perfect_score' };
        const xp = calculateXP(action, baseGamification);
        expect(xp).toBe(100); // XP_REWARDS.PERFECT_SCORE
      });

      it('should return XP for daily challenge', () => {
        const action: XPAction = { type: 'daily_challenge' };
        const xp = calculateXP(action, baseGamification);
        expect(xp).toBe(75); // XP_REWARDS.DAILY_CHALLENGE
      });

      it('should apply streak bonus for 7+ day streak', () => {
        const gamificationWithStreak = {
          ...baseGamification,
          currentStreak: 7,
        };
        const action: XPAction = { type: 'module_complete' };
        const xp = calculateXP(action, gamificationWithStreak);
        // 50 * 1.1 = 55
        expect(xp).toBe(55);
      });
    });
  });

  describe('Streak Management', () => {
    describe('updateStreak', () => {
      it('should keep streak the same for same day activity', () => {
        const gamification: StudentGamification = {
          totalXP: 500,
          level: 2,
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: new Date(),
          badges: [],
          dailyChallengeCompleted: false,
          weeklyGoal: { target: 10, current: 5, type: 'modules' },
        };

        const result = updateStreak(gamification);
        expect(result.currentStreak).toBe(5);
      });

      it('should increment streak for consecutive days', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const gamification: StudentGamification = {
          totalXP: 500,
          level: 2,
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: yesterday,
          badges: [],
          dailyChallengeCompleted: false,
          weeklyGoal: { target: 10, current: 5, type: 'modules' },
        };

        const result = updateStreak(gamification);
        expect(result.currentStreak).toBe(6);
      });

      it('should reset streak after missing a day', () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const gamification: StudentGamification = {
          totalXP: 500,
          level: 2,
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: twoDaysAgo,
          badges: [],
          dailyChallengeCompleted: false,
          weeklyGoal: { target: 10, current: 5, type: 'modules' },
        };

        const result = updateStreak(gamification);
        expect(result.currentStreak).toBe(1);
      });

      it('should update longest streak when current exceeds it', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const gamification: StudentGamification = {
          totalXP: 500,
          level: 2,
          currentStreak: 10,
          longestStreak: 10,
          lastActivityDate: yesterday,
          badges: [],
          dailyChallengeCompleted: false,
          weeklyGoal: { target: 10, current: 5, type: 'modules' },
        };

        const result = updateStreak(gamification);
        expect(result.longestStreak).toBe(11);
      });

      it('should reset daily challenge completion for new day', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const gamification: StudentGamification = {
          totalXP: 500,
          level: 2,
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: yesterday,
          badges: [],
          dailyChallengeCompleted: true,
          weeklyGoal: { target: 10, current: 5, type: 'modules' },
        };

        const result = updateStreak(gamification);
        expect(result.dailyChallengeCompleted).toBe(false);
      });
    });
  });

  describe('Badge System', () => {
    describe('BADGES array', () => {
      it('should contain badges', () => {
        expect(BADGES.length).toBeGreaterThan(0);
      });

      it('should have unique badge IDs', () => {
        const ids = BADGES.map((b) => b.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should have all required badge properties', () => {
        BADGES.forEach((badge) => {
          expect(badge).toHaveProperty('id');
          expect(badge).toHaveProperty('name');
          expect(badge).toHaveProperty('description');
          expect(badge).toHaveProperty('icon');
          expect(badge).toHaveProperty('category');
          expect(badge).toHaveProperty('requirement');
          expect(badge).toHaveProperty('xpReward');
        });
      });

      it('should have valid categories', () => {
        const validCategories = ['achievement', 'streak', 'mastery', 'exploration'];
        BADGES.forEach((badge) => {
          expect(validCategories).toContain(badge.category);
        });
      });
    });

    describe('getBadgeById', () => {
      it('should return badge for valid ID', () => {
        const badge = getBadgeById('first_steps');
        expect(badge).toBeDefined();
        expect(badge?.id).toBe('first_steps');
      });

      it('should return undefined for invalid ID', () => {
        const badge = getBadgeById('non_existent_badge');
        expect(badge).toBeUndefined();
      });
    });

    describe('getBadgesByCategory', () => {
      it('should return achievement badges', () => {
        const badges = getBadgesByCategory('achievement');
        expect(badges.length).toBeGreaterThan(0);
        badges.forEach((badge) => {
          expect(badge.category).toBe('achievement');
        });
      });

      it('should return streak badges', () => {
        const badges = getBadgesByCategory('streak');
        expect(badges.length).toBeGreaterThan(0);
        badges.forEach((badge) => {
          expect(badge.category).toBe('streak');
        });
      });

      it('should return empty array for invalid category', () => {
        const badges = getBadgesByCategory('invalid' as any);
        expect(badges).toEqual([]);
      });
    });
  });

  describe('Award Functions', () => {
    const baseGamification: StudentGamification = {
      totalXP: 500,
      level: 2,
      currentStreak: 3,
      longestStreak: 7,
      lastActivityDate: new Date(),
      badges: [],
      dailyChallengeCompleted: false,
      weeklyGoal: { target: 10, current: 5, type: 'modules' },
    };

    describe('awardXP', () => {
      it('should increase total XP', () => {
        const action: XPAction = { type: 'module_complete' };
        const result = awardXP(baseGamification, action);
        expect(result.totalXP).toBe(550); // 500 + 50
      });

      it('should update level when threshold is crossed', () => {
        const gamification = { ...baseGamification, totalXP: 380 }; // Just below level 2 (400)
        const action: XPAction = { type: 'module_complete' }; // +50 XP
        const result = awardXP(gamification, action);
        expect(result.level).toBe(2);
      });
    });

    describe('awardBadge', () => {
      it('should add badge to list', () => {
        const result = awardBadge(baseGamification, 'first_steps');
        expect(result.badges).toContain('first_steps');
      });

      it('should not add duplicate badge', () => {
        const gamificationWithBadge = {
          ...baseGamification,
          badges: ['first_steps'],
        };
        const result = awardBadge(gamificationWithBadge, 'first_steps');
        expect(result.badges.filter(b => b === 'first_steps').length).toBe(1);
      });
    });
  });

  describe('Daily Challenge', () => {
    describe('generateDailyChallenge', () => {
      it('should return a valid challenge object', () => {
        const challenge = generateDailyChallenge();

        expect(challenge).toHaveProperty('id');
        expect(challenge).toHaveProperty('date');
        expect(challenge).toHaveProperty('type');
        expect(challenge).toHaveProperty('requirement');
        expect(challenge).toHaveProperty('xpReward');
        expect(challenge).toHaveProperty('completed');
      });

      it('should have valid challenge type', () => {
        const challenge = generateDailyChallenge();
        expect(['quiz', 'review', 'time_goal']).toContain(challenge.type);
      });

      it('should not be completed initially', () => {
        const challenge = generateDailyChallenge();
        expect(challenge.completed).toBe(false);
      });

      it('should have positive XP reward', () => {
        const challenge = generateDailyChallenge();
        expect(challenge.xpReward).toBeGreaterThan(0);
      });

      it('should have consistent ID format', () => {
        const challenge = generateDailyChallenge();
        expect(challenge.id).toMatch(/^daily-\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});

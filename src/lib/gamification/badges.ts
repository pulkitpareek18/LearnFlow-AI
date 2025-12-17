import { Badge } from '@/types';

/**
 * All available badges in the gamification system
 * Organized by category for easy management
 */

export const BADGES: Badge[] = [
  // Achievement Badges
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first module',
    icon: '🎯',
    category: 'achievement',
    requirement: {
      type: 'module_complete',
      value: 1,
    },
    xpReward: 50,
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 10 modules',
    icon: '📚',
    category: 'achievement',
    requirement: {
      type: 'total_modules',
      value: 10,
    },
    xpReward: 200,
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 25 modules',
    icon: '🎓',
    category: 'achievement',
    requirement: {
      type: 'total_modules',
      value: 25,
    },
    xpReward: 500,
  },
  {
    id: 'master_scholar',
    name: 'Master Scholar',
    description: 'Complete 50 modules',
    icon: '👑',
    category: 'achievement',
    requirement: {
      type: 'total_modules',
      value: 50,
    },
    xpReward: 1000,
  },
  {
    id: 'course_champion',
    name: 'Course Champion',
    description: 'Complete your first course',
    icon: '🏆',
    category: 'achievement',
    requirement: {
      type: 'course_complete',
      value: 1,
    },
    xpReward: 500,
  },

  // Streak Badges
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: '🔥',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 3,
    },
    xpReward: 100,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '⚡',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 7,
    },
    xpReward: 300,
  },
  {
    id: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day learning streak',
    icon: '💪',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 14,
    },
    xpReward: 600,
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day learning streak',
    icon: '🌟',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 30,
    },
    xpReward: 1500,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 100-day learning streak',
    icon: '🚀',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 100,
    },
    xpReward: 5000,
  },

  // Mastery Badges
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Score 100% on an assessment',
    icon: '💯',
    category: 'mastery',
    requirement: {
      type: 'perfect_score',
      value: 1,
    },
    xpReward: 150,
  },
  {
    id: 'accuracy_ace',
    name: 'Accuracy Ace',
    description: 'Maintain 90%+ overall accuracy',
    icon: '🎯',
    category: 'mastery',
    requirement: {
      type: 'accuracy',
      value: 90,
    },
    xpReward: 400,
  },
  {
    id: 'flawless_master',
    name: 'Flawless Master',
    description: 'Maintain 95%+ overall accuracy',
    icon: '💎',
    category: 'mastery',
    requirement: {
      type: 'accuracy',
      value: 95,
    },
    xpReward: 800,
  },

  // Exploration Badges
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Complete 5 modules in one day',
    icon: '⚡',
    category: 'exploration',
    requirement: {
      type: 'modules_in_day',
      value: 5,
    },
    xpReward: 250,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 10 modules in one day',
    icon: '🏃',
    category: 'exploration',
    requirement: {
      type: 'modules_in_day',
      value: 10,
    },
    xpReward: 600,
  },
  {
    id: 'xp_hunter',
    name: 'XP Hunter',
    description: 'Earn 1,000 total XP',
    icon: '💰',
    category: 'exploration',
    requirement: {
      type: 'xp_earned',
      value: 1000,
    },
    xpReward: 200,
  },
  {
    id: 'xp_legend',
    name: 'XP Legend',
    description: 'Earn 5,000 total XP',
    icon: '🌈',
    category: 'exploration',
    requirement: {
      type: 'xp_earned',
      value: 5000,
    },
    xpReward: 500,
  },
  {
    id: 'xp_master',
    name: 'XP Master',
    description: 'Earn 10,000 total XP',
    icon: '✨',
    category: 'exploration',
    requirement: {
      type: 'xp_earned',
      value: 10000,
    },
    xpReward: 1000,
  },
];

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find((badge) => badge.id === badgeId);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return BADGES.filter((badge) => badge.category === category);
}

/**
 * Get all badge IDs
 */
export function getAllBadgeIds(): string[] {
  return BADGES.map((badge) => badge.id);
}

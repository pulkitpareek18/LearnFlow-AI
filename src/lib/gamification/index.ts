import { StudentGamification, XPAction, DailyChallenge, IStudentProgress } from '@/types';
import { BADGES, getBadgeById } from './badges';

/**
 * XP Rewards for different actions
 */
export const XP_REWARDS = {
  MODULE_COMPLETE: 50,
  INTERACTION_CORRECT: 10,
  INTERACTION_INCORRECT: 2, // Small XP for attempting
  PERFECT_SCORE: 100,
  DAILY_CHALLENGE: 75,
  STREAK_BONUS_MULTIPLIER: 1.1, // 10% bonus per streak milestone
};

/**
 * Calculate level from total XP
 * Formula: level = floor(sqrt(totalXP / 100))
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return nextLevel * nextLevel * 100;
}

/**
 * Calculate XP progress to next level (0-100)
 */
export function getLevelProgress(totalXP: number, currentLevel: number): number {
  const currentLevelXP = currentLevel * currentLevel * 100;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const progressXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));
}

/**
 * Calculate XP reward for an action
 */
export function calculateXP(action: XPAction, gamification: StudentGamification): number {
  let baseXP = 0;

  switch (action.type) {
    case 'module_complete':
      baseXP = XP_REWARDS.MODULE_COMPLETE;
      break;
    case 'interaction_correct':
      baseXP = XP_REWARDS.INTERACTION_CORRECT;
      break;
    case 'interaction_incorrect':
      baseXP = XP_REWARDS.INTERACTION_INCORRECT;
      break;
    case 'perfect_score':
      baseXP = XP_REWARDS.PERFECT_SCORE;
      break;
    case 'daily_challenge':
      baseXP = XP_REWARDS.DAILY_CHALLENGE;
      break;
    case 'streak_bonus':
      baseXP = 0; // Streak bonus is applied as multiplier
      break;
  }

  // Apply streak bonus for certain actions
  if (
    action.type === 'module_complete' ||
    action.type === 'interaction_correct' ||
    action.type === 'perfect_score'
  ) {
    if (gamification.currentStreak >= 7) {
      baseXP = Math.floor(baseXP * XP_REWARDS.STREAK_BONUS_MULTIPLIER);
    }
  }

  return baseXP;
}

/**
 * Update streak based on last activity date
 * Returns updated gamification data
 */
export function updateStreak(gamification: StudentGamification): StudentGamification {
  const now = new Date();
  const lastActivity = new Date(gamification.lastActivityDate);

  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActivityDay = new Date(
    lastActivity.getFullYear(),
    lastActivity.getMonth(),
    lastActivity.getDate()
  );

  const daysDiff = Math.floor(
    (today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = gamification.currentStreak;

  if (daysDiff === 0) {
    // Same day, no change
    newStreak = gamification.currentStreak;
  } else if (daysDiff === 1) {
    // Next day, increment streak
    newStreak = gamification.currentStreak + 1;
  } else if (daysDiff > 1) {
    // Streak broken, reset to 1
    newStreak = 1;
  }

  return {
    ...gamification,
    currentStreak: newStreak,
    longestStreak: Math.max(gamification.longestStreak, newStreak),
    lastActivityDate: now,
    dailyChallengeCompleted: daysDiff >= 1 ? false : gamification.dailyChallengeCompleted,
  };
}

/**
 * Check which badges a student has earned
 * Returns array of newly earned badge IDs
 */
export function checkBadges(
  progress: IStudentProgress,
  modulesCompletedToday: number = 0
): string[] {
  const gamification = progress.gamification || {
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date(),
    badges: [],
    dailyChallengeCompleted: false,
    weeklyGoal: {
      target: 10,
      current: 0,
      type: 'modules' as const,
    },
  };

  const earnedBadges = gamification.badges || [];
  const newBadges: string[] = [];

  // Calculate overall accuracy
  const learningMetrics = progress.learningMetrics;
  const overallAccuracy = 'interactionAccuracy' in learningMetrics
    ? learningMetrics.interactionAccuracy
    : learningMetrics.averageScore;

  // Count perfect scores
  const perfectScores = progress.assessmentScores.filter(score => score.score === 100).length;

  for (const badge of BADGES) {
    // Skip if already earned
    if (earnedBadges.includes(badge.id)) {
      continue;
    }

    let earned = false;

    switch (badge.requirement.type) {
      case 'module_complete':
        // First module completion
        earned = progress.completedModules.length >= badge.requirement.value;
        break;

      case 'total_modules':
        earned = progress.completedModules.length >= badge.requirement.value;
        break;

      case 'course_complete':
        earned = progress.completedChapters.length > 0 &&
                 progress.completedModules.length >= badge.requirement.value * 10; // Assuming ~10 modules per course
        break;

      case 'streak_days':
        earned = gamification.longestStreak >= badge.requirement.value;
        break;

      case 'perfect_score':
        earned = perfectScores >= badge.requirement.value;
        break;

      case 'accuracy':
        earned = overallAccuracy >= badge.requirement.value;
        break;

      case 'modules_in_day':
        earned = modulesCompletedToday >= badge.requirement.value;
        break;

      case 'xp_earned':
        earned = gamification.totalXP >= badge.requirement.value;
        break;
    }

    if (earned) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

/**
 * Generate a daily challenge
 */
export function generateDailyChallenge(): DailyChallenge {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenges = [
    {
      type: 'quiz' as const,
      requirement: 3,
      xpReward: 75,
    },
    {
      type: 'review' as const,
      requirement: 5,
      xpReward: 100,
    },
    {
      type: 'time_goal' as const,
      requirement: 30, // 30 minutes
      xpReward: 50,
    },
  ];

  // Pick a random challenge based on day of year
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const challengeIndex = dayOfYear % challenges.length;
  const challenge = challenges[challengeIndex];

  return {
    id: `daily-${today.toISOString().split('T')[0]}`,
    date: today,
    type: challenge.type,
    requirement: challenge.requirement,
    xpReward: challenge.xpReward,
    completed: false,
  };
}

/**
 * Update weekly goal progress
 */
export function updateWeeklyGoal(
  gamification: StudentGamification,
  increment: number
): StudentGamification {
  const now = new Date();
  const lastActivity = new Date(gamification.lastActivityDate);

  // Check if we're in a new week
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as start of week
    return new Date(d.setDate(diff));
  };

  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = getWeekStart(lastActivity);

  let current = gamification.weeklyGoal.current;

  if (thisWeekStart.getTime() !== lastWeekStart.getTime()) {
    // New week, reset progress
    current = 0;
  }

  return {
    ...gamification,
    weeklyGoal: {
      ...gamification.weeklyGoal,
      current: current + increment,
    },
  };
}

/**
 * Award XP and update gamification data
 */
export function awardXP(
  gamification: StudentGamification,
  action: XPAction
): StudentGamification {
  const xpEarned = calculateXP(action, gamification);
  const newTotalXP = gamification.totalXP + xpEarned;
  const newLevel = calculateLevel(newTotalXP);

  return {
    ...gamification,
    totalXP: newTotalXP,
    level: newLevel,
  };
}

/**
 * Award badge and XP reward
 */
export function awardBadge(
  gamification: StudentGamification,
  badgeId: string
): StudentGamification {
  const badge = getBadgeById(badgeId);
  if (!badge || gamification.badges.includes(badgeId)) {
    return gamification;
  }

  return {
    ...gamification,
    badges: [...gamification.badges, badgeId],
    totalXP: gamification.totalXP + badge.xpReward,
    level: calculateLevel(gamification.totalXP + badge.xpReward),
  };
}

/**
 * Complete daily challenge
 */
export function completeDailyChallenge(
  gamification: StudentGamification,
  challenge: DailyChallenge
): StudentGamification {
  if (gamification.dailyChallengeCompleted) {
    return gamification;
  }

  return {
    ...gamification,
    dailyChallengeCompleted: true,
    totalXP: gamification.totalXP + challenge.xpReward,
    level: calculateLevel(gamification.totalXP + challenge.xpReward),
  };
}

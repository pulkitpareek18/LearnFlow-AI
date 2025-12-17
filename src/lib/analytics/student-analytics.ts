import { ExtendedLearningMetrics, ModuleInteractionProgress } from '@/types';

// Concept Mastery Types
export interface ConceptMastery {
  conceptKey: string;
  masteryPercentage: number;
  lastPracticed?: Date;
  totalAttempts: number;
  correctAttempts: number;
}

// Study Pattern Types
export interface StudyPattern {
  bestTimeToStudy: string;
  averageSessionDuration: number;
  mostProductiveDayOfWeek: string;
  totalSessions: number;
  peakPerformanceHours: number[];
}

// Progress Data Point
export interface ProgressDataPoint {
  date: string;
  modulesCompleted: number;
  accuracy: number;
  timeSpent: number;
}

// Strength/Weakness Analysis
export interface StrengthWeaknessAnalysis {
  topStrengths: Array<{ concept: string; score: number }>;
  areasToImprove: Array<{ concept: string; score: number }>;
}

// Study Recommendation
export interface StudyRecommendation {
  type: 'focus_area' | 'study_schedule' | 'learning_tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// Course Progress with Prediction
export interface CourseProgressPrediction {
  courseId: string;
  courseTitle: string;
  currentProgress: number;
  estimatedCompletionDate: Date;
  daysRemaining: number;
  averageModulesPerDay: number;
}

/**
 * Calculate study patterns from interaction data
 */
export function calculateStudyPatterns(
  progressData: Array<{
    lastAccessedAt?: Date;
    moduleInteractions?: ModuleInteractionProgress[];
    learningMetrics?: any;
  }>
): StudyPattern {
  const hourlyPerformance = new Array(24).fill(0).map(() => ({ total: 0, correct: 0, count: 0 }));
  const dailyPerformance = new Array(7).fill(0).map(() => ({ total: 0, correct: 0, count: 0 }));
  const sessionDurations: number[] = [];

  progressData.forEach((progress) => {
    if (!progress.moduleInteractions || progress.moduleInteractions.length === 0) {
      return;
    }

    progress.moduleInteractions.forEach((moduleProgress) => {
      if (!moduleProgress.responses || moduleProgress.responses.length === 0) {
        return;
      }

      moduleProgress.responses.forEach((response) => {
        const submittedAt = new Date(response.submittedAt);
        const hour = submittedAt.getHours();
        const day = submittedAt.getDay();

        hourlyPerformance[hour].count++;
        hourlyPerformance[hour].total += response.maxScore;
        hourlyPerformance[hour].correct += response.score || 0;

        dailyPerformance[day].count++;
        dailyPerformance[day].total += response.maxScore;
        dailyPerformance[day].correct += response.score || 0;

        if (response.timeSpent) {
          sessionDurations.push(response.timeSpent);
        }
      });
    });
  });

  // Find best time to study (highest accuracy hour with at least 3 interactions)
  let bestHour = 9; // default to 9 AM
  let bestAccuracy = 0;
  hourlyPerformance.forEach((perf, hour) => {
    if (perf.count >= 3) {
      const accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestHour = hour;
      }
    }
  });

  // Find most productive day (highest accuracy with at least 3 interactions)
  let bestDay = 1; // default to Monday
  let bestDayAccuracy = 0;
  dailyPerformance.forEach((perf, day) => {
    if (perf.count >= 3) {
      const accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
      if (accuracy > bestDayAccuracy) {
        bestDayAccuracy = accuracy;
        bestDay = day;
      }
    }
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Calculate average session duration
  const avgSessionDuration = sessionDurations.length > 0
    ? Math.round(sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length)
    : 0;

  // Find peak performance hours (top 3 hours with highest accuracy)
  const peakHours = hourlyPerformance
    .map((perf, hour) => ({
      hour,
      accuracy: perf.total > 0 ? (perf.correct / perf.total) * 100 : 0,
      count: perf.count,
    }))
    .filter((h) => h.count >= 2)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3)
    .map((h) => h.hour);

  return {
    bestTimeToStudy: `${bestHour}:00`,
    averageSessionDuration: avgSessionDuration,
    mostProductiveDayOfWeek: dayNames[bestDay],
    totalSessions: sessionDurations.length,
    peakPerformanceHours: peakHours,
  };
}

/**
 * Predict course completion date based on progress
 */
export function predictCompletionDate(
  totalModules: number,
  completedModules: number,
  enrolledDate: Date,
  recentActivity?: Date
): { estimatedDate: Date; daysRemaining: number; averageModulesPerDay: number } {
  const now = new Date();
  const enrolledTime = enrolledDate.getTime();
  const currentTime = now.getTime();
  const daysSinceEnrolled = Math.max(1, (currentTime - enrolledTime) / (1000 * 60 * 60 * 24));

  // If no progress, estimate based on 3 modules per week
  if (completedModules === 0) {
    const estimatedDays = Math.ceil((totalModules / 3) * 7);
    const estimatedDate = new Date(currentTime + estimatedDays * 24 * 60 * 60 * 1000);
    return {
      estimatedDate,
      daysRemaining: estimatedDays,
      averageModulesPerDay: 0,
    };
  }

  const averageModulesPerDay = completedModules / daysSinceEnrolled;
  const remainingModules = Math.max(0, totalModules - completedModules);

  // If student is inactive (no activity in last 7 days), slow down the estimate
  let adjustedRate = averageModulesPerDay;
  if (recentActivity) {
    const daysSinceActivity = (currentTime - recentActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 7) {
      adjustedRate = averageModulesPerDay * 0.5; // Slow down estimate if inactive
    }
  }

  const daysRemaining = adjustedRate > 0 ? Math.ceil(remainingModules / adjustedRate) : 999;
  const estimatedDate = new Date(currentTime + daysRemaining * 24 * 60 * 60 * 1000);

  return {
    estimatedDate,
    daysRemaining,
    averageModulesPerDay,
  };
}

/**
 * Identify strengths and weaknesses from concept mastery
 */
export function identifyStrengthsWeaknesses(
  conceptMasteryData: ConceptMastery[]
): StrengthWeaknessAnalysis {
  // Sort by mastery percentage
  const sorted = [...conceptMasteryData].sort((a, b) => b.masteryPercentage - a.masteryPercentage);

  // Top strengths: concepts with > 80% mastery and at least 3 attempts
  const topStrengths = sorted
    .filter((c) => c.masteryPercentage >= 80 && c.totalAttempts >= 3)
    .slice(0, 5)
    .map((c) => ({
      concept: c.conceptKey,
      score: c.masteryPercentage,
    }));

  // Areas to improve: concepts with < 60% mastery and at least 2 attempts
  const areasToImprove = sorted
    .filter((c) => c.masteryPercentage < 60 && c.totalAttempts >= 2)
    .sort((a, b) => a.masteryPercentage - b.masteryPercentage)
    .slice(0, 5)
    .map((c) => ({
      concept: c.conceptKey,
      score: c.masteryPercentage,
    }));

  return {
    topStrengths,
    areasToImprove,
  };
}

/**
 * Generate personalized study recommendations
 */
export function generateStudyRecommendations(
  metrics: {
    overallAccuracy: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    currentStreak: number;
    conceptsStruggling: string[];
    averageSessionDuration: number;
    totalTimeSpent: number;
  }
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];

  // Accuracy-based recommendations
  if (metrics.overallAccuracy < 60) {
    recommendations.push({
      type: 'focus_area',
      title: 'Focus on Understanding',
      description: 'Your accuracy is below 60%. Take your time to review concepts thoroughly before moving on to new material.',
      priority: 'high',
    });
  } else if (metrics.overallAccuracy >= 90) {
    recommendations.push({
      type: 'learning_tip',
      title: 'Excellent Performance!',
      description: 'You are mastering the material well. Consider challenging yourself with more advanced topics or helping peers.',
      priority: 'low',
    });
  }

  // Trend-based recommendations
  if (metrics.recentTrend === 'declining') {
    recommendations.push({
      type: 'learning_tip',
      title: 'Performance Trend Alert',
      description: 'Your recent performance is declining. Consider taking a break or reviewing earlier concepts to strengthen your foundation.',
      priority: 'high',
    });
  } else if (metrics.recentTrend === 'improving') {
    recommendations.push({
      type: 'learning_tip',
      title: 'Great Progress!',
      description: 'Your performance is improving. Keep up the momentum with consistent study sessions.',
      priority: 'medium',
    });
  }

  // Streak-based recommendations
  if (metrics.currentStreak === 0) {
    recommendations.push({
      type: 'study_schedule',
      title: 'Start a Learning Streak',
      description: 'Study for at least 10 minutes daily to build a learning streak and improve retention.',
      priority: 'medium',
    });
  } else if (metrics.currentStreak >= 7) {
    recommendations.push({
      type: 'learning_tip',
      title: 'Amazing Streak!',
      description: `You have maintained a ${metrics.currentStreak}-day streak! Consistent learning leads to better long-term retention.`,
      priority: 'low',
    });
  }

  // Concept-specific recommendations
  if (metrics.conceptsStruggling.length > 0) {
    recommendations.push({
      type: 'focus_area',
      title: 'Review Challenging Concepts',
      description: `Focus on: ${metrics.conceptsStruggling.slice(0, 3).join(', ')}. Try using different learning resources or asking for help.`,
      priority: 'high',
    });
  }

  // Session duration recommendations
  if (metrics.averageSessionDuration > 0 && metrics.averageSessionDuration < 300) {
    // Less than 5 minutes
    recommendations.push({
      type: 'study_schedule',
      title: 'Extend Study Sessions',
      description: 'Your average session is quite short. Try studying for at least 20-30 minutes for better learning outcomes.',
      priority: 'medium',
    });
  } else if (metrics.averageSessionDuration > 7200) {
    // More than 2 hours
    recommendations.push({
      type: 'study_schedule',
      title: 'Take Regular Breaks',
      description: 'Long study sessions can lead to fatigue. Try the Pomodoro technique: 25 minutes of study, 5 minutes break.',
      priority: 'medium',
    });
  }

  // Time spent recommendations
  if (metrics.totalTimeSpent < 60) {
    // Less than 1 hour total
    recommendations.push({
      type: 'study_schedule',
      title: 'Increase Study Time',
      description: 'Regular practice is key to mastery. Aim for at least 30 minutes of focused study per day.',
      priority: 'high',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Calculate concept mastery from module interactions
 */
export function calculateConceptMastery(
  moduleInteractions: ModuleInteractionProgress[]
): ConceptMastery[] {
  const conceptMap = new Map<string, { correct: number; total: number; lastPracticed?: Date }>();

  moduleInteractions.forEach((moduleProgress) => {
    if (!moduleProgress.responses) return;

    moduleProgress.responses.forEach((response) => {
      // Use blockId as concept key, or extract from it
      const conceptKey = response.blockId.split('_')[0] || 'general';
      const existing = conceptMap.get(conceptKey) || { correct: 0, total: 0 };

      conceptMap.set(conceptKey, {
        correct: existing.correct + (response.score || 0),
        total: existing.total + response.maxScore,
        lastPracticed: response.submittedAt,
      });
    });
  });

  const conceptMastery: ConceptMastery[] = [];
  conceptMap.forEach((value, key) => {
    const masteryPercentage = value.total > 0 ? (value.correct / value.total) * 100 : 0;
    conceptMastery.push({
      conceptKey: key,
      masteryPercentage: Math.round(masteryPercentage),
      lastPracticed: value.lastPracticed,
      totalAttempts: Math.ceil(value.total / 10), // Rough estimate
      correctAttempts: Math.ceil(value.correct / 10),
    });
  });

  return conceptMastery.sort((a, b) => b.masteryPercentage - a.masteryPercentage);
}

/**
 * Generate weekly progress data for charts
 */
export function generateWeeklyProgressData(
  completedModules: Array<{ completedAt?: Date; moduleId: string }>,
  moduleInteractions: ModuleInteractionProgress[]
): ProgressDataPoint[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dailyData = new Map<string, { modules: number; totalScore: number; maxScore: number; time: number }>();

  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    dailyData.set(dateKey, { modules: 0, totalScore: 0, maxScore: 0, time: 0 });
  }

  // Count completed modules
  completedModules.forEach((module) => {
    if (module.completedAt) {
      const dateKey = new Date(module.completedAt).toISOString().split('T')[0];
      const existing = dailyData.get(dateKey);
      if (existing) {
        existing.modules++;
      }
    }
  });

  // Calculate accuracy from interactions
  moduleInteractions.forEach((moduleProgress) => {
    if (!moduleProgress.responses) return;

    moduleProgress.responses.forEach((response) => {
      const dateKey = new Date(response.submittedAt).toISOString().split('T')[0];
      const existing = dailyData.get(dateKey);
      if (existing) {
        existing.totalScore += response.score || 0;
        existing.maxScore += response.maxScore;
        existing.time += response.timeSpent || 0;
      }
    });
  });

  // Convert to array
  const progressData: ProgressDataPoint[] = [];
  dailyData.forEach((value, dateKey) => {
    const accuracy = value.maxScore > 0 ? (value.totalScore / value.maxScore) * 100 : 0;
    progressData.push({
      date: dateKey,
      modulesCompleted: value.modules,
      accuracy: Math.round(accuracy),
      timeSpent: Math.round(value.time / 60), // Convert to minutes
    });
  });

  return progressData.sort((a, b) => a.date.localeCompare(b.date));
}

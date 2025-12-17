import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Enrollment from '@/lib/db/models/Enrollment';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import User from '@/lib/db/models/User';
import { ApiResponse, ExtendedLearningMetrics } from '@/types';

// Ensure models are registered for populate
void Chapter;
void Module;
import {
  calculateStudyPatterns,
  predictCompletionDate,
  identifyStrengthsWeaknesses,
  generateStudyRecommendations,
  calculateConceptMastery,
  generateWeeklyProgressData,
  ConceptMastery,
  StudyPattern,
  StrengthWeaknessAnalysis,
  StudyRecommendation,
  ProgressDataPoint,
} from '@/lib/analytics/student-analytics';

export interface StudentAnalyticsResponse {
  // Overall stats
  overallStats: {
    totalCourses: number;
    completedCourses: number;
    activeCourses: number;
    totalModulesCompleted: number;
    totalTimeSpent: number; // in minutes
    overallAccuracy: number; // percentage
    currentStreak: number; // days
    longestStreak: number; // days
    totalXP: number;
    currentLevel: number;
  };

  // Concept mastery
  conceptMastery: ConceptMastery[];

  // Learning patterns
  studyPatterns: StudyPattern;

  // Progress over time
  weeklyProgress: ProgressDataPoint[];

  // Strengths and weaknesses
  strengthWeakness: StrengthWeaknessAnalysis;

  // Course progress with predictions
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    completedModules: number;
    totalModules: number;
    estimatedCompletionDate: string;
    daysRemaining: number;
    currentGrade: number;
    timeSpent: number;
  }>;

  // Recent activities
  recentActivities: Array<{
    type: 'module_completed' | 'assessment_taken' | 'streak_achieved';
    title: string;
    description: string;
    timestamp: Date;
    score?: number;
  }>;

  // Personalized recommendations
  recommendations: StudyRecommendation[];
}

// GET /api/student/analytics - Get comprehensive student analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'student') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only students can access analytics' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all enrollments
    const enrollments = await Enrollment.find({ studentId: session.user.id })
      .populate({
        path: 'courseId',
        populate: {
          path: 'chapters',
          populate: {
            path: 'modules',
          },
        },
      })
      .lean();

    // Filter valid enrollments
    const validEnrollments = enrollments.filter((e: any) => e.courseId !== null);

    // Get all progress records
    const progressRecords = await StudentProgress.find({
      studentId: session.user.id,
    }).lean();

    // Get user profile for gamification data
    const user = await User.findById(session.user.id).lean();

    // Calculate overall stats
    const totalCourses = validEnrollments.length;
    const completedCourses = validEnrollments.filter((e: any) => e.status === 'completed').length;
    const activeCourses = validEnrollments.filter((e: any) => e.status === 'active').length;

    let totalModulesCompleted = 0;
    let totalTimeSpent = 0;
    let totalInteractionScore = 0;
    let totalInteractionMax = 0;
    let allModuleInteractions: any[] = [];
    let currentStreak = 0;
    let longestStreak = 0;

    progressRecords.forEach((progress: any) => {
      totalModulesCompleted += progress.completedModules?.length || 0;
      totalTimeSpent += progress.learningMetrics?.totalTimeSpent || 0;

      if (progress.moduleInteractions) {
        allModuleInteractions.push(...progress.moduleInteractions);

        progress.moduleInteractions.forEach((moduleProgress: any) => {
          if (moduleProgress.responses) {
            moduleProgress.responses.forEach((response: any) => {
              totalInteractionScore += response.score || 0;
              totalInteractionMax += response.maxScore || 0;
            });
          }
        });
      }

      // Track streaks
      const progressStreak = progress.learningMetrics?.streakDays || 0;
      if (progressStreak > currentStreak) {
        currentStreak = progressStreak;
      }
    });

    longestStreak = currentStreak; // Simplified for now

    const overallAccuracy =
      totalInteractionMax > 0 ? (totalInteractionScore / totalInteractionMax) * 100 : 0;

    // Get gamification data from user profile
    const totalXP = (user as any)?.learningProfile?.gamification?.totalXP || 0;
    const currentLevel = (user as any)?.learningProfile?.gamification?.level || 1;

    // Calculate concept mastery
    const conceptMastery = calculateConceptMastery(allModuleInteractions);

    // Calculate study patterns
    const studyPatterns = calculateStudyPatterns(progressRecords);

    // Generate weekly progress data
    const allCompletedModules: Array<{ completedAt?: Date; moduleId: string }> = [];
    progressRecords.forEach((progress: any) => {
      if (progress.completedModules) {
        progress.completedModules.forEach((moduleId: string) => {
          allCompletedModules.push({
            completedAt: progress.lastAccessedAt,
            moduleId,
          });
        });
      }
    });

    const weeklyProgress = generateWeeklyProgressData(allCompletedModules, allModuleInteractions);

    // Identify strengths and weaknesses
    const strengthWeakness = identifyStrengthsWeaknesses(conceptMastery);

    // Calculate course progress with predictions
    const courseProgress = await Promise.all(
      validEnrollments.map(async (enrollment: any) => {
        const course = enrollment.courseId;
        if (!course) {
          return null;
        }

        const progress = progressRecords.find(
          (p: any) => p.courseId.toString() === course._id.toString()
        );

        // Calculate total modules
        let totalModules = 0;
        if (course.chapters) {
          course.chapters.forEach((chapter: any) => {
            if (chapter.modules) {
              totalModules += chapter.modules.length;
            }
          });
        }

        const completedModules = progress?.completedModules?.length || 0;
        const progressPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

        // Predict completion date
        const prediction = predictCompletionDate(
          totalModules,
          completedModules,
          new Date(enrollment.enrolledAt),
          progress?.lastAccessedAt
        );

        // Calculate current grade
        let currentGrade = 0;
        if (progress?.moduleInteractions && progress.moduleInteractions.length > 0) {
          let totalScore = 0;
          let maxScore = 0;

          progress.moduleInteractions.forEach((moduleProgress: any) => {
            totalScore += moduleProgress.totalScore || 0;
            maxScore += moduleProgress.maxPossibleScore || 0;
          });

          currentGrade = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        }

        const timeSpent = progress?.learningMetrics?.totalTimeSpent || 0;

        return {
          courseId: course._id.toString(),
          courseTitle: course.title,
          progress: Math.round(progressPercent),
          completedModules,
          totalModules,
          estimatedCompletionDate: prediction.estimatedDate.toISOString(),
          daysRemaining: prediction.daysRemaining,
          currentGrade: Math.round(currentGrade),
          timeSpent,
        };
      })
    );

    // Filter out null values
    const validCourseProgress = courseProgress.filter((c) => c !== null);

    // Generate recent activities
    const recentActivities: Array<{
      type: 'module_completed' | 'assessment_taken' | 'streak_achieved';
      title: string;
      description: string;
      timestamp: Date;
      score?: number;
    }> = [];

    // Add module completions (last 10)
    const recentModules = allCompletedModules
      .filter((m) => m.completedAt)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    recentModules.forEach((module) => {
      recentActivities.push({
        type: 'module_completed',
        title: 'Module Completed',
        description: `You completed a module`,
        timestamp: module.completedAt || new Date(),
      });
    });

    // Add streak achievements
    if (currentStreak > 0) {
      recentActivities.push({
        type: 'streak_achieved',
        title: `${currentStreak} Day Streak!`,
        description: `You have maintained a ${currentStreak}-day learning streak`,
        timestamp: new Date(),
      });
    }

    // Sort by timestamp
    recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Generate recommendations
    const recommendationMetrics = {
      overallAccuracy,
      recentTrend: 'stable' as 'improving' | 'stable' | 'declining',
      currentStreak,
      conceptsStruggling: strengthWeakness.areasToImprove.map((a) => a.concept),
      averageSessionDuration: studyPatterns.averageSessionDuration,
      totalTimeSpent,
    };

    // Determine recent trend
    if (weeklyProgress.length >= 2) {
      const recentAccuracy = weeklyProgress.slice(-3).reduce((sum, p) => sum + p.accuracy, 0) / 3;
      const olderAccuracy = weeklyProgress.slice(0, 3).reduce((sum, p) => sum + p.accuracy, 0) / 3;

      if (recentAccuracy > olderAccuracy + 5) {
        recommendationMetrics.recentTrend = 'improving';
      } else if (recentAccuracy < olderAccuracy - 5) {
        recommendationMetrics.recentTrend = 'declining';
      }
    }

    const recommendations = generateStudyRecommendations(recommendationMetrics);

    // Build response
    const analyticsData: StudentAnalyticsResponse = {
      overallStats: {
        totalCourses,
        completedCourses,
        activeCourses,
        totalModulesCompleted,
        totalTimeSpent,
        overallAccuracy: Math.round(overallAccuracy),
        currentStreak,
        longestStreak,
        totalXP,
        currentLevel,
      },
      conceptMastery: conceptMastery.slice(0, 20), // Top 20 concepts
      studyPatterns,
      weeklyProgress,
      strengthWeakness,
      courseProgress: validCourseProgress,
      recentActivities: recentActivities.slice(0, 10),
      recommendations,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

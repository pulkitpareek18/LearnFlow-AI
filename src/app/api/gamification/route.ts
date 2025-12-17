import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse } from '@/types';
import { getBadgeById } from '@/lib/gamification/badges';
import { calculateLevel } from '@/lib/gamification';

/**
 * GET /api/gamification?courseId=xxx
 * Get student's gamification data
 * If courseId is provided, returns data for that course
 * If no courseId, aggregates across all enrolled courses
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    await connectDB();

    // If courseId provided, get data for that specific course
    if (courseId) {
      const progress = await StudentProgress.findOne({
        studentId: session.user.id,
        courseId,
      }).lean();

      if (!progress) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            totalXP: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: new Date(),
            badges: [],
            earnedBadges: [],
            dailyChallengeCompleted: false,
            weeklyGoal: {
              target: 10,
              current: 0,
              type: 'modules',
            },
          },
        });
      }

      const earnedBadges = (progress.gamification?.badges || [])
        .map(badgeId => getBadgeById(badgeId))
        .filter(badge => badge !== undefined);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          ...progress.gamification,
          earnedBadges,
        },
      });
    }

    // Aggregate across all courses for dashboard view
    const allProgress = await StudentProgress.find({
      studentId: session.user.id,
    }).lean();

    if (!allProgress || allProgress.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          totalXP: 0,
          level: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          badges: [],
          earnedBadges: [],
          dailyChallengeCompleted: false,
          weeklyGoal: {
            target: 5,
            current: 0,
            type: 'modules',
          },
        },
      });
    }

    // Aggregate gamification data across all courses
    let totalXP = 0;
    let maxStreak = 0;
    let longestStreak = 0;
    let lastActivity: Date | null = null;
    const allBadges = new Set<string>();
    let totalModulesThisWeek = 0;

    // Get start of current week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    for (const progress of allProgress) {
      const gam = progress.gamification;
      if (gam) {
        totalXP += gam.totalXP || 0;
        maxStreak = Math.max(maxStreak, gam.currentStreak || 0);
        longestStreak = Math.max(longestStreak, gam.longestStreak || 0);

        if (gam.lastActivityDate) {
          const actDate = new Date(gam.lastActivityDate);
          if (!lastActivity || actDate > lastActivity) {
            lastActivity = actDate;
          }
        }

        if (gam.badges) {
          gam.badges.forEach((b: string) => allBadges.add(b));
        }
      }

      // Count completed modules this week
      const completedModules = progress.completedModules || [];
      // We count all completed modules as weekly progress (simplified)
      totalModulesThisWeek += completedModules.length;
    }

    // Check if last activity was today for streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivityDate = lastActivity || new Date();
    const lastActivityDay = new Date(lastActivityDate);
    lastActivityDay.setHours(0, 0, 0, 0);

    // Reset streak if more than 1 day has passed
    const daysSinceActivity = Math.floor((today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));
    const currentStreak = daysSinceActivity > 1 ? 0 : maxStreak;

    const badges = Array.from(allBadges);
    const earnedBadges = badges
      .map(badgeId => getBadgeById(badgeId))
      .filter(badge => badge !== undefined);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalXP,
        level: calculateLevel(totalXP),
        currentStreak,
        longestStreak,
        lastActivityDate,
        badges,
        earnedBadges,
        dailyChallengeCompleted: false, // Could be tracked separately
        weeklyGoal: {
          target: 5,
          current: Math.min(totalModulesThisWeek, 10), // Cap at reasonable number
          type: 'modules',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch gamification data' },
      { status: 500 }
    );
  }
}

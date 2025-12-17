import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse, XPAction } from '@/types';
import {
  awardXP,
  awardBadge,
  updateStreak,
  updateWeeklyGoal,
  checkBadges,
} from '@/lib/gamification';
import { getBadgeById } from '@/lib/gamification/badges';

/**
 * POST /api/gamification/claim-xp
 * Award XP to student and check for badges/achievements
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { courseId, action, modulesCompletedToday = 0 } = body as {
      courseId: string;
      action: XPAction;
      modulesCompletedToday?: number;
    };

    if (!courseId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID and action are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const progress = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId,
    });

    if (!progress) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Progress not found' },
        { status: 404 }
      );
    }

    // Initialize gamification if not exists
    if (!progress.gamification) {
      progress.gamification = {
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
          type: 'modules',
        },
      };
    }

    // Update streak
    let gamification = updateStreak(progress.gamification);

    // Award XP for the action
    gamification = awardXP(gamification, action);

    // Update weekly goal if module completed
    if (action.type === 'module_complete') {
      gamification = updateWeeklyGoal(gamification, 1);
    }

    // Check for new badges
    const newBadgeIds = checkBadges(progress, modulesCompletedToday);
    const newBadges = [];

    // Award new badges
    for (const badgeId of newBadgeIds) {
      gamification = awardBadge(gamification, badgeId);
      const badge = getBadgeById(badgeId);
      if (badge) {
        newBadges.push(badge);
      }
    }

    // Update progress
    progress.gamification = gamification;
    await progress.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        gamification,
        newBadges,
        leveledUp: gamification.level > progress.gamification.level,
      },
    });
  } catch (error) {
    console.error('Error claiming XP:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to claim XP' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse } from '@/types';
import { generateDailyChallenge, completeDailyChallenge } from '@/lib/gamification';

/**
 * GET /api/gamification/daily-challenge?courseId=xxx
 * Get today's daily challenge
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

    if (!courseId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const progress = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId,
    }).lean();

    const challenge = generateDailyChallenge();

    // Check if challenge is completed
    if (progress?.gamification?.dailyChallengeCompleted) {
      challenge.completed = true;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch daily challenge' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamification/daily-challenge
 * Complete today's daily challenge
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

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID is required' },
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

    // Check if already completed
    if (progress.gamification.dailyChallengeCompleted) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Daily challenge already completed',
      });
    }

    const challenge = generateDailyChallenge();

    // Complete the challenge
    progress.gamification = completeDailyChallenge(progress.gamification, challenge);
    await progress.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        gamification: progress.gamification,
        xpEarned: challenge.xpReward,
      },
    });
  } catch (error) {
    console.error('Error completing daily challenge:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to complete daily challenge' },
      { status: 500 }
    );
  }
}

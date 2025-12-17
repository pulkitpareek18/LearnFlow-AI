import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { ApiResponse, LearningPreferences } from '@/types';

// GET /api/student/preferences - Get student's learning preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        learningProfile: user.learningProfile || {},
        onboardingCompleted: user.learningProfile?.onboardingCompleted || false,
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/student/preferences - Update student's learning preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { preferences, completeOnboarding } = body as {
      preferences: Partial<LearningPreferences>;
      completeOnboarding?: boolean;
    };

    await connectDB();

    const updateData: Record<string, unknown> = {};

    // Update individual preference fields
    if (preferences) {
      if (preferences.preferredPace) {
        updateData['learningProfile.preferredPace'] = preferences.preferredPace;
        updateData['learningProfile.preferences.preferredPace'] = preferences.preferredPace;
      }
      if (preferences.learningStyle) {
        updateData['learningProfile.learningStyle'] = preferences.learningStyle;
        updateData['learningProfile.preferences.learningStyle'] = preferences.learningStyle;
      }
      if (preferences.contentDepth) {
        updateData['learningProfile.preferences.contentDepth'] = preferences.contentDepth;
      }
      if (preferences.preferExamples) {
        updateData['learningProfile.preferences.preferExamples'] = preferences.preferExamples;
      }
      if (typeof preferences.preferAnalogies === 'boolean') {
        updateData['learningProfile.preferences.preferAnalogies'] = preferences.preferAnalogies;
      }
      if (typeof preferences.preferVisualAids === 'boolean') {
        updateData['learningProfile.preferences.preferVisualAids'] = preferences.preferVisualAids;
      }
      if (typeof preferences.preferSummaries === 'boolean') {
        updateData['learningProfile.preferences.preferSummaries'] = preferences.preferSummaries;
      }
      if (preferences.interactionFrequency) {
        updateData['learningProfile.preferences.interactionFrequency'] = preferences.interactionFrequency;
      }
      if (preferences.feedbackStyle) {
        updateData['learningProfile.preferences.feedbackStyle'] = preferences.feedbackStyle;
      }
      if (typeof preferences.showHintsFirst === 'boolean') {
        updateData['learningProfile.preferences.showHintsFirst'] = preferences.showHintsFirst;
      }
      if (preferences.challengeLevel) {
        updateData['learningProfile.preferences.challengeLevel'] = preferences.challengeLevel;
      }
      if (typeof preferences.skipMasteredContent === 'boolean') {
        updateData['learningProfile.preferences.skipMasteredContent'] = preferences.skipMasteredContent;
      }
    }

    // Mark onboarding as complete if requested
    if (completeOnboarding) {
      updateData['learningProfile.onboardingCompleted'] = true;
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        learningProfile: user.learningProfile,
      },
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

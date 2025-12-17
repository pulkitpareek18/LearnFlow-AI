import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Module from '@/lib/db/models/Module';
import StudentProgress from '@/lib/db/models/StudentProgress';
import User from '@/lib/db/models/User';
import { generatePersonalizedModuleContent } from '@/lib/ai/anthropic';
import { calculatePerformanceMetrics } from '@/lib/adaptive/calculator';
import { ApiResponse, LearningPreferences, ContentBlock } from '@/types';

// POST /api/adaptive/personalize - Get personalized module content
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { moduleId, courseId, forceRegenerate = false } = await req.json();

    if (!moduleId || !courseId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'moduleId and courseId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the module
    const module = await Module.findById(moduleId).lean();
    if (!module) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Get student's learning preferences
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get student progress for this course
    const progressRecord = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId,
    }).lean();

    // If no progress exists, create default
    const progress = progressRecord || {
      studentId: session.user.id,
      courseId,
      completedModules: [],
      moduleInteractions: [],
      learningMetrics: {
        averageTimePerModule: 0,
        averageScore: 0,
        streakDays: 0,
        totalTimeSpent: 0,
        adaptiveDifficulty: 5,
        interactionScore: 0,
        interactionAccuracy: 0,
        conceptsMastered: [],
        conceptsStruggling: [],
        recentTrend: 'stable' as const,
        correctStreak: 0,
        incorrectStreak: 0,
      },
    };

    // Get default preferences if user hasn't set them
    const defaultPreferences: LearningPreferences = {
      preferredPace: 'medium',
      learningStyle: 'reading',
      contentDepth: 'detailed',
      preferExamples: 'moderate',
      preferAnalogies: true,
      preferVisualAids: true,
      preferSummaries: true,
      interactionFrequency: 'medium',
      feedbackStyle: 'encouraging',
      showHintsFirst: false,
      challengeLevel: 'moderate',
      skipMasteredContent: false,
    };

    const studentPreferences: LearningPreferences = {
      ...defaultPreferences,
      ...(user.learningProfile?.preferences || {}),
      preferredPace: user.learningProfile?.preferences?.preferredPace || user.learningProfile?.preferredPace || 'medium',
      learningStyle: user.learningProfile?.preferences?.learningStyle || user.learningProfile?.learningStyle || 'reading',
    };

    // Calculate performance metrics
    const learningMetrics = (progress.learningMetrics || {}) as any;
    const metrics = calculatePerformanceMetrics(
      (progress.moduleInteractions || []) as any[],
      {
        conceptsMastered: learningMetrics.conceptsMastered,
        conceptsStruggling: learningMetrics.conceptsStruggling,
        interactionAccuracy: learningMetrics.interactionAccuracy,
        correctStreak: learningMetrics.correctStreak,
        incorrectStreak: learningMetrics.incorrectStreak,
        recentTrend: learningMetrics.recentTrend,
      }
    );

    // Check if module has interactive content blocks
    const hasInteractiveContent = module.contentBlocks && module.contentBlocks.length > 0;

    // If module doesn't have interactive content, return original
    if (!hasInteractiveContent) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          module: module,
          personalized: false,
          message: 'Module does not have interactive content blocks',
          metrics,
        },
      });
    }

    // Check if personalization is needed/requested
    const needsPersonalization =
      forceRegenerate ||
      metrics.accuracy < 70 ||
      metrics.accuracy > 90 ||
      metrics.recentTrend === 'declining' ||
      (progress.moduleInteractions || []).length > 0;

    if (!needsPersonalization && !user.learningProfile?.onboardingCompleted) {
      // First-time user, return original content
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          module: module,
          personalized: false,
          message: 'Using standard content for new learner',
          showOnboarding: !user.learningProfile?.onboardingCompleted,
          metrics,
        },
      });
    }

    // Generate personalized content
    try {
      const personalizedResult = await generatePersonalizedModuleContent(
        module.title,
        module.contentBlocks as ContentBlock[],
        module.content || '',
        studentPreferences,
        {
          accuracy: metrics.accuracy,
          recentTrend: metrics.recentTrend,
          strugglingConcepts: metrics.conceptsStruggling || [],
          masteredConcepts: metrics.conceptsMastered || [],
          averageTimePerInteraction: metrics.averageTimePerQuestion || 60,
          currentDifficultyLevel: progress.learningMetrics?.adaptiveDifficulty || 5,
        }
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          module: {
            ...module,
            contentBlocks: personalizedResult.personalizedBlocks,
          },
          personalized: true,
          adaptations: personalizedResult.adaptations,
          personalizedSummary: personalizedResult.personalizedSummary,
          encouragementMessage: personalizedResult.encouragementMessage,
          metrics,
        },
      });
    } catch (aiError) {
      console.error('Failed to generate personalized content:', aiError);
      // Fall back to original content
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          module: module,
          personalized: false,
          message: 'Using standard content (personalization unavailable)',
          metrics,
        },
      });
    }
  } catch (error) {
    console.error('Error personalizing content:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to personalize content' },
      { status: 500 }
    );
  }
}

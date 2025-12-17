import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import { getAdaptiveRecommendations, generateAdaptiveContent } from '@/lib/ai/anthropic';
import { ApiResponse, AdaptiveRecommendation } from '@/types';

// GET /api/adaptive/recommendations?courseId=xxx&moduleId=xxx - Get adaptive recommendations
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
    const moduleId = searchParams.get('moduleId');

    if (!courseId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get student progress
    const progress = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId,
    }).lean();

    if (!progress) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          recommendations: [],
          message: 'No progress data yet. Start learning to get personalized recommendations!',
        },
      });
    }

    // Get course with modules for difficulty info
    const course = await Course.findById(courseId)
      .populate({
        path: 'chapters',
        populate: {
          path: 'modules',
          select: '_id title difficultyLevel',
        },
      })
      .lean();

    // Extract all modules with their difficulty levels
    const availableModules: Array<{ id: string; title: string; difficultyLevel: number }> = [];
    if (course?.chapters) {
      (course.chapters as any[]).forEach((chapter: any) => {
        (chapter.modules || []).forEach((module: any) => {
          availableModules.push({
            id: module._id.toString(),
            title: module.title,
            difficultyLevel: module.difficultyLevel || 5,
          });
        });
      });
    }

    // Get learning metrics
    const metrics = (progress as any).learningMetrics || {};

    const studentMetrics = {
      accuracy: metrics.interactionAccuracy || 0,
      recentTrend: (metrics.recentTrend || 'stable') as 'improving' | 'stable' | 'declining',
      conceptsMastered: metrics.conceptsMastered || [],
      conceptsStruggling: metrics.conceptsStruggling || [],
      correctStreak: metrics.correctStreak || 0,
      incorrectStreak: metrics.incorrectStreak || 0,
    };

    // Get rule-based recommendations
    const recommendations = await getAdaptiveRecommendations(
      studentMetrics,
      availableModules
    );

    // If a specific module is provided and student is struggling, get AI-generated adaptive content
    let adaptiveContent = null;
    if (moduleId && (studentMetrics.accuracy < 70 || studentMetrics.incorrectStreak >= 3)) {
      const module = await Module.findById(moduleId).lean();
      if (module) {
        try {
          adaptiveContent = await generateAdaptiveContent(
            (module as any).content || '',
            {
              accuracy: studentMetrics.accuracy,
              recentTrend: studentMetrics.recentTrend,
              strugglingConcepts: studentMetrics.conceptsStruggling,
              correctStreak: studentMetrics.correctStreak,
              incorrectStreak: studentMetrics.incorrectStreak,
            }
          );
        } catch (error) {
          console.error('Error generating adaptive content:', error);
        }
      }
    }

    // Calculate suggested difficulty adjustment
    let suggestedDifficulty = metrics.adaptiveDifficulty || 5;
    if (studentMetrics.accuracy >= 90 && studentMetrics.recentTrend === 'improving') {
      suggestedDifficulty = Math.min(10, suggestedDifficulty + 2);
    } else if (studentMetrics.accuracy < 50) {
      suggestedDifficulty = Math.max(1, suggestedDifficulty - 2);
    } else if (studentMetrics.accuracy < 70) {
      suggestedDifficulty = Math.max(1, suggestedDifficulty - 1);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        recommendations,
        adaptiveContent,
        metrics: {
          ...studentMetrics,
          currentDifficulty: metrics.adaptiveDifficulty || 5,
          suggestedDifficulty,
        },
        summary: generatePerformanceSummary(studentMetrics),
      },
    });
  } catch (error) {
    console.error('Error getting adaptive recommendations:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// Helper function to generate a human-readable performance summary
function generatePerformanceSummary(metrics: {
  accuracy: number;
  recentTrend: string;
  correctStreak: number;
  incorrectStreak: number;
}): string {
  const parts: string[] = [];

  // Accuracy comment
  if (metrics.accuracy >= 90) {
    parts.push("Excellent work! You're mastering this material.");
  } else if (metrics.accuracy >= 70) {
    parts.push("Good progress! You're understanding most concepts well.");
  } else if (metrics.accuracy >= 50) {
    parts.push("You're making progress. Some areas could use more practice.");
  } else {
    parts.push("Let's slow down and reinforce the fundamentals.");
  }

  // Trend comment
  if (metrics.recentTrend === 'improving') {
    parts.push("Your recent performance is improving - keep it up!");
  } else if (metrics.recentTrend === 'declining') {
    parts.push("Your recent scores have dipped a bit. Consider reviewing earlier material.");
  }

  // Streak comment
  if (metrics.correctStreak >= 5) {
    parts.push(`Amazing ${metrics.correctStreak}-answer streak!`);
  } else if (metrics.incorrectStreak >= 3) {
    parts.push("A few incorrect answers in a row - let's take a moment to review.");
  }

  return parts.join(' ');
}

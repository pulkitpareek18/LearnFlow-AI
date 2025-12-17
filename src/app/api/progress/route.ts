import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Enrollment from '@/lib/db/models/Enrollment';
import Module from '@/lib/db/models/Module';
import { ApiResponse } from '@/types';

// POST /api/progress - Update module completion
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId, moduleId, chapterId } = await req.json();

    if (!courseId || !moduleId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID and Module ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId,
    });

    if (!enrollment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Update or create progress record
    let progress = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId,
    });

    if (!progress) {
      progress = await StudentProgress.create({
        studentId: session.user.id,
        courseId,
        completedModules: [moduleId],
        completedChapters: [],
        lastAccessedAt: new Date(),
        learningMetrics: {
          averageTimePerModule: 0,
          averageScore: 0,
          streakDays: 0,
          totalTimeSpent: 0,
          adaptiveDifficulty: 5,
        },
      });
    } else {
      // Add module to completed if not already there
      if (!progress.completedModules.includes(moduleId)) {
        progress.completedModules.push(moduleId);
      }

      // Add chapter to completed if provided and not already there
      if (chapterId && !progress.completedChapters.includes(chapterId)) {
        progress.completedChapters.push(chapterId);
      }

      progress.lastAccessedAt = new Date();
      await progress.save();
    }

    // Auto-generate review items when module is completed
    // This runs asynchronously and doesn't block the response
    if (!progress.completedModules.includes(moduleId)) {
      // Module was just completed, generate review items
      generateReviewItemsAsync(session.user.id, courseId, moduleId);
    }

    // Update enrollment status if course is completed
    // (This would need to check total modules vs completed modules)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        completedModules: progress.completedModules,
        completedChapters: progress.completedChapters,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// GET /api/progress?courseId=xxx - Get progress for a course
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

    return NextResponse.json<ApiResponse>({
      success: true,
      data: progress || {
        completedModules: [],
        completedChapters: [],
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to auto-generate review items when a module is completed
 * Runs asynchronously without blocking the main request
 */
async function generateReviewItemsAsync(
  studentId: string,
  courseId: string,
  moduleId: string
) {
  try {
    // Import here to avoid circular dependencies
    const { generateReviewItems } = await import('@/lib/adaptive/spaced-repetition');

    // Fetch the module
    const module = await Module.findById(moduleId).lean();
    if (!module) return;

    // Extract review items from module content
    const reviewInteractions: Array<{
      conceptKey: string;
      question: string;
      answer: string;
    }> = [];

    // From AI-generated practice questions
    if (module.aiGeneratedContent?.practiceQuestions) {
      module.aiGeneratedContent.practiceQuestions.forEach((pq, index) => {
        reviewInteractions.push({
          conceptKey: `practice_${index}`,
          question: pq.question,
          answer: pq.answer,
        });
      });
    }

    // From interactive content blocks
    if (module.contentBlocks && module.isInteractive) {
      module.contentBlocks.forEach((block) => {
        if (block.type === 'interaction' && block.interaction) {
          const interaction = block.interaction;
          const conceptKey = block.conceptKey || `block_${block.id}`;

          if (interaction.type === 'mcq') {
            const correctOption = interaction.options?.find((opt) => opt.isCorrect);
            if (correctOption) {
              reviewInteractions.push({
                conceptKey,
                question: interaction.question,
                answer: correctOption.text,
              });
            }
          }

          if (interaction.type === 'fill_blank') {
            const blanks = interaction.blanks || [];
            if (blanks.length > 0) {
              const answer = blanks.map((b) => b.correctAnswer).join(', ');
              reviewInteractions.push({
                conceptKey,
                question: interaction.text.replace(/\{\{[^}]+\}\}/g, '______'),
                answer,
              });
            }
          }
        }
      });
    }

    // Generate review items (limit to avoid overwhelming students)
    if (reviewInteractions.length > 0) {
      await generateReviewItems(
        studentId,
        courseId,
        moduleId,
        reviewInteractions.slice(0, 10) // Limit to 10 items per module
      );
      console.log(
        `Generated ${Math.min(reviewInteractions.length, 10)} review items for module ${moduleId}`
      );
    }
  } catch (error) {
    console.error('Error auto-generating review items:', error);
    // Don't throw - this is a background task
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Module from '@/lib/db/models/Module';
import { generateReviewItems } from '@/lib/adaptive/spaced-repetition';
import { ApiResponse } from '@/types';

/**
 * POST /api/review/generate
 * Generate review items from completed module
 *
 * Request body:
 * - courseId: string
 * - moduleId: string
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

    if (session.user.role !== 'student') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only students can generate review items' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, moduleId } = body;

    if (!courseId || !moduleId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID and Module ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the module to extract review content
    const module = await Module.findById(moduleId).lean();

    if (!module) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Extract review items from different sources
    const reviewInteractions: Array<{
      conceptKey: string;
      question: string;
      answer: string;
    }> = [];

    // 1. Extract from AI-generated practice questions
    if (module.aiGeneratedContent?.practiceQuestions) {
      module.aiGeneratedContent.practiceQuestions.forEach((pq, index) => {
        reviewInteractions.push({
          conceptKey: `practice_${index}`,
          question: pq.question,
          answer: pq.answer,
        });
      });
    }

    // 2. Extract from interactive content blocks (MCQ, Fill Blank, Reflection)
    if (module.contentBlocks && module.isInteractive) {
      module.contentBlocks.forEach((block) => {
        if (block.type === 'interaction' && block.interaction) {
          const interaction = block.interaction;
          const conceptKey = block.conceptKey || `block_${block.id}`;

          // MCQ interactions
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

          // Fill blank interactions
          if (interaction.type === 'fill_blank') {
            // Create a review item for fill-in-the-blank
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

          // Reflection interactions (can be converted to review questions)
          if (interaction.type === 'reflection') {
            reviewInteractions.push({
              conceptKey,
              question: interaction.prompt,
              answer: interaction.rubric, // Use rubric as answer guide
            });
          }
        }
      });
    }

    // 3. Extract from key points (convert to Q&A format)
    if (module.aiGeneratedContent?.keyPoints) {
      module.aiGeneratedContent.keyPoints.forEach((point, index) => {
        reviewInteractions.push({
          conceptKey: `keypoint_${index}`,
          question: `What is a key concept about ${module.title}?`,
          answer: point,
        });
      });
    }

    // Generate review items
    if (reviewInteractions.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          created: 0,
          message: 'No review content found in this module',
        },
      });
    }

    const createdItems = await generateReviewItems(
      session.user.id,
      courseId,
      moduleId,
      reviewInteractions
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        created: createdItems.length,
        total: reviewInteractions.length,
        message: `Created ${createdItems.length} review items for future study`,
      },
    });
  } catch (error) {
    console.error('Error generating review items:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate review items' },
      { status: 500 }
    );
  }
}

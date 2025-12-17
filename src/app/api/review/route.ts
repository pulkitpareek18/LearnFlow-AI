import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import {
  getDueItems,
  updateReviewItem,
  getReviewStats,
} from '@/lib/adaptive/spaced-repetition';
import { ApiResponse, ReviewQuality } from '@/types';

/**
 * GET /api/review
 * Get due review items for the authenticated student
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

    if (session.user.role !== 'student') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only students can access reviews' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const limitParam = searchParams.get('limit');
    const statsOnly = searchParams.get('statsOnly') === 'true';

    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // If only stats are requested
    if (statsOnly) {
      const stats = await getReviewStats(session.user.id, courseId || undefined);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: stats,
      });
    }

    // Get due items
    const dueItems = await getDueItems(
      session.user.id,
      courseId || undefined,
      limit
    );

    // Transform to client format
    const items = dueItems.map((item) => ({
      id: item._id.toString(),
      conceptKey: item.conceptKey,
      moduleId: item.moduleId.toString(),
      courseId: item.courseId.toString(),
      question: item.question,
      answer: item.answer,
      easeFactor: item.easeFactor,
      interval: item.interval,
      repetitions: item.repetitions,
      nextReviewDate: item.nextReviewDate,
      lastReviewDate: item.lastReviewDate,
      correctCount: item.correctCount,
      incorrectCount: item.incorrectCount,
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('Error fetching review items:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch review items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/review
 * Submit a review response
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
        { success: false, error: 'Only students can submit reviews' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { itemId, quality, timeSpent } = body;

    // Validate input
    if (!itemId || quality === undefined || quality === null) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Item ID and quality are required' },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Quality must be between 0 and 5' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update the review item
    const updatedItem = await updateReviewItem(
      itemId,
      quality as ReviewQuality,
      timeSpent || 0
    );

    if (!updatedItem) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Review item not found' },
        { status: 404 }
      );
    }

    // Verify the item belongs to the current user
    if (updatedItem.studentId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized access to this review item' },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: updatedItem._id.toString(),
        conceptKey: updatedItem.conceptKey,
        easeFactor: updatedItem.easeFactor,
        interval: updatedItem.interval,
        repetitions: updatedItem.repetitions,
        nextReviewDate: updatedItem.nextReviewDate,
        correctCount: updatedItem.correctCount,
        incorrectCount: updatedItem.incorrectCount,
      },
      message:
        quality >= 3
          ? `Great! Next review in ${updatedItem.interval} day(s)`
          : 'Keep practicing! You will see this again soon.',
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import { evaluateNextNode } from '@/lib/adaptive/learning-path';
import { ApiResponse } from '@/types';

/**
 * GET /api/learning-path/next
 * Get recommended next module based on student performance
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
        { success: false, error: 'Only students can access this endpoint' },
        { status: 403 }
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

    // Evaluate next node based on performance
    const result = await evaluateNextNode(session.user.id, courseId);

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        nextNode: result.nextNode,
        branch: result.branch,
        recommendation: result.recommendation,
      },
    });
  } catch (error) {
    console.error('Error getting next node:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to get next module recommendation' },
      { status: 500 }
    );
  }
}

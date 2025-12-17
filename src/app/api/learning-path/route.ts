import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import { LearningPath, StudentLearningPath } from '@/lib/db/models/LearningPath';
import { generateCoursePath, initializeStudentPath } from '@/lib/adaptive/learning-path';
import { ApiResponse } from '@/types';

/**
 * GET /api/learning-path
 * Get student's current learning path for a course
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

    // Get course learning path
    const coursePath = await LearningPath.findOne({ courseId }).lean();
    if (!coursePath) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course learning path not found' },
        { status: 404 }
      );
    }

    // If student, get their personalized path
    if (session.user.role === 'student') {
      const studentPath = await StudentLearningPath.findOne({
        studentId: session.user.id,
        courseId,
      }).lean();

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          coursePath,
          studentPath,
        },
      });
    }

    // For teachers, just return course path
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { coursePath },
    });
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch learning path' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning-path
 * Initialize learning path for a new enrollment
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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Teachers can generate course paths
    if (session.user.role === 'teacher') {
      const result = await generateCoursePath(courseId);
      if (!result.success) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Course learning path generated successfully',
        data: result.path,
      });
    }

    // Students initialize their personal path
    if (session.user.role === 'student') {
      const result = await initializeStudentPath(session.user.id, courseId);
      if (!result.success) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Student learning path initialized successfully',
        data: result.studentPath,
      });
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid user role' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error initializing learning path:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to initialize learning path' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import { generateLearningOutcomes } from '@/lib/ai/anthropic';
import { ApiResponse, LearningOutcome } from '@/types';

// GET /api/courses/[id]/outcomes - Get learning outcomes for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    await connectDB();

    const course = await Course.findById(courseId).lean();

    if (!course) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        outcomes: (course as any).learningOutcomes || [],
        interactiveSettings: (course as any).interactiveSettings,
      },
    });
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch outcomes' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/outcomes - Generate learning outcomes using AI
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'teacher') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only teachers can generate outcomes' },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;

    await connectDB();

    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (course.teacherId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only modify your own courses' },
        { status: 403 }
      );
    }

    // Generate outcomes using AI
    const outcomes = await generateLearningOutcomes(
      course.title,
      course.description,
      course.rawContent || ''
    );

    // Save outcomes to course
    course.learningOutcomes = outcomes;
    await course.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Learning outcomes generated successfully',
      data: { outcomes },
    });
  } catch (error) {
    console.error('Error generating outcomes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate outcomes' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id]/outcomes - Update learning outcomes (teacher approval/editing)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'teacher') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only teachers can update outcomes' },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;
    const { outcomes, interactiveSettings } = await req.json();

    await connectDB();

    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (course.teacherId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only modify your own courses' },
        { status: 403 }
      );
    }

    // Update outcomes if provided
    if (outcomes) {
      // Validate outcomes structure
      const validatedOutcomes = outcomes.map((o: LearningOutcome, index: number) => ({
        id: o.id || `outcome_${index + 1}`,
        description: o.description,
        aiSuggested: o.aiSuggested ?? false,
        teacherApproved: o.teacherApproved ?? true, // Teacher is editing, so mark as approved
        order: o.order ?? index + 1,
        relatedModules: o.relatedModules || [],
      }));

      course.learningOutcomes = validatedOutcomes;
    }

    // Update interactive settings if provided
    if (interactiveSettings) {
      course.interactiveSettings = {
        interactionFrequency: interactiveSettings.interactionFrequency || 'medium',
        adaptiveLearningEnabled: interactiveSettings.adaptiveLearningEnabled ?? true,
        gradingWeight: {
          interactions: interactiveSettings.gradingWeight?.interactions ?? 0.30,
          assessments: interactiveSettings.gradingWeight?.assessments ?? 0.70,
        },
      };
    }

    await course.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course settings updated successfully',
      data: {
        outcomes: course.learningOutcomes,
        interactiveSettings: course.interactiveSettings,
      },
    });
  } catch (error) {
    console.error('Error updating outcomes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update outcomes' },
      { status: 500 }
    );
  }
}

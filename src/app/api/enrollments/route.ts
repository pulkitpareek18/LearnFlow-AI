import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Enrollment from '@/lib/db/models/Enrollment';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse } from '@/types';

// Ensure models are registered for populate
void Chapter;
void Module;

// GET /api/enrollments - Get student's enrollments
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

    const enrollments = await Enrollment.find({ studentId: session.user.id })
      .populate({
        path: 'courseId',
        populate: [
          {
            path: 'teacherId',
            select: 'name email avatar',
          },
          {
            path: 'chapters',
            populate: {
              path: 'modules',
              select: '_id estimatedTime',
            },
          },
        ],
      })
      .sort({ enrolledAt: -1 })
      .lean();

    // Filter out enrollments where the course has been deleted
    const validEnrollments = enrollments.filter((e: any) => e.courseId !== null);

    // Clean up orphaned enrollments in background (don't wait)
    const orphanedEnrollmentIds = enrollments
      .filter((e: any) => e.courseId === null)
      .map((e: any) => e._id);

    if (orphanedEnrollmentIds.length > 0) {
      // Delete orphaned enrollments and their progress records
      Enrollment.deleteMany({ _id: { $in: orphanedEnrollmentIds } }).catch(console.error);
      StudentProgress.deleteMany({
        studentId: session.user.id,
        courseId: { $in: orphanedEnrollmentIds.map((e: any) => e.courseId) }
      }).catch(console.error);
    }

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      validEnrollments.map(async (enrollment: any) => {
        const progress = await StudentProgress.findOne({
          studentId: session.user.id,
          courseId: enrollment.courseId?._id,
        }).lean();

        // Calculate total modules in course
        let totalModules = 0;
        let totalEstimatedTime = 0;
        if (enrollment.courseId?.chapters) {
          enrollment.courseId.chapters.forEach((chapter: any) => {
            if (chapter.modules) {
              totalModules += chapter.modules.length;
              chapter.modules.forEach((module: any) => {
                totalEstimatedTime += module.estimatedTime || 0;
              });
            }
          });
        }

        const completedModules = progress?.completedModules?.length || 0;
        const progressPercent = totalModules > 0
          ? Math.round((completedModules / totalModules) * 100)
          : 0;

        // Calculate estimated time remaining
        const completedTime = progress?.learningMetrics?.totalTimeSpent || 0;
        const estimatedTimeRemaining = Math.max(0, totalEstimatedTime - completedTime);

        return {
          ...enrollment,
          progress: progressPercent,
          completedModules,
          totalModules,
          totalEstimatedTime,
          estimatedTimeRemaining,
          lastAccessedAt: progress?.lastAccessedAt,
        };
      })
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: enrollmentsWithProgress,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Enroll in a course
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
        { success: false, error: 'Only students can enroll in courses' },
        { status: 403 }
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

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This course is not available for enrollment' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: session.user.id,
      courseId,
      status: 'active',
    });

    // Add student to course's enrolled students
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: session.user.id },
    });

    // Initialize student progress
    await StudentProgress.create({
      studentId: session.user.id,
      courseId,
      completedModules: [],
      completedChapters: [],
      assessmentScores: [],
      learningMetrics: {
        averageTimePerModule: 0,
        averageScore: 0,
        streakDays: 0,
        totalTimeSpent: 0,
        adaptiveDifficulty: 5,
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Successfully enrolled in course',
        data: enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

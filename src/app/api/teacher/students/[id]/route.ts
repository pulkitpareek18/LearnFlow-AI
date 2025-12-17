import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';
import User from '@/lib/db/models/User';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Assessment from '@/lib/db/models/Assessment';
import { ApiResponse } from '@/types';

// GET /api/teacher/students/[id] - Get detailed student info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: studentId } = await params;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    await connectDB();

    // Get teacher's courses
    const teacherCourses = await Course.find({ teacherId: session.user.id }).select('_id title');
    const teacherCourseIds = teacherCourses.map(c => c._id.toString());

    // Verify student is enrolled in teacher's course
    const enrollments = await Enrollment.find({
      studentId,
      courseId: { $in: teacherCourseIds },
      status: 'active',
    }).populate('courseId', 'title description');

    if (enrollments.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Student not found in your courses' },
        { status: 404 }
      );
    }

    // Get student info
    const student = await User.findById(studentId).select('name email createdAt').lean();
    if (!student) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get progress for all enrolled courses
    const progressRecords = await StudentProgress.find({
      studentId,
      courseId: { $in: teacherCourseIds },
    }).lean();

    // Get assessments for enrolled courses
    const assessments = await Assessment.find({
      courseId: { $in: teacherCourseIds },
    }).select('_id courseId type questions passingScore').lean();

    // Build course progress data
    const courseProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.courseId as any;
        const progress = progressRecords.find(
          (p) => p.courseId.toString() === course._id.toString()
        );

        const courseAssessments = assessments.filter(
          (a) => a.courseId.toString() === course._id.toString()
        );

        const assessmentScores = progress?.assessmentScores || [];
        const completedAssessments = assessmentScores.length;
        const avgAssessmentScore = assessmentScores.length > 0
          ? Math.round(
              assessmentScores.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) /
                assessmentScores.length
            )
          : 0;

        return {
          courseId: course._id.toString(),
          courseTitle: course.title,
          enrolledAt: enrollment.enrolledAt,
          completedModules: progress?.completedModules?.length || 0,
          totalXP: progress?.gamification?.totalXP || 0,
          level: progress?.gamification?.level || 1,
          currentStreak: progress?.gamification?.currentStreak || 0,
          badges: progress?.gamification?.badges || [],
          assessments: {
            completed: completedAssessments,
            total: courseAssessments.length,
            averageScore: avgAssessmentScore,
          },
          learningMetrics: progress?.learningMetrics || {
            totalTimeSpent: 0,
            averageScore: 0,
            completionRate: 0,
          },
          recentActivity: progress?.gamification?.lastActivityDate,
        };
      })
    );

    // Calculate overall stats
    const totalXP = courseProgress.reduce((sum, c) => sum + c.totalXP, 0);
    const totalModules = courseProgress.reduce((sum, c) => sum + c.completedModules, 0);
    const avgScore = courseProgress.length > 0
      ? Math.round(
          courseProgress.reduce((sum, c) => sum + (c.learningMetrics?.averageScore || 0), 0) /
            courseProgress.length
        )
      : 0;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          joinedAt: student.createdAt,
        },
        overallStats: {
          totalCourses: enrollments.length,
          totalXP,
          totalModulesCompleted: totalModules,
          averageScore: avgScore,
          maxStreak: Math.max(...courseProgress.map(c => c.currentStreak), 0),
        },
        courseProgress,
      },
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch student details' },
      { status: 500 }
    );
  }
}

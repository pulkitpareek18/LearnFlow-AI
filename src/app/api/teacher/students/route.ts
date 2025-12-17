import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';
import User from '@/lib/db/models/User';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get teacher's courses
    const courses = await Course.find({ teacherId: session.user.id }).select('_id title');
    const courseIds = courses.map(c => c._id);
    const courseMap = new Map(courses.map(c => [c._id.toString(), c.title]));

    // Get enrollments for teacher's courses
    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds }
    }).populate('studentId', 'name email');

    // Get progress for each enrollment
    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = enrollment.studentId as unknown as { _id: string; name: string; email: string };

        // Calculate progress
        const progress = await StudentProgress.findOne({
          studentId: student._id,
          courseId: enrollment.courseId,
        });

        // Calculate progress percentage based on completed modules
        const completedModules = progress?.completedModules?.length || 0;
        const learningMetrics = progress?.learningMetrics as { averageScore?: number } | undefined;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          enrolledAt: enrollment.enrolledAt,
          courseId: enrollment.courseId.toString(),
          courseName: courseMap.get(enrollment.courseId.toString()) || 'Unknown Course',
          progress: learningMetrics?.averageScore || 0,
          completedModules,
        };
      })
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

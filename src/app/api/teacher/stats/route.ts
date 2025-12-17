import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';
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

    // Get teacher's course IDs
    const courses = await Course.find({ teacherId: session.user.id }).select('_id');
    const courseIds = courses.map(c => c._id);

    // Count unique students enrolled in teacher's courses
    const enrollments = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$studentId' } },
      { $count: 'totalStudents' }
    ]);

    const totalStudents = enrollments[0]?.totalStudents || 0;

    // Get total enrollments count
    const totalEnrollments = await Enrollment.countDocuments({
      courseId: { $in: courseIds }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalStudents,
        totalEnrollments,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

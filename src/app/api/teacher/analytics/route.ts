import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';
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

    // Get teacher's courses with chapters populated
    const courses = await Course.find({ teacherId: session.user.id })
      .populate('chapters')
      .lean();

    const courseIds = courses.map(c => c._id);

    // Get enrollment counts per course
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } }
    ]);

    const enrollmentMap = new Map(
      enrollmentCounts.map(e => [e._id.toString(), e.count])
    );

    // Get unique students
    const uniqueStudents = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$studentId' } },
      { $count: 'total' }
    ]);

    // Get average progress per course
    const progressData = await StudentProgress.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: '$courseId',
          avgProgress: { $avg: '$overallProgress' }
        }
      }
    ]);

    const progressMap = new Map(
      progressData.map(p => [p._id.toString(), Math.round(p.avgProgress || 0)])
    );

    // Build course analytics
    const courseAnalytics = courses.map(course => ({
      _id: course._id.toString(),
      title: course.title,
      isPublished: course.isPublished,
      enrollmentCount: enrollmentMap.get(course._id.toString()) || 0,
      chaptersCount: Array.isArray(course.chapters) ? course.chapters.length : 0,
      avgProgress: progressMap.get(course._id.toString()) || 0,
    }));

    // Sort by enrollment count
    courseAnalytics.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    const totalEnrollments = enrollmentCounts.reduce((acc, e) => acc + e.count, 0);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.isPublished).length,
        totalStudents: uniqueStudents[0]?.total || 0,
        totalEnrollments,
        courses: courseAnalytics,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

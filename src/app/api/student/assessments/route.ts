import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Assessment from '@/lib/db/models/Assessment';
import Enrollment from '@/lib/db/models/Enrollment';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse } from '@/types';

// GET /api/student/assessments - Get all assessments for enrolled courses
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

    // Get student's enrolled courses
    const enrollments = await Enrollment.find({
      studentId: session.user.id,
      status: 'active',
    }).populate({
      path: 'courseId',
      select: '_id title',
    });

    // Filter out enrollments where course was deleted
    const validEnrollments = enrollments.filter(e => e.courseId !== null);
    const courseIds = validEnrollments.map((e: any) => e.courseId._id);
    const courseMap = new Map(
      validEnrollments.map((e: any) => [e.courseId._id.toString(), e.courseId.title])
    );

    if (courseIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: [],
      });
    }

    // Get all assessments for enrolled courses
    const assessments = await Assessment.find({
      courseId: { $in: courseIds },
    })
      .populate('chapterId', 'title order')
      .sort({ createdAt: -1 })
      .lean();

    // Get student progress to check completed assessments
    const progressRecords = await StudentProgress.find({
      studentId: session.user.id,
      courseId: { $in: courseIds },
    }).lean();

    // Create a map of completed assessments with scores
    const completedAssessments = new Map<string, { score: number; completedAt: Date }>();
    for (const progress of progressRecords) {
      for (const scoreRecord of progress.assessmentScores || []) {
        completedAssessments.set(scoreRecord.assessmentId.toString(), {
          score: scoreRecord.score,
          completedAt: scoreRecord.completedAt,
        });
      }
    }

    // Format assessments for frontend
    const formattedAssessments = assessments.map((assessment: any) => {
      const completed = completedAssessments.get(assessment._id.toString());
      const totalPoints = assessment.questions.reduce(
        (sum: number, q: any) => sum + (q.points || 10),
        0
      );

      // Generate title based on type and chapter
      let title = '';
      if (assessment.type === 'final') {
        title = 'Final Assessment';
      } else if (assessment.chapterId) {
        title = `Chapter Quiz: ${assessment.chapterId.title}`;
      } else {
        title = `${assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}`;
      }

      return {
        _id: assessment._id,
        title,
        courseTitle: courseMap.get(assessment.courseId.toString()) || 'Unknown Course',
        courseId: assessment.courseId.toString(),
        chapterId: assessment.chapterId?._id?.toString(),
        chapterTitle: assessment.chapterId?.title,
        type: assessment.type,
        status: completed ? 'completed' : 'pending',
        score: completed?.score,
        maxScore: totalPoints,
        completedAt: completed?.completedAt,
        questionCount: assessment.questions.length,
        timeLimit: assessment.timeLimit,
        passingScore: assessment.passingScore,
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: formattedAssessments,
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

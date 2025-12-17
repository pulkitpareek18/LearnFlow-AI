import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Assessment from '@/lib/db/models/Assessment';
import Enrollment from '@/lib/db/models/Enrollment';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse } from '@/types';

// GET /api/student/assessments/[id] - Get a single assessment with questions
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

    const { id } = await params;
    await connectDB();

    // Get the assessment
    const assessment = await Assessment.findById(id)
      .populate('courseId', 'title')
      .populate('chapterId', 'title')
      .lean();

    if (!assessment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Verify user is enrolled in the course
    const courseData = assessment.courseId as any;
    const enrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId: courseData._id,
      status: 'active',
    });

    if (!enrollment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Check if already completed
    const progress = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId: courseData._id,
    }).lean();

    const existingScore = progress?.assessmentScores?.find(
      (s: any) => s.assessmentId.toString() === id
    );

    // Generate title
    let title = '';
    if (assessment.type === 'final') {
      title = 'Final Assessment';
    } else if (assessment.chapterId) {
      title = `Chapter Quiz: ${(assessment.chapterId as any).title}`;
    } else {
      title = assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1);
    }

    const totalPoints = assessment.questions.reduce(
      (sum: number, q: any) => sum + (q.points || 10),
      0
    );

    // Return assessment without correct answers if not completed
    const questions = assessment.questions.map((q: any, index: number) => ({
      id: q._id.toString(),
      index,
      question: q.question,
      type: q.type,
      options: q.options || [],
      points: q.points || 10,
      difficulty: q.difficulty || 3,
      // Only include correct answer and explanation if already completed
      ...(existingScore && {
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }),
    }));

    const chapterData = assessment.chapterId as any;
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        _id: assessment._id,
        title,
        courseTitle: courseData.title,
        courseId: courseData._id,
        chapterId: chapterData?._id,
        chapterTitle: chapterData?.title,
        type: assessment.type,
        questions,
        questionCount: assessment.questions.length,
        timeLimit: assessment.timeLimit,
        passingScore: assessment.passingScore,
        maxScore: totalPoints,
        completed: !!existingScore,
        score: existingScore?.score,
        completedAt: existingScore?.completedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

// POST /api/student/assessments/[id] - Submit assessment answers
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

    const { id } = await params;
    const body = await req.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Answers are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the assessment
    const assessment = await Assessment.findById(id)
      .populate('courseId', 'title')
      .populate('chapterId', 'title')
      .lean();

    if (!assessment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Verify user is enrolled
    const postCourseData = assessment.courseId as any;
    const enrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId: postCourseData._id,
      status: 'active',
    });

    if (!enrollment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Calculate score
    let earnedPoints = 0;
    const results = assessment.questions.map((q: any, index: number) => {
      const userAnswer = answers.find((a: any) => a.questionId === q._id.toString());
      const isCorrect = userAnswer?.answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();

      if (isCorrect) {
        earnedPoints += q.points || 10;
      }

      return {
        questionId: q._id.toString(),
        question: q.question,
        type: q.type,
        options: q.options || [],
        userAnswer: userAnswer?.answer || '',
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: q.points || 10,
        earnedPoints: isCorrect ? (q.points || 10) : 0,
        explanation: q.explanation,
      };
    });

    const totalPoints = assessment.questions.reduce(
      (sum: number, q: any) => sum + (q.points || 10),
      0
    );

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= assessment.passingScore;

    // Update student progress
    await StudentProgress.findOneAndUpdate(
      {
        studentId: session.user.id,
        courseId: postCourseData._id,
      },
      {
        $push: {
          assessmentScores: {
            assessmentId: assessment._id,
            score: earnedPoints,
            percentage,
            passed,
            completedAt: new Date(),
          },
        },
        $inc: {
          'gamification.totalXP': passed ? Math.round(earnedPoints * 2) : Math.round(earnedPoints * 0.5),
        },
        $set: {
          'gamification.lastActivityDate': new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        score: earnedPoints,
        maxScore: totalPoints,
        percentage,
        passed,
        passingScore: assessment.passingScore,
        results,
        xpEarned: passed ? Math.round(earnedPoints * 2) : Math.round(earnedPoints * 0.5),
      },
      message: passed
        ? `Congratulations! You passed with ${percentage}%!`
        : `You scored ${percentage}%. ${assessment.passingScore}% is required to pass.`,
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}

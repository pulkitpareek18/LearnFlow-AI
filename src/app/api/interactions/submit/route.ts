import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Module from '@/lib/db/models/Module';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { gradeReflectionResponse, gradeCodeResponse } from '@/lib/ai/anthropic';
import { ApiResponse, InteractionType, MCQResponse, FillBlankResponse, ReflectionResponse, ConfirmResponse, CodeResponse } from '@/types';

interface SubmitInteractionRequest {
  moduleId: string;
  courseId: string;
  blockId: string;
  interactionType: InteractionType;
  response: MCQResponse | FillBlankResponse | ReflectionResponse | ConfirmResponse | CodeResponse;
  timeSpent: number; // in seconds
  attempt: number;
}

interface InteractionResult {
  isCorrect?: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  correctAnswer?: string;
  aiFeedback?: string;
}

// POST /api/interactions/submit - Submit an interaction response
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SubmitInteractionRequest = await req.json();
    const { moduleId, courseId, blockId, interactionType, response, timeSpent, attempt } = body;

    if (!moduleId || !courseId || !blockId || !interactionType || !response) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the module and find the specific content block
    const module = await Module.findById(moduleId).lean();
    if (!module) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Find the interaction block
    const contentBlocks = (module as any).contentBlocks || [];
    const block = contentBlocks.find((b: any) => b.id === blockId);

    if (!block || block.type !== 'interaction') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Interaction block not found' },
        { status: 404 }
      );
    }

    const interaction = block.interaction;
    let result: InteractionResult;

    // Grade the interaction based on type
    switch (interactionType) {
      case 'mcq':
        result = gradeMCQ(interaction, response as MCQResponse);
        break;
      case 'fill_blank':
        result = gradeFillBlank(interaction, response as FillBlankResponse);
        break;
      case 'reflection':
        result = await gradeReflection(interaction, response as ReflectionResponse);
        break;
      case 'reveal':
        result = { isCorrect: undefined, score: 0, maxScore: 0, feedback: 'Content revealed' };
        break;
      case 'confirm':
        result = gradeConfirm(response as ConfirmResponse);
        break;
      case 'code':
        result = await gradeCode(interaction, response as CodeResponse);
        break;
      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid interaction type' },
          { status: 400 }
        );
    }

    // Update student progress with this interaction response
    let progress = await StudentProgress.findOne({
      studentId: session.user.id,
      courseId,
    });

    if (!progress) {
      // Create progress record if it doesn't exist
      progress = await StudentProgress.create({
        studentId: session.user.id,
        courseId,
        completedModules: [],
        completedChapters: [],
        moduleInteractions: [],
        learningMetrics: {
          averageTimePerModule: 0,
          averageScore: 0,
          streakDays: 0,
          totalTimeSpent: 0,
          adaptiveDifficulty: 5,
          interactionScore: 0,
          interactionAccuracy: 0,
          conceptsMastered: [],
          conceptsStruggling: [],
          recentTrend: 'stable',
          correctStreak: 0,
          incorrectStreak: 0,
        },
      });
    }

    // Find or create module interaction progress
    let moduleInteraction = progress.moduleInteractions?.find(
      (mi: any) => mi.moduleId === moduleId
    );

    if (!moduleInteraction) {
      moduleInteraction = {
        moduleId,
        responses: [],
        totalScore: 0,
        maxPossibleScore: 0,
        percentageComplete: 0,
        adaptiveDifficultyAdjustment: 0,
      };
      progress.moduleInteractions = progress.moduleInteractions || [];
      progress.moduleInteractions.push(moduleInteraction);
    }

    // Update or add the response for this block
    const existingResponseIndex = moduleInteraction.responses.findIndex(
      (r: any) => r.blockId === blockId
    );

    const interactionResponse = {
      blockId,
      interactionType,
      response,
      isCorrect: result.isCorrect,
      score: result.score,
      maxScore: result.maxScore,
      timeSpent,
      attempts: attempt,
      aiFeedback: result.aiFeedback,
      submittedAt: new Date(),
    };

    if (existingResponseIndex >= 0) {
      moduleInteraction.responses[existingResponseIndex] = interactionResponse;
    } else {
      moduleInteraction.responses.push(interactionResponse);
    }

    // Recalculate module interaction totals
    const gradedResponses = moduleInteraction.responses.filter(
      (r: any) => r.maxScore > 0
    );
    moduleInteraction.totalScore = gradedResponses.reduce(
      (sum: number, r: any) => sum + (r.score || 0),
      0
    );
    moduleInteraction.maxPossibleScore = gradedResponses.reduce(
      (sum: number, r: any) => sum + r.maxScore,
      0
    );

    // Calculate percentage complete (count of interactions completed / total graded interactions in module)
    const totalGradedBlocks = contentBlocks.filter(
      (b: any) => b.type === 'interaction' && b.interaction?.points > 0
    ).length;
    moduleInteraction.percentageComplete = totalGradedBlocks > 0
      ? Math.round((gradedResponses.length / totalGradedBlocks) * 100)
      : 100;

    // Update learning metrics streaks
    // Cast to any since we're working with extended metrics from MongoDB
    const metrics: any = progress.learningMetrics || {};
    if (result.isCorrect === true) {
      metrics.correctStreak = (metrics.correctStreak || 0) + 1;
      metrics.incorrectStreak = 0;
    } else if (result.isCorrect === false) {
      metrics.incorrectStreak = (metrics.incorrectStreak || 0) + 1;
      metrics.correctStreak = 0;
    }

    // Update concept mastery based on the block's conceptKey
    if (block.conceptKey) {
      if (result.isCorrect === true && result.score === result.maxScore) {
        // Mastered concept
        if (!metrics.conceptsMastered?.includes(block.conceptKey)) {
          metrics.conceptsMastered = metrics.conceptsMastered || [];
          metrics.conceptsMastered.push(block.conceptKey);
        }
        // Remove from struggling if present
        metrics.conceptsStruggling = (metrics.conceptsStruggling || []).filter(
          (c: string) => c !== block.conceptKey
        );
      } else if (result.isCorrect === false) {
        // Struggling with concept
        if (!metrics.conceptsStruggling?.includes(block.conceptKey)) {
          metrics.conceptsStruggling = metrics.conceptsStruggling || [];
          metrics.conceptsStruggling.push(block.conceptKey);
        }
      }
    }

    // Calculate overall interaction accuracy
    const allResponses = (progress.moduleInteractions || []).flatMap(
      (mi: any) => mi.responses || []
    );
    const correctResponses = allResponses.filter((r: any) => r.isCorrect === true).length;
    const totalGraded = allResponses.filter((r: any) => r.isCorrect !== undefined).length;
    metrics.interactionAccuracy = totalGraded > 0
      ? Math.round((correctResponses / totalGraded) * 100)
      : 0;

    // Calculate overall interaction score
    const totalEarned = (progress.moduleInteractions || []).reduce(
      (sum: number, mi: any) => sum + (mi.totalScore || 0),
      0
    );
    const totalPossible = (progress.moduleInteractions || []).reduce(
      (sum: number, mi: any) => sum + (mi.maxPossibleScore || 0),
      0
    );
    metrics.interactionScore = totalPossible > 0
      ? Math.round((totalEarned / totalPossible) * 100)
      : 0;

    // Determine recent trend (based on last 10 responses)
    const recentResponses = allResponses.slice(-10);
    const recentCorrect = recentResponses.filter((r: any) => r.isCorrect === true).length;
    const recentTotal = recentResponses.filter((r: any) => r.isCorrect !== undefined).length;
    const recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : 50;

    if (recentAccuracy > metrics.interactionAccuracy + 10) {
      metrics.recentTrend = 'improving';
    } else if (recentAccuracy < metrics.interactionAccuracy - 10) {
      metrics.recentTrend = 'declining';
    } else {
      metrics.recentTrend = 'stable';
    }

    progress.learningMetrics = metrics;
    progress.lastAccessedAt = new Date();

    await progress.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...result,
        moduleProgress: {
          totalScore: moduleInteraction.totalScore,
          maxPossibleScore: moduleInteraction.maxPossibleScore,
          percentageComplete: moduleInteraction.percentageComplete,
        },
        overallMetrics: {
          interactionScore: metrics.interactionScore,
          interactionAccuracy: metrics.interactionAccuracy,
          correctStreak: metrics.correctStreak,
          incorrectStreak: metrics.incorrectStreak,
          recentTrend: metrics.recentTrend,
        },
      },
    });
  } catch (error) {
    console.error('Error submitting interaction:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to submit interaction' },
      { status: 500 }
    );
  }
}

// Grade MCQ interaction
function gradeMCQ(interaction: any, response: MCQResponse): InteractionResult {
  const selectedOption = interaction.options?.find(
    (opt: any) => opt.id === response.selectedOptionId
  );

  if (!selectedOption) {
    return {
      isCorrect: false,
      score: 0,
      maxScore: interaction.points || 10,
      feedback: 'Invalid option selected',
    };
  }

  const correctOption = interaction.options?.find((opt: any) => opt.isCorrect);

  return {
    isCorrect: selectedOption.isCorrect,
    score: selectedOption.isCorrect ? (interaction.points || 10) : 0,
    maxScore: interaction.points || 10,
    feedback: selectedOption.feedback || (selectedOption.isCorrect ? 'Correct!' : 'Incorrect'),
    correctAnswer: correctOption?.text,
  };
}

// Grade Fill in the Blank interaction
function gradeFillBlank(interaction: any, response: FillBlankResponse): InteractionResult {
  const blanks = interaction.blanks || [];
  let correctCount = 0;

  const results = blanks.map((blank: any) => {
    const userAnswer = (response.filledAnswers[blank.id] || '').toLowerCase().trim();
    const correctAnswer = blank.correctAnswer.toLowerCase().trim();
    const acceptableAnswers = (blank.acceptableAnswers || []).map((a: string) =>
      a.toLowerCase().trim()
    );

    const isCorrect = userAnswer === correctAnswer || acceptableAnswers.includes(userAnswer);
    if (isCorrect) correctCount++;

    return {
      blankId: blank.id,
      isCorrect,
      correctAnswer: blank.correctAnswer,
    };
  });

  const allCorrect = correctCount === blanks.length;
  const partialScore = Math.round((correctCount / blanks.length) * (interaction.points || 10));

  return {
    isCorrect: allCorrect,
    score: partialScore,
    maxScore: interaction.points || 10,
    feedback: allCorrect
      ? 'All blanks filled correctly!'
      : `You got ${correctCount} out of ${blanks.length} correct.`,
    correctAnswer: results
      .map((r: any) => `${r.blankId}: ${r.correctAnswer}`)
      .join(', '),
  };
}

// Grade Reflection interaction using AI
async function gradeReflection(interaction: any, response: ReflectionResponse): Promise<InteractionResult> {
  try {
    const grade = await gradeReflectionResponse(
      interaction.prompt,
      response.reflectionText,
      interaction.rubric,
      interaction.points || 15
    );

    return {
      isCorrect: grade.score >= (interaction.points || 15) * 0.7, // 70% threshold for "correct"
      score: grade.score,
      maxScore: grade.maxScore,
      feedback: grade.feedback,
      aiFeedback: JSON.stringify({
        suggestions: grade.suggestions,
        strengthAreas: grade.strengthAreas,
      }),
    };
  } catch (error) {
    console.error('Error grading reflection:', error);
    // Fallback to manual review needed
    return {
      isCorrect: undefined,
      score: 0,
      maxScore: interaction.points || 15,
      feedback: 'Your response has been recorded and will be reviewed.',
    };
  }
}

// Grade Confirm interaction (self-assessment, no right/wrong)
function gradeConfirm(response: ConfirmResponse): InteractionResult {
  const messages: Record<string, string> = {
    fully: "Great! You're confident in your understanding. Keep up the good work!",
    partially: "That's okay! Consider reviewing the key concepts before moving on.",
    not_yet: "No worries! Take your time to review this section again. Learning takes practice.",
  };

  return {
    isCorrect: undefined,
    score: 0,
    maxScore: 0,
    feedback: messages[response.understandingLevel] || 'Response recorded.',
  };
}

// Grade Code interaction
async function gradeCode(interaction: any, response: CodeResponse): Promise<InteractionResult & { testResults?: any[] }> {
  try {
    const testCases = interaction.testCases || [];
    const maxPoints = interaction.points || 20;

    // Use AI to grade the code
    const grade = await gradeCodeResponse(
      interaction.prompt,
      response.code,
      interaction.language,
      interaction.solutionCode,
      testCases,
      interaction.rubric,
      maxPoints
    );

    // Calculate score based on test results
    const passedTests = grade.testResults?.filter((r: any) => r.passed).length || 0;
    const totalTests = testCases.length;
    const testScore = totalTests > 0
      ? Math.round((passedTests / totalTests) * maxPoints * 0.7) // 70% for tests
      : 0;
    const codeQualityScore = Math.round(grade.codeQualityScore * maxPoints * 0.3); // 30% for code quality
    const totalScore = Math.min(testScore + codeQualityScore, maxPoints);

    return {
      isCorrect: passedTests === totalTests && grade.codeQualityScore >= 0.7,
      score: totalScore,
      maxScore: maxPoints,
      feedback: grade.feedback,
      aiFeedback: JSON.stringify({
        suggestions: grade.suggestions,
        codeQualityNotes: grade.codeQualityNotes,
        passedTests,
        totalTests,
      }),
      testResults: grade.testResults,
    };
  } catch (error) {
    console.error('Error grading code:', error);
    // Fallback to basic test-based grading
    return {
      isCorrect: undefined,
      score: 0,
      maxScore: interaction.points || 20,
      feedback: 'Your code has been submitted. Automated testing is currently unavailable.',
    };
  }
}

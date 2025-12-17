import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import Assessment from '@/lib/db/models/Assessment';
import { extractTextFromPDF, cleanText } from '@/lib/pdf/extract';
import {
  generateCourseStructure,
  generateModulesForChapter,
  generateInteractiveModuleContent,
  generateLearningOutcomes,
  generateAssessment,
} from '@/lib/ai/anthropic';
import { ApiResponse, ContentBlock } from '@/types';

/**
 * Sanitize and validate content blocks from AI generation
 * Ensures all required fields are present and valid
 */
function sanitizeContentBlocks(blocks: any[]): ContentBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.map((block, index) => {
    const sanitizedBlock: ContentBlock = {
      id: block.id || `block_${index + 1}`,
      order: typeof block.order === 'number' ? block.order : index + 1,
      type: block.type === 'interaction' ? 'interaction' : 'text',
      content: block.content || '',
      conceptKey: block.conceptKey || undefined,
      isRequired: block.isRequired || false,
    };

    // Sanitize interaction blocks
    if (sanitizedBlock.type === 'interaction' && block.interaction) {
      const interaction = block.interaction;
      const interactionType = interaction.type || 'mcq';

      // Build interaction based on type
      if (interactionType === 'mcq') {
        const options = Array.isArray(interaction.options)
          ? interaction.options.map((opt: any, optIndex: number) => ({
              id: opt.id || `opt_${optIndex + 1}`,
              text: opt.text || opt.label || opt.content || `Option ${optIndex + 1}`,
              isCorrect: typeof opt.isCorrect === 'boolean' ? opt.isCorrect :
                         typeof opt.correct === 'boolean' ? opt.correct : optIndex === 0,
              feedback: opt.feedback || opt.explanation || '',
            }))
          : [
              { id: 'opt_1', text: 'Option A', isCorrect: true, feedback: '' },
              { id: 'opt_2', text: 'Option B', isCorrect: false, feedback: '' },
            ];

        sanitizedBlock.interaction = {
          type: 'mcq' as const,
          question: interaction.question || '',
          options,
          explanation: interaction.explanation || '',
          points: interaction.points || 0,
        };
      } else if (interactionType === 'fill_blank') {
        const blanks = Array.isArray(interaction.blanks)
          ? interaction.blanks.map((blank: any, blankIndex: number) => ({
              id: blank.id || `blank_${blankIndex + 1}`,
              correctAnswer: blank.correctAnswer || blank.answer || '',
              acceptableAnswers: Array.isArray(blank.acceptableAnswers) ? blank.acceptableAnswers : [],
              hint: blank.hint || '',
            }))
          : [];

        sanitizedBlock.interaction = {
          type: 'fill_blank' as const,
          text: interaction.text || '',
          blanks,
          points: interaction.points || 0,
        };
      } else if (interactionType === 'reflection') {
        sanitizedBlock.interaction = {
          type: 'reflection' as const,
          prompt: interaction.prompt || interaction.question || '',
          rubric: interaction.rubric || '',
          minWords: interaction.minWords || 10,
          maxWords: interaction.maxWords || 500,
          points: interaction.points || 0,
        };
      } else if (interactionType === 'reveal') {
        sanitizedBlock.interaction = {
          type: 'reveal' as const,
          buttonText: interaction.buttonText || 'Show Answer',
          revealedContent: interaction.revealedContent || interaction.content || '',
        };
      } else if (interactionType === 'confirm') {
        const options = Array.isArray(interaction.options || interaction.confirmOptions)
          ? (interaction.options || interaction.confirmOptions)
          : [
              { text: 'I understand completely', value: 'fully' as const },
              { text: 'I partially understand', value: 'partially' as const },
              { text: 'I need to review this', value: 'not_yet' as const },
            ];

        sanitizedBlock.interaction = {
          type: 'confirm' as const,
          statement: interaction.statement || '',
          options,
        };
      }
    }

    return sanitizedBlock;
  });
}

// POST /api/courses/[id]/generate - Generate course content from PDF
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is the course owner
    if (course.teacherId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Check if PDF exists
    if (!course.pdfUrl) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No PDF uploaded for this course' },
        { status: 400 }
      );
    }

    // Extract text from PDF
    let rawContent = course.rawContent;
    if (!rawContent) {
      const extraction = await extractTextFromPDF(course.pdfUrl);
      rawContent = cleanText(extraction.text);
      course.rawContent = rawContent;
      await course.save();
    }

    // Get request body for interactive options
    let interactiveMode = true;
    let interactionFrequency: 'low' | 'medium' | 'high' = 'medium';
    try {
      const body = await req.json();
      interactiveMode = body.interactiveMode !== false;
      interactionFrequency = body.interactionFrequency || 'medium';
    } catch {
      // Default values if no body
    }

    // Generate learning outcomes for the course
    console.log('Generating learning outcomes...');
    const learningOutcomes = await generateLearningOutcomes(
      course.title,
      course.description || '',
      rawContent.substring(0, 15000)
    );

    // Save learning outcomes to course
    course.learningOutcomes = learningOutcomes;
    course.interactiveSettings = {
      interactionFrequency,
      adaptiveLearningEnabled: true,
      gradingWeight: {
        interactions: 0.30,
        assessments: 0.70,
      },
    };
    await course.save();

    // Generate course structure using AI
    console.log('Generating course structure...');
    const generatedChapters = await generateCourseStructure(rawContent, course.title);

    // Delete existing chapters, modules, and assessments
    const existingChapters = await Chapter.find({ courseId: id });
    for (const chapter of existingChapters) {
      await Module.deleteMany({ chapterId: chapter._id });
    }
    await Chapter.deleteMany({ courseId: id });
    await Assessment.deleteMany({ courseId: id });

    // Extract learning outcome descriptions for interactive content
    const outcomeDescriptions = learningOutcomes.map((o: any) => o.description);

    // Create chapters and modules
    const chapterIds: string[] = [];

    for (const genChapter of generatedChapters) {
      // Create chapter
      const chapter = await Chapter.create({
        courseId: id,
        title: genChapter.title,
        order: genChapter.order,
      });

      chapterIds.push(chapter._id.toString());

      // Generate modules for this chapter
      console.log(`Generating modules for chapter: ${genChapter.title}`);
      const generatedModules = await generateModulesForChapter(
        genChapter.title,
        genChapter.content,
        `${course.title}: ${course.description}`
      );

      const moduleIds: string[] = [];

      for (const genModule of generatedModules) {
        let moduleData: any = {
          chapterId: chapter._id,
          title: genModule.title,
          content: genModule.content,
          contentType: 'lesson',
          aiGeneratedContent: {
            summary: genModule.content.substring(0, 200),
            keyPoints: genModule.keyPoints,
            examples: genModule.examples,
            practiceQuestions: [],
          },
          order: genModule.order,
          estimatedTime: genModule.estimatedTime,
          isInteractive: false,
          difficultyLevel: 5,
        };

        // Generate interactive content if enabled
        if (interactiveMode) {
          try {
            console.log(`Generating interactive content for module: ${genModule.title}`);
            const interactiveContent = await generateInteractiveModuleContent(
              genModule.title,
              genModule.content,
              `${course.title}: ${genChapter.title}`,
              outcomeDescriptions,
              5, // Default difficulty
              interactionFrequency
            );

            // Sanitize content blocks to ensure they match the schema
            const sanitizedBlocks = sanitizeContentBlocks(interactiveContent.contentBlocks);

            moduleData = {
              ...moduleData,
              contentBlocks: sanitizedBlocks,
              isInteractive: true,
              estimatedTime: interactiveContent.estimatedTime || genModule.estimatedTime,
            };
          } catch (interactiveError) {
            console.error('Failed to generate interactive content, using plain content:', interactiveError);
            // Fall back to non-interactive content
          }
        }

        const module = await Module.create(moduleData);
        moduleIds.push(module._id.toString());
      }

      // Update chapter with module IDs
      chapter.modules = moduleIds as unknown as typeof chapter.modules;
      await chapter.save();

      // Generate chapter-end quiz assessment
      if (interactiveMode && generatedModules.length > 0) {
        try {
          console.log(`Generating chapter quiz for: ${genChapter.title}`);

          // Combine all module content and key points for the chapter
          const chapterContent = generatedModules.map(m => m.content).join('\n\n');
          const chapterKeyPoints = generatedModules.flatMap(m => m.keyPoints || []);

          const assessmentQuestions = await generateAssessment(
            genChapter.title,
            chapterContent.substring(0, 8000),
            chapterKeyPoints,
            5 // 5 questions per chapter quiz
          );

          await Assessment.create({
            courseId: id,
            chapterId: chapter._id,
            type: 'quiz',
            questions: assessmentQuestions,
            passingScore: 60,
            timeLimit: 15, // 15 minutes for chapter quiz
          });
        } catch (assessmentError) {
          console.error('Failed to generate chapter assessment:', assessmentError);
          // Continue without assessment
        }
      }
    }

    // Generate final course assessment
    if (interactiveMode) {
      try {
        console.log('Generating final course assessment...');

        // Use learning outcomes and course content for final exam
        const finalExamContent = rawContent.substring(0, 10000);
        const finalKeyPoints = outcomeDescriptions;

        const finalQuestions = await generateAssessment(
          `Final Assessment: ${course.title}`,
          finalExamContent,
          finalKeyPoints,
          10 // 10 questions for final exam
        );

        await Assessment.create({
          courseId: id,
          type: 'final',
          questions: finalQuestions,
          passingScore: 70,
          timeLimit: 30, // 30 minutes for final exam
        });
      } catch (finalError) {
        console.error('Failed to generate final assessment:', finalError);
      }
    }

    // Update course with chapter IDs
    course.chapters = chapterIds as unknown as typeof course.chapters;
    await course.save();

    // Fetch the complete course with populated data
    const updatedCourse = await Course.findById(id)
      .populate({
        path: 'chapters',
        populate: {
          path: 'modules',
        },
      });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course content generated successfully',
      data: updatedCourse,
    });
  } catch (error) {
    console.error('Error generating course content:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate course content' },
      { status: 500 }
    );
  }
}

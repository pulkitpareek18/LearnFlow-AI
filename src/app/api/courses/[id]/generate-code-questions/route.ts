import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import { ApiResponse, CodeResource, ContentBlock } from '@/types';
import {
  generateCodeQuestionsFromContent,
  mapCodeQuestionsToModules,
  GeneratedCodeQuestion,
} from '@/lib/ai/anthropic';

// POST /api/courses/[id]/generate-code-questions - Generate code questions and map to modules
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

    const course = await Course.findById(id).populate({
      path: 'chapters',
      populate: {
        path: 'modules',
      },
    });

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

    const body = await req.json();
    const {
      resourceIds, // Which code resources to use
      questionTypes = ['implementation', 'completion'],
      difficultyDistribution = { easy: 30, medium: 50, hard: 20 },
      questionsPerResource = 3,
      autoInsert = true, // Automatically insert into modules
    } = body;

    // Get code resources
    let resources: CodeResource[] = course.codeResources || [];
    if (resourceIds && resourceIds.length > 0) {
      resources = resources.filter((r: CodeResource) =>
        resourceIds.includes(r.id)
      );
    }

    if (resources.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No code resources found. Add code files or GitHub URLs first.' },
        { status: 400 }
      );
    }

    // Get all modules for mapping
    const allModules: any[] = [];
    for (const chapter of (course.chapters as any[])) {
      for (const module of (chapter.modules as any[])) {
        allModules.push({
          id: module._id.toString(),
          title: module.title,
          content: module.content,
          keyPoints: module.aiGeneratedContent?.keyPoints || [],
        });
      }
    }

    if (allModules.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No modules found. Generate course content first.' },
        { status: 400 }
      );
    }

    // Generate questions for each resource
    const allGeneratedQuestions: {
      question: GeneratedCodeQuestion;
      resource: CodeResource;
    }[] = [];

    for (const resource of resources) {
      if (!resource.content) continue;

      // Determine difficulty based on distribution
      const difficulties: ('easy' | 'medium' | 'hard')[] = [];
      const easyCount = Math.round(questionsPerResource * (difficultyDistribution.easy / 100));
      const mediumCount = Math.round(questionsPerResource * (difficultyDistribution.medium / 100));
      const hardCount = questionsPerResource - easyCount - mediumCount;

      for (let i = 0; i < easyCount; i++) difficulties.push('easy');
      for (let i = 0; i < mediumCount; i++) difficulties.push('medium');
      for (let i = 0; i < hardCount; i++) difficulties.push('hard');

      // Generate questions for this resource at each difficulty level
      for (const difficulty of [...new Set(difficulties)]) {
        const count = difficulties.filter(d => d === difficulty).length;
        if (count === 0) continue;

        try {
          const questions = await generateCodeQuestionsFromContent(
            resource.content,
            resource.language,
            allModules.map(m => m.title),
            questionTypes,
            difficulty,
            count
          );

          for (const question of questions) {
            allGeneratedQuestions.push({
              question,
              resource,
            });
          }
        } catch (error) {
          console.error(`Error generating questions for resource ${resource.id}:`, error);
          // Continue with other resources
        }
      }
    }

    if (allGeneratedQuestions.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to generate any code questions' },
        { status: 500 }
      );
    }

    // Map questions to modules
    const mappings = await mapCodeQuestionsToModules(
      allGeneratedQuestions.map(q => q.question),
      allModules
    );

    // Group questions by module
    const questionsByModule: Record<string, {
      question: GeneratedCodeQuestion;
      resource: CodeResource;
      relevanceScore: number;
    }[]> = {};

    mappings.forEach((mapping, index) => {
      const moduleId = mapping.moduleId;
      if (!questionsByModule[moduleId]) {
        questionsByModule[moduleId] = [];
      }
      questionsByModule[moduleId].push({
        ...allGeneratedQuestions[mapping.questionIndex],
        relevanceScore: mapping.relevanceScore,
      });
    });

    // If autoInsert is true, add questions to modules
    if (autoInsert) {
      for (const [moduleId, questions] of Object.entries(questionsByModule)) {
        const module = await Module.findById(moduleId);
        if (!module) continue;

        // Get existing content blocks
        const contentBlocks: ContentBlock[] = (module as any).contentBlocks || [];

        // Add code interaction blocks
        for (const { question, resource } of questions) {
          const newBlock: ContentBlock = {
            id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            order: contentBlocks.length + 1,
            type: 'interaction',
            interaction: {
              type: 'code',
              prompt: question.prompt,
              language: question.language as any,
              starterCode: question.starterCode,
              solutionCode: question.solutionCode,
              testCases: question.testCases,
              hints: question.hints,
              rubric: `Evaluate based on: correctness, code quality, efficiency, and handling of edge cases.`,
              timeLimit: question.difficulty === 'easy' ? 300 : question.difficulty === 'medium' ? 600 : 900,
              memoryLimit: 128,
              points: question.points,
              difficulty: question.difficulty,
              conceptsAssessed: question.conceptsAssessed,
            },
            conceptKey: `code_${question.conceptsAssessed[0] || 'general'}`,
            isRequired: true,
          };

          contentBlocks.push(newBlock);
        }

        // Update module
        (module as any).contentBlocks = contentBlocks;
        (module as any).isInteractive = true;
        await module.save();

        // Update code resource with mapped module IDs
        const resourceIds = questions.map(q => q.resource.id);
        for (const resourceId of [...new Set(resourceIds)]) {
          const resourceIndex = (course.codeResources || []).findIndex(
            (r: CodeResource) => r.id === resourceId
          );
          if (resourceIndex !== -1) {
            const existingMappings = (course.codeResources as CodeResource[])[resourceIndex].mappedModuleIds || [];
            if (!existingMappings.includes(moduleId)) {
              (course.codeResources as CodeResource[])[resourceIndex].mappedModuleIds = [
                ...existingMappings,
                moduleId,
              ];
            }
          }
        }
      }

      await course.save();
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Generated ${allGeneratedQuestions.length} code questions and mapped to ${Object.keys(questionsByModule).length} modules`,
      data: {
        totalQuestions: allGeneratedQuestions.length,
        questionsByModule,
        autoInserted: autoInsert,
      },
    });
  } catch (error) {
    console.error('Error generating code questions:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate code questions' },
      { status: 500 }
    );
  }
}

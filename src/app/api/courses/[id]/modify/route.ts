import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import { ApiResponse, ContentBlock } from '@/types';
import { modifyCourseContentWithPrompt } from '@/lib/ai/anthropic';

// POST /api/courses/[id]/modify - Modify course content using AI prompt
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
    const { prompt, applyImmediately = false } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Modification prompt is required' },
        { status: 400 }
      );
    }

    // Build current course structure for AI
    const currentContent = {
      title: course.title,
      description: course.description,
      chapters: (course.chapters as any[]).map((chapter) => ({
        id: chapter._id.toString(),
        title: chapter.title,
        order: chapter.order,
        modules: (chapter.modules as any[]).map((module) => ({
          id: module._id.toString(),
          title: module.title,
          content: module.content?.substring(0, 500),
          contentBlocks: (module.contentBlocks || []).map((block: ContentBlock) => ({
            id: block.id,
            type: block.type,
            interactionType: block.interaction?.type,
          })),
          order: module.order,
          estimatedTime: module.estimatedTime,
        })),
      })),
    };

    // Get AI modifications
    const modifications = await modifyCourseContentWithPrompt(
      currentContent,
      prompt,
      course.teacherInstructions || {}
    );

    // If applyImmediately is true, apply the modifications
    if (applyImmediately) {
      for (const mod of modifications.modifications) {
        try {
          if (mod.type === 'add') {
            if (mod.target === 'interaction' && mod.targetId) {
              // Add interaction to a module
              const module = await Module.findById(mod.targetId);
              if (module) {
                const contentBlocks: ContentBlock[] = (module as any).contentBlocks || [];
                if (mod.changes.contentBlock) {
                  contentBlocks.push({
                    ...mod.changes.contentBlock,
                    order: contentBlocks.length + 1,
                  });
                }
                (module as any).contentBlocks = contentBlocks;
                (module as any).isInteractive = true;
                await module.save();
              }
            } else if (mod.target === 'module' && mod.targetId) {
              // Add module to a chapter
              const chapter = await Chapter.findById(mod.targetId);
              if (chapter && mod.changes.module) {
                const newModule = await Module.create({
                  chapterId: mod.targetId,
                  title: mod.changes.module.title,
                  content: mod.changes.module.content || '',
                  contentBlocks: mod.changes.module.contentBlocks || [],
                  isInteractive: true,
                  contentType: 'interactive',
                  order: (chapter.modules as any[])?.length || 0,
                  estimatedTime: mod.changes.module.estimatedTime || 15,
                });
                chapter.modules = [...(chapter.modules as any[]), newModule._id];
                await chapter.save();
              }
            } else if (mod.target === 'chapter') {
              // Add chapter to course
              if (mod.changes.chapter) {
                const newChapter = await Chapter.create({
                  courseId: id,
                  title: mod.changes.chapter.title,
                  order: (course.chapters as any[])?.length || 0,
                });
                course.chapters = [...(course.chapters as any[]), newChapter._id];
                await course.save();
              }
            }
          } else if (mod.type === 'modify' && mod.targetId) {
            if (mod.target === 'module') {
              const module = await Module.findById(mod.targetId);
              if (module && mod.changes) {
                if (mod.changes.title) (module as any).title = mod.changes.title;
                if (mod.changes.content) (module as any).content = mod.changes.content;
                if (mod.changes.contentBlocks) {
                  (module as any).contentBlocks = mod.changes.contentBlocks;
                }
                await module.save();
              }
            } else if (mod.target === 'chapter') {
              const chapter = await Chapter.findById(mod.targetId);
              if (chapter && mod.changes) {
                if (mod.changes.title) (chapter as any).title = mod.changes.title;
                await chapter.save();
              }
            } else if (mod.target === 'interaction') {
              // Modify a specific interaction within a module
              // mod.targetId should be moduleId:blockId
              const [moduleId, blockId] = mod.targetId.split(':');
              const module = await Module.findById(moduleId);
              if (module) {
                const contentBlocks: ContentBlock[] = (module as any).contentBlocks || [];
                const blockIndex = contentBlocks.findIndex(b => b.id === blockId);
                if (blockIndex !== -1 && mod.changes) {
                  contentBlocks[blockIndex] = {
                    ...contentBlocks[blockIndex],
                    ...mod.changes,
                  };
                  (module as any).contentBlocks = contentBlocks;
                  await module.save();
                }
              }
            }
          } else if (mod.type === 'remove' && mod.targetId) {
            if (mod.target === 'module') {
              await Module.findByIdAndDelete(mod.targetId);
              // Remove from chapter
              for (const chapter of course.chapters as any[]) {
                const chapterDoc = await Chapter.findById(chapter._id || chapter);
                if (chapterDoc) {
                  chapterDoc.modules = (chapterDoc.modules as any[]).filter(
                    (m: any) => m.toString() !== mod.targetId
                  );
                  await chapterDoc.save();
                }
              }
            } else if (mod.target === 'chapter') {
              // Remove all modules in chapter first
              const chapter = await Chapter.findById(mod.targetId);
              if (chapter) {
                for (const moduleId of chapter.modules as any[]) {
                  await Module.findByIdAndDelete(moduleId);
                }
                await Chapter.findByIdAndDelete(mod.targetId);
                course.chapters = (course.chapters as any[]).filter(
                  (c: any) => (c._id || c).toString() !== mod.targetId
                );
                await course.save();
              }
            } else if (mod.target === 'interaction') {
              // Remove interaction from module
              const [moduleId, blockId] = mod.targetId.split(':');
              const module = await Module.findById(moduleId);
              if (module) {
                const contentBlocks: ContentBlock[] = (module as any).contentBlocks || [];
                (module as any).contentBlocks = contentBlocks.filter(b => b.id !== blockId);
                await module.save();
              }
            }
          }
        } catch (modError) {
          console.error(`Error applying modification:`, mod, modError);
          // Continue with other modifications
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: applyImmediately
        ? `Applied ${modifications.modifications.length} modifications`
        : 'Modifications generated successfully',
      data: {
        modifications: modifications.modifications,
        summary: modifications.summary,
        applied: applyImmediately,
      },
    });
  } catch (error) {
    console.error('Error modifying course content:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to modify course content' },
      { status: 500 }
    );
  }
}

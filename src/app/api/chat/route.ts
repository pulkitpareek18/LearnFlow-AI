import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Module from '@/lib/db/models/Module';
import AIConversation from '@/lib/db/models/AIConversation';
import { chatWithTutor } from '@/lib/ai/anthropic';
import { ApiResponse } from '@/types';

// POST /api/chat - Send a message to AI tutor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { moduleId, message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    await connectDB();

    let moduleContext = '';

    // If moduleId is provided, get module content for context
    if (moduleId) {
      const module = await Module.findById(moduleId).lean();
      if (module) {
        const aiContent = module.aiGeneratedContent as { keyPoints?: string[]; examples?: string[] } | undefined;
        moduleContext = `
Module: ${module.title}

Content:
${module.content}

${aiContent?.keyPoints && aiContent.keyPoints.length > 0
  ? `Key Points:\n${aiContent.keyPoints.map((p: string) => `- ${p}`).join('\n')}`
  : ''}

${aiContent?.examples && aiContent.examples.length > 0
  ? `Examples:\n${aiContent.examples.map((e: string) => `- ${e}`).join('\n')}`
  : ''}
        `.trim();
      }
    }

    // If no module context, use general tutor context
    if (!moduleContext) {
      moduleContext = `You are a helpful AI learning assistant for LearnFlow, an educational platform.
Help students with their learning questions, explain concepts clearly, provide examples,
and encourage them in their learning journey. Be friendly, patient, and supportive.`;
    }

    // Get AI response
    const response = await chatWithTutor(history, moduleContext, message);

    // Save conversation to database (only if moduleId is provided)
    if (moduleId) {
      let conversation = await AIConversation.findOne({
        studentId: session.user.id,
        moduleId,
      });

      if (conversation) {
        conversation.messages.push(
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() }
        );
        await conversation.save();
      } else {
        await AIConversation.create({
          studentId: session.user.id,
          moduleId,
          messages: [
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() },
          ],
          context: moduleContext,
        });
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { response },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to get response' },
      { status: 500 }
    );
  }
}

// GET /api/chat?moduleId=xxx - Get chat history for a module
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Module ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const conversation = await AIConversation.findOne({
      studentId: session.user.id,
      moduleId,
    }).lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: conversation?.messages || [],
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

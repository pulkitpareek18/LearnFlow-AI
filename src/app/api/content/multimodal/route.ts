import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { generateMultiModalContent } from '@/lib/ai/anthropic';
import connectDB from '@/lib/db/mongoose';
import Module from '@/lib/db/models/Module';
import { ContentFormat, MultiModalContent } from '@/types';

// GET: Fetch multi-modal content for a module/concept
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const conceptKey = searchParams.get('conceptKey');
    const preferredFormat = searchParams.get('format') as ContentFormat | null;

    if (!moduleId || !conceptKey) {
      return NextResponse.json(
        { success: false, error: 'Module ID and concept key are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch module to get content
    const module = await Module.findById(moduleId);
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check if multi-modal content exists in the module
    const existingContent = module.multiModalContent?.find(
      (mmc: any) => mmc.conceptKey === conceptKey
    );

    if (existingContent) {
      // Return existing multi-modal content
      let content = existingContent;

      // Map ContentFormat to property names
      const formatToProperty: Record<ContentFormat, keyof typeof existingContent.formats> = {
        text: 'text',
        visual: 'visual',
        audio_description: 'audioDescription',
        interactive: 'interactive',
      };

      // If a specific format is requested, filter to that format
      const propName = preferredFormat ? formatToProperty[preferredFormat] : null;
      if (propName && existingContent.formats[propName]) {
        content = {
          ...existingContent,
          formats: {
            [propName]: existingContent.formats[propName],
          },
        };
      }

      return NextResponse.json({
        success: true,
        data: {
          content,
          cached: true,
        },
      });
    }

    // If no existing content, return indication to generate
    return NextResponse.json({
      success: true,
      data: {
        content: null,
        cached: false,
        message: 'No multi-modal content available. Use POST to generate.',
      },
    });
  } catch (error) {
    console.error('Error fetching multi-modal content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch multi-modal content' },
      { status: 500 }
    );
  }
}

// POST: Generate multi-modal versions of content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      moduleId,
      conceptKey,
      originalContent,
      targetFormats,
    }: {
      moduleId: string;
      conceptKey: string;
      originalContent: string;
      targetFormats: ContentFormat[];
    } = body;

    if (!moduleId || !conceptKey || !originalContent || !targetFormats?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID, concept key, original content, and target formats are required',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch module
    const module = await Module.findById(moduleId);
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Generate multi-modal content using AI
    const multiModalContent = await generateMultiModalContent(
      originalContent,
      conceptKey,
      targetFormats
    );

    // Update module ID in the generated content
    multiModalContent.moduleId = moduleId;

    // Store the multi-modal content in the module
    if (!module.multiModalContent) {
      module.multiModalContent = [];
    }

    // Check if content for this concept already exists
    const existingIndex = module.multiModalContent.findIndex(
      (mmc: any) => mmc.conceptKey === conceptKey
    );

    if (existingIndex >= 0) {
      // Update existing content
      module.multiModalContent[existingIndex] = multiModalContent;
    } else {
      // Add new content
      module.multiModalContent.push(multiModalContent);
    }

    await module.save();

    return NextResponse.json({
      success: true,
      data: {
        content: multiModalContent,
        generated: true,
      },
      message: 'Multi-modal content generated successfully',
    });
  } catch (error) {
    console.error('Error generating multi-modal content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate multi-modal content' },
      { status: 500 }
    );
  }
}

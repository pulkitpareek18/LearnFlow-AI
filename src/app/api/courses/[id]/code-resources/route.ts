import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import { ApiResponse, CodeResource, ProgrammingLanguage } from '@/types';
import {
  generateCodeQuestionsFromContent,
  mapCodeQuestionsToModules,
} from '@/lib/ai/anthropic';

// Helper function to detect programming language from file extension
function detectLanguage(fileName: string): ProgrammingLanguage {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, ProgrammingLanguage> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    h: 'c',
    go: 'go',
    rs: 'rust',
    html: 'html',
    htm: 'html',
    css: 'css',
    sql: 'sql',
  };
  return languageMap[ext || ''] || 'javascript';
}

// Helper function to fetch content from GitHub URL
async function fetchGitHubContent(url: string): Promise<{ content: string; fileName: string; language: ProgrammingLanguage }> {
  // Convert GitHub URL to raw content URL
  let rawUrl = url;

  // Handle different GitHub URL formats
  if (url.includes('github.com')) {
    // Convert https://github.com/user/repo/blob/branch/path to raw URL
    rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
  }

  try {
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const content = await response.text();
    const fileName = url.split('/').pop() || 'file';
    const language = detectLanguage(fileName);

    return { content, fileName, language };
  } catch (error) {
    console.error('Error fetching GitHub content:', error);
    throw new Error('Failed to fetch content from GitHub URL');
  }
}

// POST /api/courses/[id]/code-resources - Add code resource to course
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

    const body = await req.json();
    const { type, url, fileName, content, language, description } = body;

    let codeResource: CodeResource;

    if (type === 'github_file' || type === 'github_repo') {
      if (!url) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'GitHub URL is required' },
          { status: 400 }
        );
      }

      // Fetch content from GitHub
      const githubContent = await fetchGitHubContent(url);

      codeResource = {
        id: `code_${Date.now()}`,
        type,
        url,
        fileName: githubContent.fileName,
        content: githubContent.content,
        language: githubContent.language,
        description: description || `Code from ${githubContent.fileName}`,
      };
    } else if (type === 'uploaded_file') {
      if (!content || !fileName) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Content and filename are required for uploaded files' },
          { status: 400 }
        );
      }

      codeResource = {
        id: `code_${Date.now()}`,
        type,
        fileName,
        content,
        language: language || detectLanguage(fileName),
        description: description || `Uploaded file: ${fileName}`,
      };
    } else {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    // Add to course code resources
    course.codeResources = course.codeResources || [];
    course.codeResources.push(codeResource);
    await course.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Code resource added successfully',
      data: codeResource,
    });
  } catch (error) {
    console.error('Error adding code resource:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add code resource' },
      { status: 500 }
    );
  }
}

// GET /api/courses/[id]/code-resources - Get all code resources
export async function GET(
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

    return NextResponse.json<ApiResponse>({
      success: true,
      data: course.codeResources || [],
    });
  } catch (error) {
    console.error('Error fetching code resources:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch code resources' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/code-resources - Remove a code resource
export async function DELETE(
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

    if (course.teacherId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { resourceId } = await req.json();
    if (!resourceId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    course.codeResources = (course.codeResources || []).filter(
      (r: CodeResource) => r.id !== resourceId
    );
    await course.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Code resource removed successfully',
    });
  } catch (error) {
    console.error('Error removing code resource:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to remove code resource' },
      { status: 500 }
    );
  }
}

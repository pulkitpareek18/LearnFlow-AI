import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import { ApiResponse } from '@/types';

// GET /api/courses - Get all courses (filtered by role or public)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const published = searchParams.get('published') === 'true';

    const skip = (page - 1) * limit;

    let query: Record<string, unknown> = {};

    // Public access for published courses
    if (published) {
      query.isPublished = true;
    } else if (!session?.user) {
      // No session and not requesting public courses
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      // Teachers see their own courses, students see published courses
      if (session.user.role === 'teacher') {
        query.teacherId = session.user.id;
      } else {
        query.isPublished = true;
      }
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('teacherId', 'name email')
        .lean(),
      Course.countDocuments(query),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: published ? courses : {
        courses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'teacher') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only teachers can create courses' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, thumbnail, pdfUrl, rawContent } = body;

    if (!title || !description) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.create({
      teacherId: session.user.id,
      title,
      description,
      thumbnail: thumbnail || '',
      pdfUrl: pdfUrl || '',
      rawContent: rawContent || '',
      isPublished: false,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Course created successfully',
        data: course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

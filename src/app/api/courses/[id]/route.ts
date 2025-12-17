import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import { ApiResponse } from '@/types';

// GET /api/courses/[id] - Get a single course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    await connectDB();

    const course = await Course.findById(id)
      .populate('teacherId', 'name email avatar')
      .populate({
        path: 'chapters',
        populate: {
          path: 'modules',
          model: 'Module',
        },
      })
      .lean();

    if (!course) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check access rights
    const teacherId = (course.teacherId as { _id?: { toString(): string } })?._id?.toString()
      || (course.teacherId as { toString(): string })?.toString();
    const isTeacher = session?.user?.id === teacherId;
    const isPublished = course.isPublished;

    if (!isTeacher && !isPublished) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a course
export async function PUT(
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
        { success: false, error: 'Not authorized to update this course' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, thumbnail, isPublished, rawContent, pdfUrl } = body;

    // Update fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (isPublished !== undefined) course.isPublished = isPublished;
    if (rawContent !== undefined) course.rawContent = rawContent;
    if (pdfUrl !== undefined) course.pdfUrl = pdfUrl;

    await course.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete a course
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

    // Check if user is the course owner
    if (course.teacherId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authorized to delete this course' },
        { status: 403 }
      );
    }

    // Delete associated chapters and modules
    const chapters = await Chapter.find({ courseId: id });
    for (const chapter of chapters) {
      await Module.deleteMany({ chapterId: chapter._id });
    }
    await Chapter.deleteMany({ courseId: id });
    await Course.findByIdAndDelete(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

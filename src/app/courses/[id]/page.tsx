'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle,
  Play,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';
import Navbar from '@/components/layouts/Navbar';

interface Module {
  _id: string;
  title: string;
  estimatedTime: number;
  order: number;
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  modules: Module[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  teacherId: {
    _id: string;
    name: string;
    email: string;
  };
  chapters: Chapter[];
  createdAt: string;
}

export default function PublicCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourse();
    if (session?.user) {
      checkEnrollment();
    }
  }, [courseId, session]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch course');
      }

      setCourse(result.data);
      // Expand first chapter by default
      if (result.data.chapters?.length > 0) {
        setExpandedChapters(new Set([result.data.chapters[0]._id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await fetch(`/api/enrollments?courseId=${courseId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setIsEnrolled(true);
      }
    } catch (err) {
      console.error('Failed to check enrollment:', err);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    setIsEnrolling(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEnrolled(true);
        router.push(`/student/learn/${courseId}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  const getTotalModules = () => {
    return course?.chapters?.reduce((acc, chapter) => acc + (chapter.modules?.length || 0), 0) || 0;
  };

  const getTotalTime = () => {
    let total = 0;
    course?.chapters?.forEach((chapter) => {
      chapter.modules?.forEach((module) => {
        total += module.estimatedTime || 0;
      });
    });
    return total;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="p-6 rounded-lg bg-error/10 border border-error text-error">
            {error || 'Course not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>

        {/* Course Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {course.title}
            </h1>
            <p className="text-lg text-muted mb-6">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>Created by {course.teacherId?.name || 'Teacher'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{course.chapters?.length || 0} chapters</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>{getTotalModules()} modules</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{getTotalTime()} minutes</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card variant="bordered" className="sticky top-24">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-primary/50" />
              </div>
              <CardContent className="p-6">
                {isEnrolled ? (
                  <Link href={`/student/learn/${courseId}`}>
                    <Button className="w-full" size="lg">
                      <Play className="w-5 h-5 mr-2" />
                      Continue Learning
                    </Button>
                  </Link>
                ) : session?.user?.role === 'teacher' &&
                  session.user.id === course.teacherId?._id ? (
                  <Link href={`/teacher/courses/${courseId}`}>
                    <Button className="w-full" size="lg" variant="outline">
                      Manage Course
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnroll}
                    isLoading={isEnrolling}
                  >
                    {session?.user ? 'Enroll Now' : 'Login to Enroll'}
                  </Button>
                )}

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>AI-powered personalized learning</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>24/7 AI tutor assistance</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Interactive assessments</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Progress tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
          </CardHeader>
          <CardContent>
            {course.chapters && course.chapters.length > 0 ? (
              <div className="space-y-4">
                {course.chapters
                  .sort((a, b) => a.order - b.order)
                  .map((chapter) => (
                    <div
                      key={chapter._id}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleChapter(chapter._id)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedChapters.has(chapter._id) ? (
                            <ChevronDown className="w-5 h-5 text-muted" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted" />
                          )}
                          <span className="font-medium text-foreground">
                            Chapter {chapter.order}: {chapter.title}
                          </span>
                        </div>
                        <span className="text-sm text-muted">
                          {chapter.modules?.length || 0} modules
                        </span>
                      </button>

                      {expandedChapters.has(chapter._id) && chapter.modules && (
                        <div className="border-t border-border">
                          {chapter.modules
                            .sort((a, b) => a.order - b.order)
                            .map((module) => (
                              <div
                                key={module._id}
                                className="px-4 py-3 pl-12 flex items-center justify-between border-b border-border last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-muted" />
                                  <span className="text-foreground">{module.title}</span>
                                </div>
                                <span className="text-sm text-muted">
                                  {module.estimatedTime} min
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">
                Course content is being prepared...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

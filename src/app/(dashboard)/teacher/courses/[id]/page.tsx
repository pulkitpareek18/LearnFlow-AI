'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  X,
  Lightbulb,
  List,
  Wand2,
  Code2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
  Modal,
} from '@/components/ui';

interface AIContent {
  summary?: string;
  keyPoints?: string[];
  examples?: string[];
}

interface Module {
  _id: string;
  title: string;
  content: string;
  contentType: string;
  order: number;
  estimatedTime: number;
  aiGeneratedContent?: AIContent;
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
  pdfUrl?: string;
  isPublished: boolean;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedChapterTitle, setSelectedChapterTitle] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

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

  const handlePublishToggle = async () => {
    if (!course) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });

      const result = await response.json();
      if (result.success) {
        setCourse({ ...course, isPublished: !course.isPublished });
      }
    } catch (err) {
      console.error('Failed to update publish status:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        router.push('/teacher/courses');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
      setIsDeleting(false);
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

  const openModulePreview = (module: Module, chapterTitle: string) => {
    setSelectedModule(module);
    setSelectedChapterTitle(chapterTitle);
  };

  const closeModulePreview = () => {
    setSelectedModule(null);
    setSelectedChapterTitle('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-6 rounded-lg bg-error/10 border border-error text-error">
          {error}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-6 rounded-lg bg-muted text-center">
          Course not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.isPublished
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-muted">{course.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handlePublishToggle}
              isLoading={isPublishing}
            >
              {course.isPublished ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
            <Link href={`/teacher/courses/${courseId}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Link href={`/teacher/courses/${courseId}/modify`}>
              <Button variant="outline">
                <Wand2 className="w-4 h-4 mr-2" />
                AI Modify
              </Button>
            </Link>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {course.chapters?.length || 0}
            </div>
            <div className="text-sm text-muted">Chapters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {getTotalModules()}
            </div>
            <div className="text-sm text-muted">Modules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {getTotalTime()}
            </div>
            <div className="text-sm text-muted">Minutes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted">Students</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-lg bg-info/10 border border-info/30 text-info flex items-start gap-3">
        <Eye className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <strong>Preview Mode:</strong> Click on any module below to preview the content that students will see. This helps you review the AI-generated content before publishing.
        </div>
      </div>

      {/* Course Content */}
      <Card variant="bordered">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Course Content</CardTitle>
          {course.pdfUrl && !course.chapters?.length && (
            <Link href={`/teacher/courses/new?regenerate=${courseId}`}>
              <Button size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </Button>
            </Link>
          )}
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
                            <button
                              key={module._id}
                              onClick={() => openModulePreview(module, chapter.title)}
                              className="w-full px-4 py-3 pl-12 flex items-center justify-between border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-foreground">{module.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted">
                                  {module.estimatedTime} min
                                </span>
                                <Eye className="w-4 h-4 text-muted" />
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No content yet
              </h3>
              <p className="text-muted mb-6">
                {course.pdfUrl
                  ? 'Generate course content from your uploaded PDF'
                  : 'Upload a PDF to generate course content with AI'}
              </p>
              <Link href={`/teacher/courses/new?course=${courseId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {course.pdfUrl ? 'Generate Content' : 'Upload PDF'}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Preview Modal */}
      <Modal
        isOpen={!!selectedModule}
        onClose={closeModulePreview}
        title={selectedModule?.title || ''}
        size="lg"
      >
        {selectedModule && (
          <div className="space-y-6">
            {/* Module Header */}
            <div className="flex items-center gap-2 text-sm text-muted">
              <BookOpen className="w-4 h-4" />
              <span>{selectedChapterTitle}</span>
              <span>•</span>
              <Clock className="w-4 h-4" />
              <span>{selectedModule.estimatedTime} min</span>
            </div>

            {/* Main Content */}
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-foreground mb-3">Content</h3>
              <div className="text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                {selectedModule.content || 'No content available'}
              </div>
            </div>

            {/* Key Points */}
            {selectedModule.aiGeneratedContent?.keyPoints &&
             selectedModule.aiGeneratedContent.keyPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" />
                  Key Points
                </h3>
                <ul className="space-y-2">
                  {selectedModule.aiGeneratedContent.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples */}
            {selectedModule.aiGeneratedContent?.examples &&
             selectedModule.aiGeneratedContent.examples.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Examples
                </h3>
                <div className="space-y-3">
                  {selectedModule.aiGeneratedContent.examples.map((example, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-foreground"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student View Preview Note */}
            <div className="p-4 rounded-lg bg-info/10 border border-info/30 text-sm">
              <strong className="text-info">Student View:</strong>
              <span className="text-muted ml-2">
                Students will see this content along with an AI tutor chat to ask questions about the material.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

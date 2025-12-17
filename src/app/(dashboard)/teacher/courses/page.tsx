'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Globe,
  Lock,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardSkeleton,
} from '@/components/ui';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  isPublished: boolean;
  enrolledStudents: string[];
  chapters: string[];
  createdAt: string;
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const result = await response.json();
      if (result.success) {
        setCourses(result.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setCourses(courses.filter((c) => c._id !== courseId));
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
    setActiveMenu(null);
  };

  const handlePublishToggle = async (course: Course) => {
    try {
      const response = await fetch(`/api/courses/${course._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      const result = await response.json();
      if (result.success) {
        setCourses(
          courses.map((c) =>
            c._id === course._id ? { ...c, isPublished: !c.isPublished } : c
          )
        );
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
    setActiveMenu(null);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted mt-1">
            Manage and create your courses
          </p>
        </div>
        <Link href="/teacher/courses/new">
          <Button leftIcon={<Plus className="w-5 h-5" />}>
            Create Course
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card variant="bordered" className="text-center py-16">
          <CardContent>
            <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="text-muted mb-4">
              {search
                ? 'Try adjusting your search terms'
                : 'Create your first course by uploading a PDF'}
            </p>
            {!search && (
              <Link href="/teacher/courses/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id} variant="bordered" padding="none" className="group">
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden rounded-t-lg">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary/50" />
                  </div>
                )}
                {/* Status Badge */}
                <div
                  className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    course.isPublished
                      ? 'bg-success text-white'
                      : 'bg-muted text-white'
                  }`}
                >
                  {course.isPublished ? (
                    <>
                      <Globe className="w-3 h-3" /> Published
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Draft
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-muted mb-3 line-clamp-2">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.enrolledStudents?.length || 0} students
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.chapters?.length || 0} chapters
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Link href={`/teacher/courses/${course._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>

                  <div className="relative" ref={activeMenu === course._id ? menuRef : null}>
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === course._id ? null : course._id)
                      }
                      className="p-2 rounded-lg hover:bg-border transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-muted" />
                    </button>

                    {activeMenu === course._id && (
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                        <Link
                          href={`/teacher/courses/${course._id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Course
                        </Link>
                        <button
                          onClick={() => handlePublishToggle(course)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border transition-colors w-full text-left"
                        >
                          {course.isPublished ? (
                            <>
                              <Lock className="w-4 h-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4" />
                              Publish
                            </>
                          )}
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => handleDelete(course._id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors w-full text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

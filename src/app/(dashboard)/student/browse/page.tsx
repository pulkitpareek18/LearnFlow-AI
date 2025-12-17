'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Users,
  Clock,
  Star,
  CheckCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardSkeleton,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  teacherId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  enrolledStudents: string[];
  chapters: string[];
  createdAt: string;
}

interface Enrollment {
  courseId: {
    _id: string;
  };
}

export default function BrowseCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []);

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

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments');
      const result = await response.json();
      if (result.success) {
        const ids = new Set<string>(result.data.map((e: Enrollment) => e.courseId._id));
        setEnrolledCourseIds(ids);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();

      if (result.success) {
        setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
        addToast('success', 'Successfully enrolled in course!');
      } else {
        addToast('error', result.error || 'Failed to enroll');
      }
    } catch {
      addToast('error', 'Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.teacherId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Browse Courses</h1>
        <p className="text-muted mt-1">
          Discover courses and start learning
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search courses by title, description, or teacher..."
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
              {search ? 'No courses found' : 'No courses available'}
            </h3>
            <p className="text-muted">
              {search
                ? 'Try adjusting your search terms'
                : 'Check back later for new courses'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);

            return (
              <Card key={course._id} variant="bordered" padding="none" className="overflow-hidden">
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
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
                  {isEnrolled && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-success text-white flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Enrolled
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Teacher */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                      {course.teacherId?.name?.charAt(0) || 'T'}
                    </div>
                    <span className="text-sm text-muted">
                      {course.teacherId?.name || 'Unknown Teacher'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrolledStudents?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.chapters?.length || 0} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      4.5
                    </span>
                  </div>

                  {/* Action */}
                  {isEnrolled ? (
                    <Link href={`/student/learn/${course._id}`}>
                      <Button className="w-full">Continue Learning</Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleEnroll(course._id)}
                      isLoading={enrollingId === course._id}
                    >
                      Enroll Now
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

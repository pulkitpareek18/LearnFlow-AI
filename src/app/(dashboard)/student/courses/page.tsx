'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Trophy,
  ArrowRight,
  Search,
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
  teacherId: {
    name: string;
  };
  chapters: any[];
}

interface Enrollment {
  _id: string;
  courseId: Course;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  completedModules: number;
  totalModules: number;
  totalEstimatedTime: number;
  estimatedTimeRemaining: number;
  lastAccessedAt?: string;
}

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments');
      const result = await response.json();
      if (result.success) {
        setEnrollments(result.data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    // Skip enrollments where the course has been deleted
    if (!enrollment.courseId) return false;

    const matchesSearch =
      enrollment.courseId.title?.toLowerCase().includes(search.toLowerCase()) ||
      enrollment.courseId.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || enrollment.status === filter;
    return matchesSearch && matchesFilter;
  });

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted mt-1">
          Continue learning where you left off
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search your courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <Card variant="bordered" className="text-center py-16">
          <CardContent>
            <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search || filter !== 'all' ? 'No courses found' : 'No enrolled courses'}
            </h3>
            <p className="text-muted mb-4">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Browse available courses and start learning'}
            </p>
            {!search && filter === 'all' && (
              <Link href="/student/browse">
                <Button>Browse Courses</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => {
            const course = enrollment.courseId;
            const progress = enrollment.progress || 0;
            const isCompleted = progress >= 100 || enrollment.status === 'completed';

            return (
              <Card key={enrollment._id} variant="bordered" padding="none" className="overflow-hidden">
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
                  {isCompleted && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-success text-white flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted mb-3">
                    By {course.teacherId?.name || 'Unknown'}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted">Progress</span>
                      <span className="font-medium text-foreground">
                        {enrollment.completedModules}/{enrollment.totalModules} modules ({progress}%)
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.chapters?.length || 0} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {enrollment.estimatedTimeRemaining > 0
                        ? `~${formatTime(enrollment.estimatedTimeRemaining)} left`
                        : 'Complete'}
                    </span>
                  </div>

                  {/* Action */}
                  <Link href={`/student/learn/${course._id}`}>
                    <Button className="w-full">
                      {isCompleted ? 'Review' : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

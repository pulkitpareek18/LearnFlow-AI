'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Users,
  TrendingUp,
  ArrowLeft,
  Eye,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface CourseAnalytics {
  _id: string;
  title: string;
  isPublished: boolean;
  enrollmentCount: number;
  chaptersCount: number;
  avgProgress: number;
}

interface AnalyticsData {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  courses: CourseAnalytics[];
}

export default function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/teacher/analytics');
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted mt-1">
          Track performance and engagement across your courses
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Courses</p>
              <p className="text-2xl font-bold text-foreground">
                {analytics?.totalCourses || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-success/10">
              <Eye className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Published</p>
              <p className="text-2xl font-bold text-foreground">
                {analytics?.publishedCourses || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted">Students</p>
              <p className="text-2xl font-bold text-foreground">
                {analytics?.totalStudents || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-warning/10">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted">Enrollments</p>
              <p className="text-2xl font-bold text-foreground">
                {analytics?.totalEnrollments || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Course Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.courses && analytics.courses.length > 0 ? (
            <div className="space-y-4">
              {analytics.courses.map((course) => (
                <div
                  key={course._id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/teacher/courses/${course._id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {course.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {course.chaptersCount} chapters
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.enrollmentCount} students
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.isPublished
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Average Progress</span>
                      <span className="font-medium text-foreground">
                        {course.avgProgress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${course.avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No analytics data yet
              </h3>
              <p className="text-muted">
                Create and publish courses to see analytics
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tips to Improve Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                Break content into smaller modules (10-15 minutes each) for better completion rates
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                Add practical examples and exercises to reinforce learning
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                Encourage students to use the AI tutor for clarifications
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                Update course content regularly based on student feedback
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

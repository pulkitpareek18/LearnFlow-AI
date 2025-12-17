'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  BarChart3,
  Plus,
  TrendingUp,
  Clock,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui';

interface Course {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  chapters: { _id: string }[];
  createdAt: string;
}

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  publishedCourses: number;
  totalChapters: number;
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    publishedCourses: 0,
    totalChapters: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      const coursesData = await coursesRes.json();

      if (coursesData.success) {
        const coursesList = coursesData.data.courses || [];
        setCourses(coursesList);

        // Calculate stats
        const totalChapters = coursesList.reduce(
          (acc: number, course: Course) => acc + (course.chapters?.length || 0),
          0
        );

        setStats({
          totalCourses: coursesList.length,
          totalStudents: 0, // Will be fetched from enrollments
          publishedCourses: coursesList.filter((c: Course) => c.isPublished).length,
          totalChapters,
        });
      }

      // Fetch enrollment count
      const enrollmentsRes = await fetch('/api/teacher/stats');
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        if (enrollmentsData.success) {
          setStats(prev => ({
            ...prev,
            totalStudents: enrollmentsData.data.totalStudents || 0,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Published Courses',
      value: stats.publishedCourses.toString(),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Chapters',
      value: stats.totalChapters.toString(),
      icon: FileText,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted mt-1">
            Manage your courses and track student progress
          </p>
        </div>
        <Link href="/teacher/courses/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <Card key={stat.title} variant="bordered">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Courses */}
            <div className="lg:col-span-2">
              <Card variant="bordered">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Courses</CardTitle>
                  <Link
                    href="/teacher/courses"
                    className="text-sm text-primary hover:underline"
                  >
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  {courses.length > 0 ? (
                    <div className="space-y-4">
                      {courses.slice(0, 5).map((course) => (
                        <Link
                          key={course._id}
                          href={`/teacher/courses/${course._id}`}
                          className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground">
                                  {course.title}
                                </h3>
                                {course.isPublished ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">
                                    <Eye className="w-3 h-3" />
                                    Published
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning">
                                    <EyeOff className="w-3 h-3" />
                                    Draft
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted line-clamp-1">
                                {course.description}
                              </p>
                              <p className="text-xs text-muted mt-2">
                                {course.chapters?.length || 0} chapters
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No courses yet
                      </h3>
                      <p className="text-muted mb-4">
                        Create your first course by uploading a PDF
                      </p>
                      <Link href="/teacher/courses/new">
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Course
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/teacher/courses/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Course
                    </Button>
                  </Link>
                  <Link href="/teacher/students" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      View Students
                    </Button>
                  </Link>
                  <Link href="/teacher/analytics" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card variant="bordered">
                <CardHeader>
                  <CardTitle>Course Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Published</span>
                        <span className="font-medium text-foreground">
                          {stats.publishedCourses}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Draft</span>
                        <span className="font-medium text-foreground">
                          {stats.totalCourses - stats.publishedCourses}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Total Chapters</span>
                        <span className="font-medium text-foreground">
                          {stats.totalChapters}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted mx-auto mb-3" />
                      <p className="text-sm text-muted">No courses created yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

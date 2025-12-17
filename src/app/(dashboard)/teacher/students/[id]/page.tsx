'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  BookOpen,
  Trophy,
  Flame,
  Target,
  BarChart3,
  Clock,
  Zap,
  Award,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  completedModules: number;
  totalXP: number;
  level: number;
  currentStreak: number;
  badges: string[];
  assessments: {
    completed: number;
    total: number;
    averageScore: number;
  };
  learningMetrics: {
    totalTimeSpent: number;
    averageScore: number;
    completionRate: number;
  };
  recentActivity?: string;
}

interface StudentData {
  student: {
    _id: string;
    name: string;
    email: string;
    joinedAt: string;
  };
  overallStats: {
    totalCourses: number;
    totalXP: number;
    totalModulesCompleted: number;
    averageScore: number;
    maxStreak: number;
  };
  courseProgress: CourseProgress[];
}

export default function TeacherStudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      const response = await fetch(`/api/teacher/students/${studentId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error);
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Student not found
        </h2>
        <p className="text-muted mb-4">
          This student is not enrolled in any of your courses.
        </p>
        <Link href="/teacher/students">
          <Button>Back to Students</Button>
        </Link>
      </div>
    );
  }

  const { student, overallStats, courseProgress } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
            <p className="text-muted flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {student.email}
            </p>
            <p className="text-sm text-muted flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              Joined {new Date(student.joinedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card variant="bordered">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overallStats.totalCourses}
            </p>
            <p className="text-xs text-muted">Courses Enrolled</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-warning/10 w-fit mx-auto mb-2">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overallStats.totalXP.toLocaleString()}
            </p>
            <p className="text-xs text-muted">Total XP</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-success/10 w-fit mx-auto mb-2">
              <Trophy className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overallStats.totalModulesCompleted}
            </p>
            <p className="text-xs text-muted">Modules Completed</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-secondary/10 w-fit mx-auto mb-2">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overallStats.averageScore}%
            </p>
            <p className="text-xs text-muted">Average Score</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-error/10 w-fit mx-auto mb-2">
              <Flame className="w-5 h-5 text-error" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overallStats.maxStreak}
            </p>
            <p className="text-xs text-muted">Best Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {courseProgress.map((course) => (
              <div
                key={course.courseId}
                className="p-4 rounded-lg border border-border"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {course.courseTitle}
                    </h3>
                    <p className="text-sm text-muted">
                      Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/teacher/courses/${course.courseId}`}>
                    <Button variant="outline" size="sm">
                      View Course
                    </Button>
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-muted mb-1">Modules Done</p>
                    <p className="font-semibold text-foreground">
                      {course.completedModules}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-muted mb-1">XP Earned</p>
                    <p className="font-semibold text-foreground">
                      {course.totalXP.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-muted mb-1">Assessments</p>
                    <p className="font-semibold text-foreground">
                      {course.assessments.completed}/{course.assessments.total}
                      {course.assessments.averageScore > 0 && (
                        <span className="text-sm text-muted ml-1">
                          ({course.assessments.averageScore}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-muted mb-1">Current Streak</p>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Flame className="w-4 h-4 text-warning" />
                      {course.currentStreak} days
                    </p>
                  </div>
                </div>

                {course.badges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted mb-2 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Badges Earned ({course.badges.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {course.badges.slice(0, 5).map((badge, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-warning/10 text-warning"
                        >
                          {badge}
                        </span>
                      ))}
                      {course.badges.length > 5 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-muted/10 text-muted">
                          +{course.badges.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {course.recentActivity && (
                  <p className="text-xs text-muted mt-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last active:{' '}
                    {new Date(course.recentActivity).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

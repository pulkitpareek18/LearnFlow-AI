'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  BookOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface Assessment {
  _id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  chapterId?: string;
  chapterTitle?: string;
  type: 'quiz' | 'final' | 'assignment';
  status: 'pending' | 'completed';
  score?: number;
  maxScore: number;
  completedAt?: string;
  questionCount: number;
  timeLimit: number;
  passingScore: number;
}

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/student/assessments');
      const result = await response.json();
      if (result.success) {
        setAssessments(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const stats = {
    total: assessments.length,
    completed: assessments.filter((a) => a.status === 'completed').length,
    pending: assessments.filter((a) => a.status === 'pending').length,
    averageScore: assessments.length > 0
      ? Math.round(
          assessments
            .filter((a) => a.score !== undefined)
            .reduce((acc, a) => acc + ((a.score! / a.maxScore) * 100), 0) /
            assessments.filter((a) => a.score !== undefined).length
        )
      : 0,
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
          href="/student"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
        <p className="text-muted mt-1">
          Track your quizzes, tests, and assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Completed</p>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted">Pending</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-secondary/10">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted">Average Score</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.averageScore > 0 ? `${stats.averageScore}%` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-border text-foreground hover:bg-border/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Assessments List */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Your Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssessments.length > 0 ? (
            <div className="space-y-4">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        assessment.status === 'completed'
                          ? 'bg-success/10'
                          : 'bg-warning/10'
                      }`}
                    >
                      {assessment.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {assessment.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {assessment.courseTitle}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {assessment.questionCount} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {assessment.timeLimit} min
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          assessment.type === 'final'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary/10 text-secondary'
                        }`}>
                          {assessment.type === 'final' ? 'Final Exam' : 'Chapter Quiz'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {assessment.score !== undefined && (
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {assessment.score}/{assessment.maxScore}
                        </p>
                        <p className={`text-xs ${
                          (assessment.score / assessment.maxScore) * 100 >= assessment.passingScore
                            ? 'text-success'
                            : 'text-error'
                        }`}>
                          {Math.round((assessment.score / assessment.maxScore) * 100)}%
                          {(assessment.score / assessment.maxScore) * 100 >= assessment.passingScore
                            ? ' (Passed)'
                            : ' (Failed)'
                          }
                        </p>
                      </div>
                    )}
                    {assessment.status === 'pending' && (
                      <Link href={`/student/assessments/${assessment._id}`}>
                        <Button size="sm">Start</Button>
                      </Link>
                    )}
                    {assessment.status === 'completed' && (
                      <Link href={`/student/assessments/${assessment._id}/review`}>
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No assessments yet
              </h3>
              <p className="text-muted mb-4">
                Assessments will appear here as you progress through your courses
              </p>
              <Link href="/student/courses">
                <Button>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Go to Courses
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

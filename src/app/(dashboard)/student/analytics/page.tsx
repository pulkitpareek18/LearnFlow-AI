'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle,
  Flame,
  Brain,
  Trophy,
  Zap,
  Award,
  Activity,
  AlertCircle,
  TrendingDown,
  Star,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Spinner,
} from '@/components/ui';

interface ConceptMastery {
  conceptKey: string;
  masteryPercentage: number;
  lastPracticed?: Date;
  totalAttempts: number;
  correctAttempts: number;
}

interface StudyPattern {
  bestTimeToStudy: string;
  averageSessionDuration: number;
  mostProductiveDayOfWeek: string;
  totalSessions: number;
  peakPerformanceHours: number[];
}

interface ProgressDataPoint {
  date: string;
  modulesCompleted: number;
  accuracy: number;
  timeSpent: number;
}

interface StrengthWeaknessAnalysis {
  topStrengths: Array<{ concept: string; score: number }>;
  areasToImprove: Array<{ concept: string; score: number }>;
}

interface StudyRecommendation {
  type: 'focus_area' | 'study_schedule' | 'learning_tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface CourseProgressData {
  courseId: string;
  courseTitle: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  estimatedCompletionDate: string;
  daysRemaining: number;
  currentGrade: number;
  timeSpent: number;
}

interface RecentActivity {
  type: 'module_completed' | 'assessment_taken' | 'streak_achieved';
  title: string;
  description: string;
  timestamp: Date;
  score?: number;
}

interface AnalyticsData {
  overallStats: {
    totalCourses: number;
    completedCourses: number;
    activeCourses: number;
    totalModulesCompleted: number;
    totalTimeSpent: number;
    overallAccuracy: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    currentLevel: number;
  };
  conceptMastery: ConceptMastery[];
  studyPatterns: StudyPattern;
  weeklyProgress: ProgressDataPoint[];
  strengthWeakness: StrengthWeaknessAnalysis;
  courseProgress: CourseProgressData[];
  recentActivities: RecentActivity[];
  recommendations: StudyRecommendation[];
}

export default function StudentAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/student/analytics');
      const result = await response.json();

      if (result.success && result.data) {
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Unable to load analytics
        </h3>
        <p className="text-muted">Please try again later</p>
      </div>
    );
  }

  const { overallStats, conceptMastery, studyPatterns, weeklyProgress, strengthWeakness, courseProgress, recentActivities, recommendations } = analytics;

  // Format time helper
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get mastery color
  const getMasteryColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-error';
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    if (priority === 'high') return 'border-error text-error';
    if (priority === 'medium') return 'border-warning text-warning';
    return 'border-info text-info';
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertCircle className="w-4 h-4" />;
    if (priority === 'medium') return <Target className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

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
        <h1 className="text-3xl font-bold text-foreground">Learning Analytics</h1>
        <p className="text-muted mt-1">
          Comprehensive insights into your learning journey
        </p>
      </div>

      {/* Card 1: Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total XP</p>
              <p className="text-2xl font-bold text-foreground">{overallStats.totalXP}</p>
              <p className="text-xs text-muted">Level {overallStats.currentLevel}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-warning/10">
              <Flame className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">{overallStats.currentStreak}</p>
              <p className="text-xs text-muted">days</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Modules Completed</p>
              <p className="text-2xl font-bold text-foreground">{overallStats.totalModulesCompleted}</p>
              <p className="text-xs text-muted">{overallStats.totalCourses} courses</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Target className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted">Overall Accuracy</p>
              <p className="text-2xl font-bold text-foreground">{overallStats.overallAccuracy}%</p>
              <p className="text-xs text-muted">{formatTime(overallStats.totalTimeSpent)} total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card 2: Concept Mastery Heat Map */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Concept Mastery
          </CardTitle>
          <CardDescription>Your understanding across different concepts</CardDescription>
        </CardHeader>
        <CardContent>
          {conceptMastery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {conceptMastery.slice(0, 15).map((concept) => (
                <div
                  key={concept.conceptKey}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {concept.conceptKey}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${getMasteryColor(concept.masteryPercentage)}`}
                      style={{ width: `${concept.masteryPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{concept.masteryPercentage}%</span>
                    <span className="text-xs text-muted">{concept.totalAttempts} tries</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">
                Complete interactive modules to see concept mastery
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Card 3: Progress Over Time Chart */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Progress
            </CardTitle>
            <CardDescription>Modules completed and accuracy trend</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyProgress.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-2 h-40">
                  {weeklyProgress.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-border rounded-t-lg relative" style={{ height: '120px' }}>
                        <div
                          className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                          style={{ height: `${Math.min(100, (day.modulesCompleted / 3) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted">Avg Accuracy</p>
                    <p className="text-lg font-bold text-foreground">
                      {Math.round(weeklyProgress.reduce((sum, d) => sum + d.accuracy, 0) / weeklyProgress.length)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Time</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatTime(weeklyProgress.reduce((sum, d) => sum + d.timeSpent, 0))}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">Start learning to see progress trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Strength/Weakness Analysis */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Strengths & Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Strengths */}
              <div>
                <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Top Strengths
                </h4>
                {strengthWeakness.topStrengths.length > 0 ? (
                  <div className="space-y-2">
                    {strengthWeakness.topStrengths.map((strength, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{strength.concept}</span>
                        <span className="text-sm font-medium text-success">{strength.score}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">Keep learning to identify your strengths</p>
                )}
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="text-sm font-medium text-error mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Areas to Improve
                </h4>
                {strengthWeakness.areasToImprove.length > 0 ? (
                  <div className="space-y-2">
                    {strengthWeakness.areasToImprove.map((weakness, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{weakness.concept}</span>
                        <span className="text-sm font-medium text-error">{weakness.score}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">Great job! No weak areas identified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card 5: Study Patterns */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Study Patterns & Insights
          </CardTitle>
          <CardDescription>When you learn best</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted mb-1">Best Study Time</p>
              <p className="text-lg font-bold text-foreground">{studyPatterns.bestTimeToStudy}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/5">
              <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-sm text-muted mb-1">Avg Session</p>
              <p className="text-lg font-bold text-foreground">
                {formatTime(Math.floor(studyPatterns.averageSessionDuration / 60))}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/5">
              <Star className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm text-muted mb-1">Most Productive Day</p>
              <p className="text-lg font-bold text-foreground">{studyPatterns.mostProductiveDayOfWeek}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 6: Course Progress */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Progress & Predictions
          </CardTitle>
          <CardDescription>Track your progress and estimated completion dates</CardDescription>
        </CardHeader>
        <CardContent>
          {courseProgress.length > 0 ? (
            <div className="space-y-6">
              {courseProgress.map((course) => (
                <div key={course.courseId} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link
                        href={`/student/learn/${course.courseId}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {course.courseTitle}
                      </Link>
                      <p className="text-sm text-muted mt-1">
                        {course.completedModules} of {course.totalModules} modules • {formatTime(course.timeSpent)} spent
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">Grade: {course.currentGrade}%</p>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-border rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        course.progress >= 100
                          ? 'bg-success'
                          : course.progress >= 50
                          ? 'bg-primary'
                          : 'bg-warning'
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{course.progress}% complete</span>
                    {course.daysRemaining < 999 ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Est. {course.daysRemaining} days remaining
                      </span>
                    ) : (
                      <span>Continue learning to get estimate</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No courses enrolled yet</p>
              <Link href="/student/browse">
                <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  Browse Courses
                </button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Card 7: Recent Activity Timeline */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      {activity.type === 'module_completed' && <CheckCircle className="w-4 h-4 text-success" />}
                      {activity.type === 'assessment_taken' && <Award className="w-4 h-4 text-primary" />}
                      {activity.type === 'streak_achieved' && <Flame className="w-4 h-4 text-warning" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted">{activity.description}</p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {activity.score !== undefined && (
                      <span className="text-sm font-medium text-success">{activity.score}%</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 8: Personalized Recommendations */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(rec.priority)} bg-card`}
                  >
                    <div className="flex items-start gap-2">
                      {getPriorityIcon(rec.priority)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">{rec.title}</p>
                        <p className="text-xs text-muted">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">Keep learning to get personalized recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
